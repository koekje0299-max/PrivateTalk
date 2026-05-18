import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory stores
const users = new Map(); // userId -> { userId, displayName, publicKey, createdAt }
const contacts = new Map(); // userId -> Set of contact userIds
const messages = new Map(); // messageId -> { id, from, to, content, encryptedBlob, createdAt }
const conversations = new Map(); // userId -> { contactId -> messages[] }

const relayNodes = [
  { id: '1', name: 'Australia', host: 'au-relay.privatetalk.io', region: 'OC' },
  { id: '2', name: 'Germany', host: 'de-relay.privatetalk.io', region: 'EU' },
  { id: '3', name: 'Brazil', host: 'br-relay.privatetalk.io', region: 'SA' },
  { id: '4', name: 'USA', host: 'us-relay.privatetalk.io', region: 'NA' },
  { id: '5', name: 'Japan', host: 'jp-relay.privatetalk.io', region: 'AS' }
];

// Auth & Registration
app.post('/auth/register', (req, res) => {
  const { displayName, publicKey } = req.body;
  const userId = uuidv4();
  const user = {
    userId,
    displayName: displayName || `User-${userId.substring(0, 6)}`,
    publicKey: publicKey || '',
    createdAt: Date.now()
  };
  users.set(userId, user);
  contacts.set(userId, new Set());
  conversations.set(userId, new Map());
  
  res.json({ success: true, userId, user });
});

app.get('/auth/me/:userId', (req, res) => {
  const user = users.get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// User Discovery
app.get('/users/:userId', (req, res) => {
  const user = users.get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ 
    userId: user.userId, 
    displayName: user.displayName,
    createdAt: user.createdAt
  });
});

// Contact Management
app.post('/contacts/add', (req, res) => {
  const { userId, contactId } = req.body;
  if (!userId || !contactId) {
    return res.status(400).json({ error: 'userId and contactId required' });
  }
  
  // Add to user's contacts
  if (!contacts.has(userId)) contacts.set(userId, new Set());
  contacts.get(userId).add(contactId);
  
  // Add reverse
  if (!contacts.has(contactId)) contacts.set(contactId, new Set());
  contacts.get(contactId).add(userId);
  
  // Initialize conversation
  if (!conversations.has(userId)) conversations.set(userId, new Map());
  if (!conversations.get(userId).has(contactId)) {
    conversations.get(userId).set(contactId, []);
  }
  
  res.json({ success: true });
});

app.get('/contacts/:userId', (req, res) => {
  const userContacts = contacts.get(req.params.userId) || new Set();
  const contactList = [];
  
  for (const contactId of userContacts) {
    const user = users.get(contactId);
    if (user) {
      contactList.push({
        userId: user.userId,
        displayName: user.displayName,
        online: false
      });
    }
  }
  
  res.json({ contacts: contactList });
});

// Messaging
app.post('/messages/send', (req, res) => {
  const { from, to, content, encryptedBlob } = req.body;
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to required' });
  }
  
  const messageId = uuidv4();
  const message = {
    id: messageId,
    from,
    to,
    content: content || '',
    encryptedBlob: encryptedBlob || '',
    createdAt: Date.now()
  };
  
  messages.set(messageId, message);
  
  // Store in conversation
  if (!conversations.has(from)) conversations.set(from, new Map());
  if (!conversations.get(from).has(to)) conversations.get(from).set(to, []);
  conversations.get(from).get(to).push(message);
  
  // Route to recipient via Socket.IO
  io.to(to).emit('new-message', {
    id: messageId,
    from,
    content: content || encryptedBlob,
    time: new Date(message.createdAt).toISOString()
  });
  
  res.json({ success: true, messageId });
});

app.get('/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const { with: contactId } = req.query;
  
  if (contactId) {
    // Get conversation between two users
    const conv = conversations.get(userId)?.get(contactId) || [];
    res.json({ messages: conv });
  } else {
    // Get all messages for user
    const allMsgs = [];
    const userConvs = conversations.get(userId);
    if (userConvs) {
      for (const [otherId, msgs] of userConvs) {
        allMsgs.push(...msgs);
      }
    }
    res.json({ messages: allMsgs.sort((a, b) => a.createdAt - b.createdAt) });
  }
});

// Relay nodes
app.get('/messages/relays', (req, res) => {
  res.json({ nodes: relayNodes.map(n => n.name) });
});

// Calls
app.get('/calls/ice-servers', (req, res) => {
  res.json({
    servers: relayNodes.map(n => ({
      urls: `stun:${n.host}`,
      username: n.id,
      credential: 'privatetalk-anonymous'
    }))
  });
});

app.post('/calls/signal', (req, res) => {
  const { from, to, sdp, candidate } = req.body;
  io.to(to).emit('call-signal', { from, sdp, candidate });
  res.json({ success: true });
});

// Attachments
const upload = multer({ storage: multer.memoryStorage() });
app.post('/attachments/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileId = uuidv4();
  res.json({ success: true, fileId, filename: req.file.originalname });
});

app.get('/attachments/download/:filename', (req, res) => {
  res.status(404).json({ error: 'File not found' });
});

// Health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: Math.floor(process.uptime()),
    users: users.size,
    nodes: relayNodes.length 
  });
});

// Socket.IO
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} connected`);
  }
  
  socket.on('join', (id) => {
    socket.join(id);
  });
  
  socket.on('send-message', ({ to, message }) => {
    if (!userId || !to) return;
    const messageId = uuidv4();
    const msgObj = {
      id: messageId,
      from: userId,
      content: message,
      time: new Date().toISOString()
    };
    
    if (!conversations.has(userId)) conversations.set(userId, new Map());
    if (!conversations.get(userId).has(to)) conversations.get(userId).set(to, []);
    conversations.get(userId).get(to).push({ ...msgObj, to, createdAt: Date.now() });
    
    io.to(to).emit('new-message', msgObj);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`PrivateTalk backend running on port ${PORT}`);
  console.log(`Users: ${users.size} | Relay nodes: ${relayNodes.length}`);
});
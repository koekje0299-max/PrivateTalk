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

// In-memory store (replace with Turso/SQLite in production)
const users = new Map();
const messages = new Map();
const relayNodes = [
  { id: '1', name: 'Australia', host: 'au-relay.privatetalk.io', publicKey: 'AU_KEY', region: 'OC' },
  { id: '2', name: 'Germany', host: 'de-relay.privatetalk.io', publicKey: 'DE_KEY', region: 'EU' },
  { id: '3', name: 'Brazil', host: 'br-relay.privatetalk.io', publicKey: 'BR_KEY', region: 'SA' },
  { id: '4', name: 'USA', host: 'us-relay.privatetalk.io', publicKey: 'US_KEY', region: 'NA' },
  { id: '5', name: 'Japan', host: 'jp-relay.privatetalk.io', publicKey: 'JP_KEY', region: 'AS' }
];

// Auth routes
app.post('/auth/register', (req, res) => {
  const { userId, publicKey } = req.body;
  if (!userId || !publicKey) {
    return res.status(400).json({ error: 'userId and publicKey required' });
  }
  users.set(userId, { publicKey, createdAt: Date.now() });
  res.json({ success: true, userId });
});

app.post('/auth/key-exchange', (req, res) => {
  const { userId, ephemeralKey } = req.body;
  res.json({ success: true, sessionId: uuidv4() });
});

// Message routes
app.post('/messages/send', (req, res) => {
  const { from, to, message, encryptedBlob } = req.body;
  const msgId = uuidv4();
  messages.set(msgId, { from, to, encryptedBlob, createdAt: Date.now(), status: 'delivered' });
  io.to(to).emit('new-message', { id: msgId, text: message, sender: from, time: new Date().toISOString() });
  res.json({ success: true, messageId: msgId });
});

app.get('/messages/:conversationId', (req, res) => {
  const msgs = Array.from(messages.values()).filter(m => m.to === req.params.conversationId);
  res.json({ messages: msgs });
});

app.get('/messages/relays', (req, res) => {
  res.json({ nodes: relayNodes.map(n => n.name) });
});

// Call routes
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

// Attachment routes
const upload = multer({ storage: multer.memoryStorage() });
app.post('/attachments/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileId = uuidv4();
  res.json({ success: true, fileId, filename: req.file.originalname });
});

app.get('/attachments/download/:filename', (req, res) => {
  res.json({ error: 'File not found' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), nodes: relayNodes.length });
});

// Socket.IO
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} connected`);
  }
  
  socket.on('join', (userId) => {
    socket.join(userId);
  });
  
  socket.on('send-message', ({ to, message }) => {
    const msgId = uuidv4();
    io.to(to).emit('new-message', { id: msgId, text: message, sender: userId, time: new Date().toISOString() });
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`PrivateTalk backend running on port ${PORT}`);
  console.log(`Relay nodes: ${relayNodes.length} active`);
});
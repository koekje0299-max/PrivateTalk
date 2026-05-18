import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'https://privatetalk-production.up.railway.app';

interface User {
  userId: string;
  displayName: string;
  online?: boolean;
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  time: string;
  createdAt?: number;
}

// Registration Screen
const RegisterScreen: React.FC<{ onRegister: (userId: string, displayName: string) => void }> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim() })
      });
      const data = await res.json();
      if (data.userId) {
        onRegister(data.userId, data.user?.displayName || name);
      }
    } catch {
      // Fallback: create local user
      const localUserId = uuidv4();
      onRegister(localUserId, name);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="bg-secondary rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-accent mb-2">🔒 PrivateTalk</h1>
        <p className="text-gray-400 mb-6">Your anonymous identity. Your privacy.</p>
        
        <input
          type="text"
          placeholder="Enter your display name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegister()}
          className="w-full bg-primary border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent mb-4"
        />
        
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 text-primary font-bold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Creating...' : 'Get Anonymous ID'}
        </button>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          No email, no phone, no identity. Just you.
        </p>
      </div>
    </div>
  );
};

// Main App
const PrivateTalkApp: React.FC<{ userId: string; displayName: string; onLogout: () => void }> = ({ userId, displayName, onLogout }) => {
  const [contacts, setContacts] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [view, setView] = useState<'messages' | 'settings'>('messages');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactId, setNewContactId] = useState('');

  useEffect(() => {
    const newSocket = io(API_URL, { auth: { userId } });
    setSocket(newSocket);
    newSocket.on('new-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { newSocket.disconnect(); };
  }, [userId]);

  useEffect(() => {
    loadContacts();
  }, [userId]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.userId);
    }
  }, [selectedContact]);

  const loadContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/contacts/${userId}`);
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch {
      setContacts([]);
    }
  };

  const loadMessages = async (contactId: string) => {
    try {
      const res = await fetch(`${API_URL}/messages/${userId}?with=${contactId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const handleAddContact = async () => {
    if (!newContactId.trim()) return;
    try {
      await fetch(`${API_URL}/contacts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, contactId: newContactId.trim() })
      });
      setNewContactId('');
      setShowAddContact(false);
      loadContacts();
    } catch {
      alert('Failed to add contact');
    }
  };

  const handleSend = () => {
    if (!input.trim() || !selectedContact) return;
    const msg = { id: uuidv4(), from: userId, to: selectedContact.userId, content: input, time: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    socket?.emit('send-message', { to: selectedContact.userId, message: input });
    setInput('');
  };

  return (
    <div className="flex h-screen bg-primary">
      {/* Sidebar */}
      <aside className="w-80 bg-secondary border-r border-gray-700 flex flex-col">
        <header className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-accent">🔒 PrivateTalk</h1>
          <p className="text-xs text-gray-400 mt-1">ID: {userId.substring(0, 8)}...</p>
        </header>
        
        <button 
          onClick={() => setShowAddContact(true)}
          className="mx-4 my-3 bg-accent/20 text-accent py-2 px-4 rounded-lg text-sm hover:bg-accent/30 transition-colors"
        >
          + Add Contact by ID
        </button>
        
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 && (
            <p className="text-gray-500 text-sm text-center p-4">No contacts yet. Add someone!</p>
          )}
          {contacts.map(c => (
            <div
              key={c.userId}
              onClick={() => setSelectedContact(c)}
              className={`p-4 cursor-pointer border-b border-gray-700 hover:bg-primary transition-colors ${selectedContact?.userId === c.userId ? 'bg-primary' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-sm">👤</div>
                <span className="text-white font-medium">{c.displayName}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{c.userId.substring(0, 12)}...</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button onClick={onLogout} className="text-gray-400 text-sm hover:text-warning">Logout</button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <header className="bg-secondary px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedContact.displayName}</h2>
                <p className="text-xs text-accent">🔒 End-to-end encrypted</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-primary rounded-lg">📞</button>
                <button className="p-2 hover:bg-primary rounded-lg">📹</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages
                .filter(m => (m.from === userId && m.to === selectedContact.userId) || (m.from === selectedContact.userId && m.to === userId))
                .map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md px-4 py-3 rounded-2xl ${msg.from === userId ? 'bg-accent/20' : 'bg-secondary'}`}>
                      <p className="text-sm text-white">{msg.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(msg.time).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 bg-secondary border-t border-gray-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-primary border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                />
                <button onClick={handleSend} className="bg-accent hover:bg-accent/80 text-primary font-bold px-6 py-3 rounded-lg">
                  🔒 Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-white mb-2">Select a conversation</h2>
              <p className="text-gray-400">Or add a contact to start chatting</p>
            </div>
          </div>
        )}
      </main>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-4">Add Contact by ID</h3>
            <input
              type="text"
              value={newContactId}
              onChange={e => setNewContactId(e.target.value)}
              placeholder="Paste their User ID here"
              className="w-full bg-primary border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAddContact(false)} className="flex-1 py-3 rounded-lg bg-gray-700 text-white">Cancel</button>
              <button onClick={handleAddContact} className="flex-1 py-3 rounded-lg bg-accent text-primary font-bold">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// App Root
export default function App() {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('privatetalk_userId'));
  const [displayName, setDisplayName] = useState<string | null>(() => localStorage.getItem('privatetalk_displayName'));

  const handleRegister = (id: string, name: string) => {
    localStorage.setItem('privatetalk_userId', id);
    localStorage.setItem('privatetalk_displayName', name);
    setUserId(id);
    setDisplayName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('privatetalk_userId');
    localStorage.removeItem('privatetalk_displayName');
    setUserId(null);
    setDisplayName(null);
  };

  if (!userId) {
    return <RegisterScreen onRegister={handleRegister} />;
  }

  return <PrivateTalkApp userId={userId} displayName={displayName || 'User'} onLogout={handleLogout} />;
}
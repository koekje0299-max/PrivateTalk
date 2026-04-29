import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ConversationList from './components/ConversationList';
import ChatView from './components/ChatView';
import SettingsScreen from './components/SettingsScreen';
import VoiceCallView from './components/VoiceCallView';
import VideoCallView from './components/VideoCallView';
import CameraView from './components/CameraView';
import AttachmentPreview from './components/AttachmentPreview';
import { wrapOnion, encryptFor } from './services/crypto';

const App: React.FC = () => {
  const [view, setView] = useState<'messages' | 'settings' | 'voice-call' | 'video-call' | 'camera'>('messages');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; name: string; lastMessage: string; unread: number }>>([]);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'me' | 'them'; time: string; encrypted: boolean }>>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userId] = useState(() => Math.random().toString(36).substring(7));
  const [relayNodes, setRelayNodes] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    setSocket(newSocket);
    newSocket.emit('join', userId);
    newSocket.on('new-message', (msg: { id: string; text: string; sender: string; time: string }) => {
      setMessages(prev => [...prev, { id: msg.id, text: msg.text, sender: 'them', time: msg.time, encrypted: true }]);
    });
    fetchRelayNodes();
    return () => { newSocket.disconnect(); };
  }, [userId]);

  const fetchRelayNodes = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/relays`);
      const data = await res.json();
      setRelayNodes(data.nodes || ['Australia', 'Germany', 'Brazil']);
    } catch {
      setRelayNodes(['Australia', 'Germany', 'Brazil', 'USA', 'Japan']);
    }
  };

  const handleSendMessage = async (text: string) => {
    const encryptedBlob = await wrapOnion(text, relayNodes);
    const msg = { id: Date.now().toString(), text: encryptedBlob, sender: 'me', time: new Date().toISOString(), encrypted: true };
    setMessages(prev => [...prev, msg]);
    socket?.emit('send-message', { to: selectedConversation, message: encryptedBlob });
  };

  const startCall = (type: 'voice' | 'video') => setView(type === 'voice' ? 'voice-call' : 'video-call');

  return (
    <div className="flex h-screen bg-primary">
      <aside className="w-80 bg-secondary border-r border-gray-700 flex flex-col">
        <header className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-accent">🔒 PrivateTalk</h1>
        </header>
        <ConversationList conversations={conversations} onSelect={(id) => { setSelectedConversation(id); setView('messages'); }} selectedId={selectedConversation} />
      </aside>
      <main className="flex-1 flex flex-col">
        {view === 'messages' && (
          <ChatView
            conversationId={selectedConversation}
            messages={messages}
            onSend={handleSendMessage}
            onStartCall={startCall}
            relayNodes={relayNodes}
          />
        )}
        {view === 'settings' && <SettingsScreen userId={userId} />}
        {view === 'voice-call' && <VoiceCallView onEnd={() => setView('messages')} />}
        {view === 'video-call' && <VideoCallView onEnd={() => setView('messages')} />}
        {view === 'camera' && (
          <div className="relative">
            <CameraView onCapture={(blob) => { console.log('Captured:', blob); setView('messages'); }} onClose={() => setView('messages')} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
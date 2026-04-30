import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import ConversationList from './components/ConversationList';
import ChatView from './components/ChatView';
import SettingsScreen from './components/SettingsScreen';
import VoiceCallView from './components/VoiceCallView';
import VideoCallView from './components/VideoCallView';
import CameraView from './components/CameraView';
import { wrapOnion } from './services/crypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const App: React.FC = () => {
  const [view, setView] = useState<'messages' | 'settings' | 'voice-call' | 'video-call' | 'camera'>('messages');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations] = useState<Array<{ id: string; name: string; lastMessage: string; unread: number }>>([]);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'me' | 'them'; time: string; encrypted: boolean }>>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userId] = useState(() => Math.random().toString(36).substring(7));
  const [relayNodes, setRelayNodes] = useState<string[]>(['Australia', 'Germany', 'Brazil']);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    newSocket.emit('join', userId);
    newSocket.on('new-message', (msg: { id: string; text: string; sender: string; time: string }) => {
      setMessages(prev => [...prev, { id: msg.id, text: msg.text, sender: 'them' as const, time: msg.time, encrypted: true }]);
    });
    setRelayNodes(['Australia', 'Germany', 'Brazil', 'USA', 'Japan']);
    return () => { newSocket.disconnect(); };
  }, [userId]);

  const handleSendMessage = async (text: string) => {
    const encryptedBlob = await wrapOnion(text, relayNodes);
    const newMsg = { id: Date.now().toString(), text: encryptedBlob, sender: 'me' as const, time: new Date().toISOString(), encrypted: true };
    setMessages(prev => [...prev, newMsg]);
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
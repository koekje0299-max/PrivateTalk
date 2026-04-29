import React, { useState } from 'react';
import MessageBubble from './MessageBubble';
import RoutingVisualization from './RoutingVisualization';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  encrypted: boolean;
}

interface Props {
  conversationId: string | null;
  messages: Message[];
  onSend: (text: string) => void;
  onStartCall: (type: 'voice' | 'video') => void;
  relayNodes: string[];
}

const ChatView: React.FC<Props> = ({ conversationId, messages, onSend, onStartCall, relayNodes }) => {
  const [input, setInput] = useState('');
  const [showRouting, setShowRouting] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-secondary px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {conversationId ? `Conversation ${conversationId}` : 'Select a conversation'}
          </h2>
          <p className="text-xs text-accent flex items-center gap-1">
            🔒 End-to-end encrypted
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onStartCall('voice')} className="p-2 hover:bg-primary rounded-lg transition-colors" title="Voice call">📞</button>
          <button onClick={() => onStartCall('video')} className="p-2 hover:bg-primary rounded-lg transition-colors" title="Video call">📹</button>
          <button onClick={() => setShowRouting(!showRouting)} className="p-2 hover:bg-primary rounded-lg transition-colors text-accent" title="Routing info">ℹ️</button>
        </div>
      </header>

      {showRouting && <RoutingVisualization nodes={relayNodes} />}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg.text} sender={msg.sender} time={msg.time} encrypted={msg.encrypted} />
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
          <button
            onClick={handleSend}
            className="bg-accent hover:bg-accent/80 text-primary font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            🔒 Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
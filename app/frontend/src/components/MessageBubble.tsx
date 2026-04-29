import React from 'react';

interface Props {
  message: string;
  sender: 'me' | 'them';
  time: string;
  encrypted: boolean;
}

const MessageBubble: React.FC<Props> = ({ message, sender, time, encrypted }) => {
  return (
    <div className={`flex ${sender === 'me' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md px-4 py-3 rounded-2xl ${sender === 'me' ? 'bg-accent/20 text-white' : 'bg-secondary text-white'}`}>
        <div className="flex items-start gap-2">
          <span className="text-sm">{encrypted ? '🔒' : '⚠️'}</span>
          <p className="text-sm break-all">{message}</p>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">{new Date(time).toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
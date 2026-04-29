import React, { useState } from 'react';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  unread: number;
}

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const ConversationList: React.FC<Props> = ({ conversations, onSelect, selectedId }) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-primary border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-sm">
            No conversations yet
          </div>
        )}
        {filtered.map(conv => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`p-4 cursor-pointer border-b border-gray-700 hover:bg-primary transition-colors ${selectedId === conv.id ? 'bg-primary' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-white">{conv.name}</span>
              {conv.unread > 0 && (
                <span className="bg-accent text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center">{conv.unread}</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1 truncate flex items-center gap-1">
              🔒 {conv.lastMessage || 'Encrypted message'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
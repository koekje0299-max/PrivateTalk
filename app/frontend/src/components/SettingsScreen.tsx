import React from 'react';

interface Props {
  userId: string;
}

const SettingsScreen: React.FC<Props> = ({ userId }) => {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-2xl font-semibold text-white mb-6">⚙️ Settings</h2>
      <div className="space-y-6">
        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">🔑 Identity</h3>
          <p className="text-xs text-gray-400 mb-2">Your anonymous ID</p>
          <code className="text-accent text-sm bg-primary px-3 py-2 rounded block">{userId}</code>
        </div>
        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">🔒 Security</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Perfect Forward Secrecy</span>
              <span className="text-accent">✅ Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Onion Encryption</span>
              <span className="text-accent">✅ Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Multi-hop Routing</span>
              <span className="text-accent">✅ Active</span>
            </div>
          </div>
        </div>
        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">🌍 Routing</h3>
          <p className="text-xs text-gray-400 mb-2">Active relay nodes</p>
          <div className="flex flex-wrap gap-2">
            {['Australia', 'Germany', 'Brazil', 'USA', 'Japan'].map(n => (
              <span key={n} className="text-xs bg-primary text-accent px-2 py-1 rounded border border-accent/30">{n}</span>
            ))}
          </div>
        </div>
        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">📱 Privacy</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-accent" />
              Auto-delete messages
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-accent" />
              Hide IP from relay nodes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-accent" />
              Metadata minimization
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
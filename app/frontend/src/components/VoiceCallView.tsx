import React, { useState } from 'react';

interface Props {
  onEnd: () => void;
}

const VoiceCallView: React.FC<Props> = ({ onEnd }) => {
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-primary">
      <div className="text-6xl mb-6">📞</div>
      <h2 className="text-2xl font-semibold text-white mb-2">Voice Call</h2>
      <p className="text-accent mb-8">🔒 Encrypted · Relay routed</p>
      <p className="text-3xl font-mono text-white mb-8">{formatTime(duration)}</p>
      <div className="flex gap-6">
        <button onClick={() => setMuted(!muted)} className={`p-4 rounded-full transition-colors ${muted ? 'bg-warning' : 'bg-secondary'} hover:opacity-80`}>
          {muted ? '🔇' : '🎤'}
        </button>
        <button onClick={onEnd} className="p-4 rounded-full bg-warning hover:bg-warning/80 transition-colors">
          📴
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-8">Routed via: Australia → Germany → Brazil</p>
    </div>
  );
};

export default VoiceCallView;
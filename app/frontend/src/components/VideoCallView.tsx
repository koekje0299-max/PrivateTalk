import React, { useState } from 'react';

interface Props {
  onEnd: () => void;
}

const VideoCallView: React.FC<Props> = ({ onEnd }) => {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-primary relative">
      <div className="absolute top-4 left-4 bg-secondary/80 px-3 py-1 rounded-lg">
        <span className="text-xs text-accent flex items-center gap-1">🔒 E2EE Active</span>
      </div>
      <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl">👤</span>
      </div>
      <h2 className="text-xl font-semibold text-white mb-1">Video Call</h2>
      <p className="text-gray-400 text-sm mb-2">Relay routed · Zero metadata</p>
      <p className="text-2xl font-mono text-accent mb-6">{formatTime(duration)}</p>
      <div className="flex gap-6">
        <button onClick={() => setMuted(!muted)} className={`p-4 rounded-full transition-colors ${muted ? 'bg-warning' : 'bg-secondary'}`}>
          {muted ? '🔇' : '🎤'}
        </button>
        <button onClick={() => setVideoOff(!videoOff)} className={`p-4 rounded-full transition-colors ${videoOff ? 'bg-warning' : 'bg-secondary'}`}>
          {videoOff ? '🚫' : '📹'}
        </button>
        <button onClick={onEnd} className="p-4 rounded-full bg-warning hover:bg-warning/80 transition-colors">
          📴
        </button>
      </div>
      <div className="absolute bottom-4 text-xs text-gray-500">Routed via: Australia → Germany → Brazil → USA</div>
    </div>
  );
};

export default VideoCallView;
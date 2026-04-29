import React, { useRef, useState } from 'react';

interface Props {
  onCapture: (blob: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<Props> = ({ onCapture, onClose }) => {
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [captured, setCaptured] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    if (videoRef.current) {
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setCaptured(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <span className="text-accent text-sm flex items-center gap-1">🔒 Encrypted Viewfinder</span>
        <button onClick={onClose} className="text-white text-2xl hover:text-accent">✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {captured ? (
          <img src={captured} alt="Captured" className="max-h-full max-w-full" />
        ) : (
          <div className="text-center">
            <div className="w-64 h-48 bg-secondary rounded-lg flex items-center justify-center mb-4">
              <span className="text-gray-500">Camera preview</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-6 flex justify-center gap-6 bg-black/80">
        <button onClick={() => setMode('photo')} className={`px-4 py-2 rounded ${mode === 'photo' ? 'bg-accent text-primary' : 'bg-secondary text-white'}`}>📷 Photo</button>
        <button onClick={() => setMode('video')} className={`px-4 py-2 rounded ${mode === 'video' ? 'bg-accent text-primary' : 'bg-secondary text-white'}`}>🎥 Video</button>
        <button onClick={handleCapture} className="px-6 py-2 bg-accent text-primary font-semibold rounded-full">
          {captured ? 'Retake' : '🔒 Capture'}
        </button>
        {captured && (
          <button onClick={() => onCapture(captured)} className="px-6 py-2 bg-warning text-white font-semibold rounded-full">
            Send
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraView;
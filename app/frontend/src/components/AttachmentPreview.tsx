import React, { useState } from 'react';

interface Props {
  attachment: { url: string; name: string; type: 'image' | 'video' | 'file' };
  onClose: () => void;
}

const AttachmentPreview: React.FC<Props> = ({ attachment, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full p-4">
        <button onClick={onClose} className="absolute top-2 right-2 text-white text-2xl hover:text-accent z-10">✕</button>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-accent">🔒</span>
          <span className="text-white text-sm">E2EE Attachment</span>
        </div>
        {attachment.type === 'image' && (
          <img src={attachment.url} alt={attachment.name} className="max-w-full max-h-screen rounded-lg" />
        )}
        {attachment.type === 'video' && (
          <video src={attachment.url} controls className="max-w-full max-h-screen rounded-lg" />
        )}
        {attachment.type === 'file' && (
          <div className="bg-secondary p-6 rounded-lg text-center">
            <span className="text-4xl mb-4 block">📄</span>
            <p className="text-white">{attachment.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentPreview;
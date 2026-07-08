import React from 'react';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  url: string | null;
  onClose: () => void;
}

export function VideoPlayerModal({ url, onClose }: VideoPlayerModalProps) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8 animate-fadeIn">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl aspect-video overflow-hidden shadow-2xl animate-scaleUp flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full border border-slate-700/50 shadow-md transition outline-none cursor-pointer"
          title="Close Video"
        >
          <X size={18} />
        </button>
        <video
          className="w-full h-full object-contain"
          controls
          autoPlay
          crossOrigin="use-credentials"
          src={url}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}

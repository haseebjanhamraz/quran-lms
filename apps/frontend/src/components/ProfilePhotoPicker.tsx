'use client';

import React, { useState, useRef } from 'react';
import { Upload, Camera, Trash2, Check, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

import { getImageUrl } from '@/utils/image';
import { apiFetch } from '@/utils/apiFetch';

interface ProfilePhotoPickerProps {
  currentPhotoUrl?: string;
  onPhotoSelected: (url: string) => void;
  className?: string;
}

export default function ProfilePhotoPicker({
  currentPhotoUrl,
  onPhotoSelected,
  className = '',
}: ProfilePhotoPickerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setPreviewUrl(currentPhotoUrl || null);
  }, [currentPhotoUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setCropModalOpen(true);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const processAndUploadCroppedImage = async () => {
    if (!imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400; // 1:1 400x400 output
    canvas.width = size;
    canvas.height = size;

    const img = imgRef.current;
    const minDim = Math.min(img.width, img.height);
    const cropWidth = minDim / zoom;
    const cropHeight = minDim / zoom;
    const cropX = (img.width - cropWidth) / 2;
    const cropY = (img.height - cropHeight) / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      size,
      size
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', blob, 'avatar.png');

        // Primary: standalone upload endpoint
        let res = await apiFetch(`${API_URL}/users/upload-avatar`, {
          method: 'POST',
          body: formData,
        });

        // Fallback to self profile picture endpoint if 404
        if (res.status === 404) {
          res = await apiFetch(`${API_URL}/users/profile/picture`, {
            method: 'POST',
            body: formData,
          });
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to upload photo');
        }

        const data = await res.json();
        const uploadedUrl = data.filePath || data.profilePicture;
        setPreviewUrl(uploadedUrl);
        onPhotoSelected(uploadedUrl);
        setCropModalOpen(false);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    }, 'image/png');
  };

  const clearPhoto = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    onPhotoSelected('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFullImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="relative group">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-primary/40 bg-muted/30 flex items-center justify-center overflow-hidden shadow-inner relative transition-all group-hover:border-primary">
          {previewUrl ? (
            <img
              src={getImageUrl(previewUrl)}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
              <Camera className="h-8 w-8 mb-1 opacity-70" />
              <span className="text-[10px] font-semibold">1:1 Photo</span>
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-xs font-semibold"
          >
            <Upload className="h-5 w-5 mb-1" />
            <span>{previewUrl ? 'Change' : 'Upload'}</span>
          </div>
        </div>

        {previewUrl && (
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground p-1 rounded-full shadow-md hover:bg-destructive/90 transition-colors"
            title="Remove Photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{previewUrl ? 'Change Profile Picture' : 'Select 1:1 Profile Photo'}</span>
        </button>
      </div>

      {error && <p className="text-xs text-destructive font-semibold">{error}</p>}

      {/* 1:1 Image Crop & Resizing Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border flex flex-col items-center space-y-4">
            <h3 className="text-lg font-bold text-foreground">Resize & Crop Photo (1:1 Ratio)</h3>

            {/* Hidden canvas for actual rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Square 1:1 Crop Viewport Preview */}
            <div className="w-64 h-64 border-2 border-brand rounded-2xl overflow-hidden relative bg-black/90 flex items-center justify-center shadow-lg">
              {selectedFile && (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Crop preview"
                  style={{ transform: `scale(${zoom})` }}
                  className="max-w-none max-h-none h-full w-full object-cover transition-transform duration-100"
                />
              )}
              <div className="absolute inset-0 border border-white/30 pointer-events-none rounded-2xl">
                <div className="w-full h-full border border-dashed border-white/50" />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3 w-full max-w-xs justify-center">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 w-full justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={processAndUploadCroppedImage}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Crop & Save Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/audio/pop.mp3');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silently catch autoplay policy errors before first user interaction
      });
    } catch {
      // Ignore audio error
    }
  }, []);

  return { playNotificationSound };
}

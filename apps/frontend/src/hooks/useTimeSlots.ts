'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/utils/apiFetch';

export const DEFAULT_TIME_SLOTS = [
  '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
  '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30', '12:30 - 01:00',
  '01:00 - 01:30', '01:30 - 02:00', '02:00 - 02:30', '02:30 - 03:00'
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let cachedTimeSlots: string[] | null = null;
let inflightPromise: Promise<string[]> | null = null;
const listeners = new Set<(slots: string[]) => void>();

function notifyListeners(slots: string[]) {
  if (cachedTimeSlots && JSON.stringify(cachedTimeSlots) === JSON.stringify(slots)) {
    return;
  }
  cachedTimeSlots = slots;
  listeners.forEach((listener) => listener(slots));
}

async function fetchTimeSlotsFromApi(force = false): Promise<string[]> {
  if (cachedTimeSlots && !force) {
    return cachedTimeSlots;
  }
  if (inflightPromise && !force) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const res = await apiFetch(`${API_URL}/system-settings/time-slots`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.slots) && data.slots.length > 0) {
          const clean = data.slots.map((s: any) => String(s).trim()).filter(Boolean);
          notifyListeners(clean);
          return clean;
        }
      }
    } catch (_) {}

    const fallback = cachedTimeSlots || DEFAULT_TIME_SLOTS;
    notifyListeners(fallback);
    return fallback;
  })().finally(() => {
    inflightPromise = null;
  });

  return inflightPromise;
}

export function useTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<string[]>(cachedTimeSlots || DEFAULT_TIME_SLOTS);
  const [loading, setLoading] = useState<boolean>(!cachedTimeSlots);
  const isMountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const slots = await fetchTimeSlotsFromApi(true);
      if (isMountedRef.current) {
        setTimeSlots(slots);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const listener = (slots: string[]) => {
      if (isMountedRef.current) {
        setTimeSlots(slots);
        setLoading(false);
      }
    };
    listeners.add(listener);

    if (!cachedTimeSlots) {
      fetchTimeSlotsFromApi(false).then((slots) => {
        if (isMountedRef.current) {
          setTimeSlots(slots);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      listeners.delete(listener);
    };
  }, []);

  const saveTimeSlots = useCallback(async (newSlots: string[]) => {
    const res = await apiFetch(`${API_URL}/system-settings/time-slots`, {
      method: 'PUT',
      body: JSON.stringify({ slots: newSlots }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to save time slots');
    }

    const data = await res.json();
    const saved = Array.isArray(data.slots) ? data.slots : newSlots;
    notifyListeners(saved);
    return saved;
  }, []);

  return {
    timeSlots,
    loading,
    refetch,
    saveTimeSlots,
  };
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export interface WebSocketMessage {
  event: string;
  action?: string;
  payload?: any;
  senderClientId?: string;
  targetTeacherId?: string;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  eventFilter?: string | string[];
  onMessage?: (data: WebSocketMessage) => void;
}

type Listener = {
  filter?: string | string[];
  callback?: (data: WebSocketMessage) => void;
};

// Singleton WebSocket Manager state
let globalWs: WebSocket | null = null;
let globalIsConnected = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const statusListeners = new Set<(connected: boolean) => void>();
const messageListeners = new Set<Listener>();
let registeredUser: { id: string; role?: string } | null = null;

function notifyStatus(connected: boolean) {
  globalIsConnected = connected;
  statusListeners.forEach((listener) => {
    try {
      listener(connected);
    } catch (_) {}
  });
}

function getWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:5001';
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;

  const isSecure = window.location.protocol === 'https:';
  const protocol = isSecure ? 'wss:' : 'ws:';
  
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${protocol}//${window.location.host}/ws`;
  }
  return `${protocol}//${window.location.hostname}:5001`;
}

function sendAuthRegistration(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN && registeredUser?.id) {
    ws.send(JSON.stringify({
      event: 'register',
      userId: registeredUser.id,
      role: registeredUser.role,
    }));
  }
}

function connectGlobalWebSocket() {
  if (typeof window === 'undefined') return;
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const url = getWsUrl();

  try {
    const ws = new WebSocket(url);
    globalWs = ws;

    ws.onopen = () => {
      reconnectAttempts = 0;
      notifyStatus(true);
      sendAuthRegistration(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        messageListeners.forEach(({ filter, callback }) => {
          if (!callback) return;
          const matches = !filter || (Array.isArray(filter) ? filter.includes(data.event) : data.event === filter);
          if (matches) {
            try {
              callback(data);
            } catch (_) {}
          }
        });
      } catch (_) {}
    };

    ws.onclose = () => {
      notifyStatus(false);
      globalWs = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      notifyStatus(false);
      try {
        ws.close();
      } catch (_) {}
    };
  } catch (_) {
    notifyStatus(false);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  const backoffMs = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 8000);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (messageListeners.size > 0 || statusListeners.size > 0) {
      connectGlobalWebSocket();
    }
  }, backoffMs);
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Keep auth user in sync
  useEffect(() => {
    if (user?.id) {
      registeredUser = { id: user.id, role: user.role };
      if (globalWs && globalWs.readyState === WebSocket.OPEN) {
        sendAuthRegistration(globalWs);
      }
    }
  }, [user]);

  useEffect(() => {
    const statusListener = (connected: boolean) => {
      setIsConnected(connected);
    };
    statusListeners.add(statusListener);

    const messageListener: Listener = {
      filter: optionsRef.current.eventFilter,
      callback: (msg) => {
        setLastMessage(msg);
        if (optionsRef.current.onMessage) {
          optionsRef.current.onMessage(msg);
        }
      },
    };
    messageListeners.add(messageListener);

    connectGlobalWebSocket();

    return () => {
      statusListeners.delete(statusListener);
      messageListeners.delete(messageListener);
    };
  }, []);

  const sendMessage = useCallback((msg: any) => {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}

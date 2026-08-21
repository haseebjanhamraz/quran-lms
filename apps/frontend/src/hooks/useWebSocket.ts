'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface WebSocketMessage {
  event: string;
  action?: string;
  payload?: any;
  senderClientId?: string;
  targetTeacherId?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  eventFilter?: string | string[];
  onMessage?: (data: WebSocketMessage) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Resolve WS URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ||
      (window.location.protocol === 'https:'
        ? `wss://${window.location.hostname}:5001`
        : `ws://${window.location.hostname}:5001`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0;

        // Register client user & role for targeted messaging
        if (user?.id) {
          ws.send(JSON.stringify({
            event: 'register',
            userId: user.id,
            role: user.role,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          const filter = optionsRef.current.eventFilter;
          const matchesFilter = !filter ||
            (Array.isArray(filter) ? filter.includes(data.event) : data.event === filter);

          if (matchesFilter) {
            setLastMessage(data);
            if (optionsRef.current.onMessage) {
              optionsRef.current.onMessage(data);
            }
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Exponential backoff reconnect: 1s, 2s, 4s, max 10s
        const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000);
        reconnectAttemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, backoffMs);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (_) {
      // Reconnect after 5s if instantiation fails
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, [user]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.addEventListener('open', () => {
            try { ws.close(); } catch (_) {}
          }, { once: true });
        }
      }
    };
  }, [connect]);

  // Re-register if user changes
  useEffect(() => {
    if (isConnected && wsRef.current && user?.id) {
      sendMessage({
        event: 'register',
        userId: user.id,
        role: user.role,
      });
    }
  }, [user, isConnected, sendMessage]);

  return { isConnected, lastMessage, sendMessage };
}

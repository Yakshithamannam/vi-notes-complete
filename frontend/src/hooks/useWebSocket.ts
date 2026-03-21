import { useEffect, useRef, useCallback } from 'react';

interface WSMessage {
  type: 'connected' | 'flag' | 'alert';
  severity?: 'low' | 'medium' | 'high';
  message?: string;
  timestamp?: number;
}

interface UseWebSocketOptions {
  onFlag?: (msg: WSMessage) => void;
  enabled?: boolean;
}

export const useWebSocket = ({ onFlag, enabled = true }: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    const token = localStorage.getItem('vi_token');
    if (!token) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:5000'}/ws?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WS connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.type === 'flag' && onFlag) {
            onFlag(msg);
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        // Reconnect after 3 seconds
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch { /* ignore connection errors */ }
  }, [enabled, onFlag]);

  const sendEvent = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { sendEvent };
};

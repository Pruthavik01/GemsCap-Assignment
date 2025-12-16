import { useState, useEffect, useCallback, useRef } from 'react';
import { api, Tick } from '@/lib/api';

interface UseTickStreamOptions {
  symbol?: string;
  enabled?: boolean;
  maxHistory?: number;
}

export function useTickStream(options: UseTickStreamOptions = {}) {
  const { symbol, enabled = true, maxHistory = 100 } = options;
  const [tick, setTick] = useState<Tick | null>(null);
  const [history, setHistory] = useState<Tick[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const es = api.tick.stream(symbol);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setError(null);
      };

      es.addEventListener('tick', (event) => {
        try {
          const data: Tick = JSON.parse(event.data);
          setTick(data);
          setHistory((prev) => {
            const next = [data, ...prev];
            return next.slice(0, maxHistory);
          });
        } catch (e) {
          console.error('Failed to parse tick data:', e);
        }
      });

      es.onerror = () => {
        setConnected(false);
        setError('Connection lost. Reconnecting...');
        es.close();
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    } catch (e) {
      setError('Failed to connect to stream');
      setConnected(false);
    }
  }, [symbol, enabled, maxHistory]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    tick,
    history,
    connected,
    error,
    reconnect: connect,
    disconnect,
  };
}

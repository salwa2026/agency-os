'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

interface UseAgentStreamOptions {
  commandId: string | null;
  autoStart?: boolean;
  onComplete?: (fullText: string) => void;
}

interface UseAgentStreamReturn {
  output: string;
  status: StreamStatus;
  error: string | null;
  start: () => void;
  reset: () => void;
}

export function useAgentStream({
  commandId,
  autoStart = false,
  onComplete,
}: UseAgentStreamOptions): UseAgentStreamReturn {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fullTextRef = useRef('');

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!commandId) return;
    cleanup();

    setOutput('');
    setError(null);
    fullTextRef.current = '';
    setStatus('connecting');

    const es = new EventSource(`/api/agents/stream/${commandId}`);
    eventSourceRef.current = es;

    es.addEventListener('chunk', (e) => {
      const data = JSON.parse(e.data) as { text: string };
      fullTextRef.current += data.text;
      setOutput((prev) => prev + data.text);
      setStatus('streaming');
    });

    es.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data) as { fullText: string };
      fullTextRef.current = data.fullText;
      setOutput(data.fullText);
      setStatus('complete');
      cleanup();
      onComplete?.(data.fullText);
    });

    es.addEventListener('error', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { message: string };
        setError(data.message);
      } catch {
        setError('Stream connection failed');
      }
      setStatus('error');
      cleanup();
    });

    es.onerror = () => {
      if (status !== 'complete') {
        setError('Connection lost');
        setStatus('error');
        cleanup();
      }
    };
  }, [commandId, cleanup, onComplete, status]);

  const reset = useCallback(() => {
    cleanup();
    setOutput('');
    setError(null);
    setStatus('idle');
    fullTextRef.current = '';
  }, [cleanup]);

  useEffect(() => {
    if (autoStart && commandId) {
      start();
    }
    return cleanup;
  }, [commandId, autoStart]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { output, status, error, start, reset };
}

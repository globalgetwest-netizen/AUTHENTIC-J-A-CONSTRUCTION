/**
 * Minimal async-data hook for loading a single payload on mount/refresh.
 *
 * Returns `data`, `status` and `error` plus a `reload` that re-runs `load`
 * (used by pull-to-refresh and "Try again" states). The latest loader is kept
 * in a ref *updated from an effect* (never during render) so closures that
 * change identity every render don't re-trigger the fetch and loop forever.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncStatus = 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
  reload: () => void;
}

export function useAsyncData<T>(load: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const inFlight = useRef(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const token = ++inFlight.current;
    loadRef
      .current()
      .then((value) => {
        if (inFlight.current === token) {
          setData(value);
          setStatus('success');
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (inFlight.current === token) {
          setError(err instanceof Error ? err.message : 'Something went wrong.');
          setStatus('error');
        }
      });
    // Deps deliberately `[nonce]`: reload() bumps it; the loader and token live
    // in refs so identity changes don't re-run the effect.
  }, [nonce]);

  const reload = useCallback(() => {
    setStatus('loading');
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  return { data, status, error, reload };
}
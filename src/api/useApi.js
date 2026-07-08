/**
 * React hooks for OperdAI API calls with loading/error state management.
 */
import { useState, useEffect, useCallback } from 'react';

// ─── Generic API Hook ───────────────────────────────────────
export function useApi(apiFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, execute, setData };
}

// ─── Polling Hook ───────────────────────────────────────────
export function usePolling(apiFn, intervalMs = 10000, dependencies = []) {
  const { data, loading, error, execute } = useApi(apiFn, dependencies);

  useEffect(() => {
    const timer = setInterval(() => {
      execute();
    }, intervalMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, intervalMs]);

  return { data, loading, error, execute };
}

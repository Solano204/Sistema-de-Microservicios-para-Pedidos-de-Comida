import { useCallback, useEffect, useState } from "react";

export interface AdminListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Shared fetch-on-mount + manual-refresh + loading/error state for the admin/browse views. */
export function useAdminList<T>(fetcher: () => Promise<T[]>): AdminListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((prev) => prev + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error desconocido.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  return { items, loading, error, refresh };
}

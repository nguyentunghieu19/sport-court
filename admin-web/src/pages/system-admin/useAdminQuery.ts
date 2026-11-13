import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../api/errorMessage";

export function useAdminQuery<T>(fetcher: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ fetcher: typeof fetcher | null; data: T | null; error: string | null; loading: boolean }>({ fetcher: null, data: null, error: null, loading: true });
  useEffect(() => {
    let cancelled = false;
    fetcher().then((data) => { if (!cancelled) setResult({ fetcher, data, error: null, loading: false }); })
      .catch((error: unknown) => { if (!cancelled) setResult({ fetcher, data: null, error: getErrorMessage(error), loading: false }); });
    return () => { cancelled = true; };
  }, [fetcher, revision]);
  const reload = useCallback(() => { setResult((current) => ({ ...current, loading: true })); setRevision((value) => value + 1); }, []);
  return { data: result.data, error: result.error, loading: result.loading || result.fetcher !== fetcher, reload };
}

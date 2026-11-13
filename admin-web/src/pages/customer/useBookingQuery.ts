import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../api/errorMessage";

export function useBookingQuery<T>(load: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ loader: typeof load; version: number; data?: T; error?: string }>();
  useEffect(() => {
    let active = true;
    load().then((data) => { if (active) setResult({ loader: load, version, data }); })
      .catch((error: unknown) => { if (active) setResult({ loader: load, version, error: getErrorMessage(error) }); });
    return () => { active = false; };
  }, [load, version]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const current = result?.loader === load && result.version === version;
  return { data: result?.loader === load ? result.data : undefined, error: current ? result.error : undefined, loading: !current, reload };
}

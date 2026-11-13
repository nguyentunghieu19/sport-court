import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../api/errorMessage";

export function useCustomerQuery<T>(fetcher: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ fetcher: typeof fetcher; revision: number; data?: T; error?: string }>();
  useEffect(() => {
    let active = true;
    fetcher().then(data => { if (active) setState({ fetcher, revision, data }); })
      .catch((error: unknown) => { if (active) setState({ fetcher, revision, error: getErrorMessage(error) }); });
    return () => { active = false; };
  }, [fetcher, revision]);
  const current = state?.fetcher === fetcher && state.revision === revision;
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { data: current ? state.data : undefined, error: current ? state.error : undefined, loading: !current, reload };
}

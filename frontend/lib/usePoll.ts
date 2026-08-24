"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Poll an async reader on an interval, with a manual refresh trigger.
 * Keeps the last successful value on errors (RPC hiccups).
 */
export function usePoll<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  intervalMs: number,
): { data: T | undefined; refresh: () => void } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    const run = () =>
      fnRef
        .current()
        .then((d) => {
          if (alive) setData(d);
        })
        .catch(() => {});
    run();
    const iv = intervalMs > 0 ? setInterval(run, intervalMs) : undefined;
    return () => {
      alive = false;
      if (iv) clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version, intervalMs]);

  return { data, refresh };
}

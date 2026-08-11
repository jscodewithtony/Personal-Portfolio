import { useEffect, useState } from "react";
import { sanityClient } from "./client";

// Shared data-fetching hook for every section that reads from Sanity.
// Returns { data, status } where status is "loading" | "empty" | "ready"
// | "error", so a section can render its own loading/empty state
// without duplicating this logic per component. `fallbackEmpty` is what
// counts as "no content yet" (e.g. [] for list queries, null for
// singletons).
export function useSanityQuery(query, params = {}, fallbackEmpty = null) {
  const [state, setState] = useState({ data: null, status: "loading" });

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!sanityClient) {
      setState({ data: fallbackEmpty, status: "error" });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    sanityClient
      .fetch(query, params)
      .then((result) => {
        if (cancelled) return;
        const isEmpty =
          result == null ||
          (Array.isArray(result) && result.length === 0);
        setState({ data: result, status: isEmpty ? "empty" : "ready" });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Sanity query failed:", err);
        setState({ data: fallbackEmpty, status: "error" });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paramsKey]);

  return state;
}

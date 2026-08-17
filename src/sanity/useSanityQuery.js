import { useEffect, useState } from "react";
import { sanityClient } from "./client";

// Shared data-fetching hook for every section that reads from Sanity.
// Returns { data, status } where status is "loading" | "empty" | "ready"
// | "error", so a section can render its own loading/empty state
// without duplicating this logic per component. `fallbackEmpty` is what
// counts as "no content yet" (e.g. [] for list queries, null for
// singletons).
//
// `options.client` is an opt-in override (e.g. previewClient.js) — no
// existing call site passes it, so every current caller keeps using the
// public `sanityClient` exactly as before. Passing a client also turns
// on live refetching via `client.listen()`: any mutation matching the
// query (including drafts, when the preview client's perspective is
// used) triggers an immediate refetch instead of waiting for a reload —
// this is how the Sanity Presentation preview iframe updates near-
// instantly as fields are edited in the Studio.
export function useSanityQuery(query, params = {}, fallbackEmpty = null, options = {}) {
  const { client: overrideClient } = options;
  const [state, setState] = useState({ data: null, status: "loading" });

  const paramsKey = JSON.stringify(params);
  const activeClient = overrideClient || sanityClient;

  useEffect(() => {
    if (!activeClient) {
      setState({ data: fallbackEmpty, status: "error" });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    const runFetch = () =>
      activeClient
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

    runFetch();

    let subscription;
    if (overrideClient) {
      subscription = activeClient.listen(query, params).subscribe({
        next: runFetch,
        error: (err) => console.error("Sanity live listener failed:", err),
      });
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paramsKey, activeClient]);

  return state;
}

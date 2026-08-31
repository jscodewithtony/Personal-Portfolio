import { useEffect } from "react";

// The actual client-side half of visual editing — `sanity.config.js`'s
// presentationTool only configures the Studio side (where to iframe,
// which document maps to which route). Without this hook running on the
// previewed page, Presentation has nothing to open a connection to and
// shows "Unable to connect to visual editing" in its preview pane.
//
// Only ever call this with `enabled` true behind the same
// `?sanityPreview=1` flag every other preview piece uses (see
// preview.js) — it must never run during a normal, non-preview page
// load. Reusable across future preview-enabled pages, not just
// AboutPage.jsx.
//
// `@sanity/visual-editing` is dynamically imported here rather than at
// module top-level: a static import would ship its code (and the
// RxJS-style observable chain it pulls in) to every visitor on every
// route, for a package only the CMS editor's preview iframe ever uses.
export function useVisualEditing(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    let disable;
    let cancelled = false;
    import("@sanity/visual-editing").then(({ enableVisualEditing }) => {
      if (cancelled) return;
      disable = enableVisualEditing();
    });
    return () => {
      cancelled = true;
      disable?.();
    };
  }, [enabled]);
}

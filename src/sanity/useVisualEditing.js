import { useEffect } from "react";
import { enableVisualEditing } from "@sanity/visual-editing";

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
export function useVisualEditing(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const disable = enableVisualEditing();
    return () => disable();
  }, [enabled]);
}

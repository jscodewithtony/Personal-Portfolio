import useCanvasCursor from "../hooks/useCanvasCursor";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { siteSettingsQuery } from "../sanity/queries";

// Sitewide setting (siteSettings.customCursorEnabled), same mechanism
// as showBackgroundGrid/workPageTemplate/footerInteractive — the site
// owner decides once in Studio, not a per-visitor preference. Only an
// explicit `false` disables it; loading, an unset field, or an
// explicit `true` all leave it on (same "unset stays on" convention
// GlobalFontLoader already uses for showBackgroundGrid).
function CanvasCursor() {
  const { data } = useSanityQuery(siteSettingsQuery, {}, null);
  const enabled = data?.customCursorEnabled !== false;

  useCanvasCursor(enabled);

  if (!enabled) return null;

  return (
    <canvas
      id="canvas"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}

export default CanvasCursor;

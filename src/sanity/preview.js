// Detects whether the current page load should render draft/unpublished
// Sanity content instead of the public dataset. Scoped to a single,
// explicit query-param flag — the public site never checks this outside
// of a page that opts in (see AboutPage.jsx), so the flag has zero
// effect on the normal published experience even if someone guesses it.
export function isPreviewMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("sanityPreview") === "1";
}

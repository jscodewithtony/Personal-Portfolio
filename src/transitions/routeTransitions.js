// Per-route color + label for the page-transition overlay
// (PageTransitionOverlay.jsx). Colors are theme-aware and deliberately
// mirror each destination page's own light/dark surface color (see
// index.css's --color-bg/--color-primary and each page's own dark:bg-*
// class), so the sweep-out reveals into a color that already matches
// what's underneath instead of a mismatched flash.
//
// To extend this to another page: add an entry here. `label` can be a
// literal string, or a function `(pathname, clickedLinkText) => string`
// for routes whose name isn't knowable from the path alone (e.g. a
// project detail page) — clickedLinkText is whatever text the link the
// user actually clicked displayed, which is the simplest reliable
// source for that without a data fetch inside the transition itself.
export const ROUTE_TRANSITIONS = [
  {
    match: (pathname) => pathname === "/about",
    color: { light: "#114AFC", dark: "#161616" },
    textColor: { light: "text-white", dark: "text-white" },
    label: "ABOUT TONY",
  },
  {
    match: (pathname) => pathname === "/",
    color: { light: "#F9F9F9", dark: "#0c0a14" },
    textColor: { light: "text-ink", dark: "text-white" },
    label: "TONY",
  },
  {
    match: (pathname) => pathname.startsWith("/projects/"),
    color: { light: "#114AFC", dark: "#0c0a14" },
    textColor: { light: "text-white", dark: "text-white" },
    label: (_pathname, clickedLinkText) => clickedLinkText || "PROJECT",
  },
];

const DEFAULT_TRANSITION = {
  color: { light: "#114AFC", dark: "#0c0a14" },
  textColor: { light: "text-white", dark: "text-white" },
  label: (_pathname, clickedLinkText) => clickedLinkText || "TONY",
};

export function resolveRouteTransition(pathname, clickedLinkText, isDark) {
  const entry =
    ROUTE_TRANSITIONS.find((t) => t.match(pathname)) || DEFAULT_TRANSITION;
  const color = isDark ? entry.color.dark : entry.color.light;
  const textColorClass = isDark ? entry.textColor.dark : entry.textColor.light;
  const label =
    typeof entry.label === "function"
      ? entry.label(pathname, clickedLinkText)
      : entry.label;
  return { color, textColorClass, label };
}

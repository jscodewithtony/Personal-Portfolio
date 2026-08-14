// The exact values the site has always hardcoded for its one (light)
// theme — used as the initial render AND the fallback whenever
// siteSettings/theme data hasn't loaded or doesn't exist yet, so the
// "do not change the light theme" guarantee holds even with zero
// Sanity connectivity.
export const LIGHT_THEME_DEFAULTS = {
  name: "Light",
  primaryAccent: "#114AFC",
  primaryAccentHover: "#022CDB",
  backgroundColor: "#F9F9F9",
  textColor: "#0d0c14",
  statValueColor: "#0d0c14",
  statsCubeFrontColor: "#114AFC",
  statsCubeSideColor: "#0013B2",
  statsCubeLineColor: "#022CDB",
};

// Merges fetched theme fields over the light defaults, field by field,
// so an editor leaving an optional field (hover shade, cube colors...)
// empty falls back sensibly instead of rendering "undefined".
export function resolveThemeTokens(fetched) {
  if (!fetched) return LIGHT_THEME_DEFAULTS;
  const primaryAccent = fetched.primaryAccent || LIGHT_THEME_DEFAULTS.primaryAccent;
  return {
    name: fetched.name || LIGHT_THEME_DEFAULTS.name,
    primaryAccent,
    primaryAccentHover: fetched.primaryAccentHover || primaryAccent,
    backgroundColor: fetched.backgroundColor || LIGHT_THEME_DEFAULTS.backgroundColor,
    textColor: fetched.textColor || LIGHT_THEME_DEFAULTS.textColor,
    statValueColor:
      fetched.statValueColor || fetched.textColor || LIGHT_THEME_DEFAULTS.statValueColor,
    statsCubeFrontColor: fetched.statsCubeFrontColor || primaryAccent,
    statsCubeSideColor: fetched.statsCubeSideColor || primaryAccent,
    statsCubeLineColor: fetched.statsCubeLineColor || primaryAccent,
  };
}

// Sets the CSS custom properties every `bg-primary`/`text-ink`/`bg-bg`/
// etc. utility already reads at paint time. Only ever touches the
// *base* (non dark:) rendering — every dark-mode class in the codebase
// is a fully separate hardcoded value (e.g. `dark:bg-[#0c0a14]`) that
// never references these vars, so this can never affect dark mode.
export function applyThemeTokens(tokens) {
  const root = document.documentElement.style;
  root.setProperty("--color-primary", tokens.primaryAccent);
  root.setProperty("--color-primary-dark", tokens.primaryAccentHover);
  root.setProperty("--color-bg", tokens.backgroundColor);
  root.setProperty("--color-ink", tokens.textColor);
  root.setProperty("--color-stat-value", tokens.statValueColor);
}

// Three.js wants numeric 0xRRGGBB, not CSS strings.
export function hexToThreeColor(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

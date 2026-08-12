import { createContext, useContext, useEffect, useMemo } from "react";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { activeThemeQuery } from "../sanity/queries";
import { LIGHT_THEME_DEFAULTS, resolveThemeTokens, applyThemeTokens } from "./themeTokens";

const ThemeTokensContext = createContext(LIGHT_THEME_DEFAULTS);

// Kill switch: the Sanity-driven theme system (schemas, Studio UI,
// ThemeTokensProvider fetch/apply logic) stays in place, but this flag
// stops the site from reading or applying whatever is selected in
// Sanity — the site always renders the original hardcoded light theme,
// regardless of Site Settings, until this is flipped back on.
const THEME_SYSTEM_ENABLED = false;

// Fetches whichever theme siteSettings.selectedTheme currently points
// at, resolves it against the light-theme defaults, applies it as CSS
// custom properties (so every bg-primary/text-ink/bg-bg utility
// sitewide repaints automatically), and hands the raw hex values down
// through context for the few spots that need JS-side color math
// (Three.js materials, GSAP color tweens) rather than a CSS class.
export function ThemeTokensProvider({ children }) {
  if (!THEME_SYSTEM_ENABLED) {
    return (
      <ThemeTokensContext.Provider value={LIGHT_THEME_DEFAULTS}>
        {children}
      </ThemeTokensContext.Provider>
    );
  }

  return <LiveThemeTokensProvider>{children}</LiveThemeTokensProvider>;
}

function LiveThemeTokensProvider({ children }) {
  const { data, status } = useSanityQuery(activeThemeQuery, {}, null);

  const tokens = useMemo(
    () => resolveThemeTokens(status === "ready" ? data?.selectedTheme : null),
    [status, data]
  );

  useEffect(() => {
    applyThemeTokens(tokens);
  }, [tokens]);

  return (
    <ThemeTokensContext.Provider value={tokens}>
      {children}
    </ThemeTokensContext.Provider>
  );
}

export function useThemeTokens() {
  return useContext(ThemeTokensContext);
}

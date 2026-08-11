import { createContext, useContext, useEffect, useMemo } from "react";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { activeThemeQuery } from "../sanity/queries";
import { LIGHT_THEME_DEFAULTS, resolveThemeTokens, applyThemeTokens } from "./themeTokens";

const ThemeTokensContext = createContext(LIGHT_THEME_DEFAULTS);

// Fetches whichever theme siteSettings.selectedTheme currently points
// at, resolves it against the light-theme defaults, applies it as CSS
// custom properties (so every bg-primary/text-ink/bg-bg utility
// sitewide repaints automatically), and hands the raw hex values down
// through context for the few spots that need JS-side color math
// (Three.js materials, GSAP color tweens) rather than a CSS class.
export function ThemeTokensProvider({ children }) {
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

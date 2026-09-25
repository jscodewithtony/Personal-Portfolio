import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Lazy load the page routes to split chunks
const HomePage = lazy(() => import("./pages/HomePage"));
const CaseStudy = lazy(() => import("./pages/CaseStudy"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const WorkPage = lazy(() => import("./pages/WorkPage"));
const SayHiPage = lazy(() => import("./pages/SayHiPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

import { ThemeTokensProvider } from "./theme/ThemeTokensContext";
import { isPreviewMode } from "./sanity/preview";
import { useVisualEditing } from "./sanity/useVisualEditing";
import PageTransitionOverlay from "./transitions/PageTransitionOverlay";
import { GlobalFontLoader } from "./components/GlobalFontLoader";
import Preloader from "./components/Preloader";
import SmoothScroll from "./components/SmoothScroll";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function useGlobalRefresh() {
  useEffect(() => {
    let timer;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }, 500);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
}


// Lazy — AdminStudio pulls in the entire Sanity Studio package
// (structureTool, visionTool, styled-components, its own ~170KB CSS
// bundle). A static import here would bundle all of that into the main
// entry chunk, whose <link>/<script> tags load unconditionally in
// index.html — meaning Studio's own global styles would load, and can
// visually collide with the public site, on every route including "/".
// Dynamic import keeps it out of the initial page load entirely.
const AdminStudio = lazy(() => import("./pages/AdminStudio"));

const THEME_STORAGE_KEY = "theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  // Plain useState, not a route/storage flag — App() itself only mounts
  // once per real browser page load (React Router swaps child <Route>
  // elements without remounting App), so this naturally never re-fires
  // on client-side navigation between pages.
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Mounted here (the true app root, rendered for every route) rather
  // than inside a specific page — Presentation's preview iframe can
  // load any route first (its default previewUrl.preview is "/"), so
  // the connector has to be reachable regardless of which page happens
  // to render. Still gated on `?sanityPreview=1` alone (isPreviewMode),
  // so it never runs on a normal, non-preview page load — including
  // /admin itself, since that route never carries the flag.
  useVisualEditing(isPreviewMode());
  useGlobalRefresh();

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <BrowserRouter>
      {/* Initial-load only — shown on true first page load, never on
          client-side route navigation (see isInitialLoading comment
          above). Sits above PageTransitionOverlay (z-[1000] vs its
          z-[999]) purely so it's never accidentally covered during the
          brief window both could theoretically be mounted. */}
      {isInitialLoading && (
        <Preloader onComplete={() => setIsInitialLoading(false)} />
      )}
      {/* Intercepts internal <Link> clicks sitewide (Header, MenuOverlay,
          project cards, etc.) to play the color-sweep + page-name intro
          before the actual route swap — see PageTransitionOverlay.jsx.
          Mounted once here, not per-page, and never modifies any of the
          components whose links it's listening to. */}
      <PageTransitionOverlay />
      <SmoothScroll />
      <GlobalFontLoader />
      <Suspense fallback={null}>
        <Routes>
          {/* /admin is intentionally its own top-level route, outside the
              public site's .site-shell wrapper and nav — the Studio is
              never linked from the header/menu and carries no public
              layout, only Sanity's own login + editor UI. */}
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={null}>
                <AdminStudio />
              </Suspense>
            }
          />
          <Route
            path="/projects/:slug"
            element={
              <ThemeTokensProvider>
                <CaseStudy theme={theme} onToggleTheme={toggleTheme} />
              </ThemeTokensProvider>
            }
          />
          <Route
            path="/about"
            element={
              <ThemeTokensProvider>
                <AboutPage theme={theme} onToggleTheme={toggleTheme} />
              </ThemeTokensProvider>
            }
          />
          <Route
            path="/work"
            element={
              <ThemeTokensProvider>
                <WorkPage theme={theme} onToggleTheme={toggleTheme} />
              </ThemeTokensProvider>
            }
          />
          <Route
            path="/say-hi"
            element={
              <ThemeTokensProvider>
                <SayHiPage theme={theme} onToggleTheme={toggleTheme} />
              </ThemeTokensProvider>
            }
          />

          <Route
            path="/"
            element={
              <ThemeTokensProvider>
                <HomePage theme={theme} onToggleTheme={toggleTheme} />
              </ThemeTokensProvider>
            }
          />

          {/* Catch-all — anything no route above matches. Without this
              the shell rendered blank for arbitrary paths (still HTTP
              200, via the .htaccess rewrite), which reads as a soft
              404 to crawlers. */}
          <Route
            path="*"
            element={
              <ThemeTokensProvider>
                <NotFoundPage theme={theme} onToggleTheme={toggleTheme} />
              </ThemeTokensProvider>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

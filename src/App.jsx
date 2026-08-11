import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CaseStudy from "./pages/CaseStudy";
import { ThemeTokensProvider } from "./theme/ThemeTokensContext";

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <BrowserRouter>
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
          path="/"
          element={
            <ThemeTokensProvider>
              <HomePage theme={theme} onToggleTheme={toggleTheme} />
            </ThemeTokensProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

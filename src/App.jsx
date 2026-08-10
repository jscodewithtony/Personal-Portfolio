import { useEffect, useRef, useState, lazy, Suspense } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Statement from "./components/Statement";
import CanvasCursor from "./components/CanvasCursor";

const FeaturedProjects = lazy(() => import("./components/FeaturedProjects"));
const Stats = lazy(() => import("./components/Stats"));
const MentorshipTestimonials = lazy(() => import("./components/MentorshipTestimonials"));
const Insight = lazy(() => import("./components/Insight"));
const Footer = lazy(() => import("./components/Footer"));
const MenuOverlay = lazy(() => import("./components/MenuOverlay"));

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="relative min-h-[100dvh] bg-bg font-display text-ink uppercase transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
      <CanvasCursor />
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={() =>
          setTheme((t) => (t === "light" ? "dark" : "light"))
        }
      />
      <Hero />
      <About theme={theme} />
      <Statement />

      <Suspense fallback={null}>
        <FeaturedProjects />
        <Stats theme={theme} />
        <MentorshipTestimonials theme={theme} />
        <Insight />
        <Footer />
        <MenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
        />
      </Suspense>
    </div>
  );
}

export default App;

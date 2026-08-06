import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Statement from "./components/Statement";
import FeaturedProjects from "./components/FeaturedProjects";
import Stats from "./components/Stats";
import Footer from "./components/Footer";
import MenuOverlay from "./components/MenuOverlay";

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
    <div className="relative min-h-[100dvh] bg-bg font-display text-ink transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
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
      <Statement />
      <About />
      <FeaturedProjects />
      <Stats theme={theme} />
      <Footer />
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={menuButtonRef}
      />
    </div>
  );
}

export default App;

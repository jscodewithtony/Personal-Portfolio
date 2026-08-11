import { useRef, useState, lazy, Suspense } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import About from "../components/About";
import Statement from "../components/Statement";
import CanvasCursor from "../components/CanvasCursor";

const FeaturedProjects = lazy(() => import("../components/FeaturedProjects"));
const Stats = lazy(() => import("../components/Stats"));
const MentorshipTestimonials = lazy(() =>
  import("../components/MentorshipTestimonials")
);
const Insight = lazy(() => import("../components/Insight"));
const Footer = lazy(() => import("../components/Footer"));
const MenuOverlay = lazy(() => import("../components/MenuOverlay"));

function HomePage({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  return (
    <div className="site-shell relative min-h-[100dvh] bg-bg font-display text-ink uppercase transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
      <CanvasCursor />
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
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

export default HomePage;

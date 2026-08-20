import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Hero from "../components/Hero";
import About from "../components/About";
import CanvasCursor from "../components/CanvasCursor";
import MenuOverlay from "../components/MenuOverlay";
import LazyScroll from "../components/LazyScroll";

// Each of these is already deferred to mount only once scrolled near
// (via <LazyScroll> below) — lazy-importing them too means their JS
// (Stats pulls in the full three.js library for its 3D cube) isn't
// even downloaded until then either, instead of loading eagerly with
// the rest of the homepage bundle regardless of scroll position.
const Statement = lazy(() => import("../components/Statement"));
const FeaturedProjects = lazy(() => import("../components/FeaturedProjects"));
const Stats = lazy(() => import("../components/Stats"));
const MentorshipTestimonials = lazy(() => import("../components/MentorshipTestimonials"));
const Insight = lazy(() => import("../components/Insight"));
const Footer = lazy(() => import("../components/Footer"));

function HomePage({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const location = useLocation();

  // Lands back on the Featured Projects section when arriving via the
  // case study page's "All Projects" link (/#featured-projects), rather
  // than just resetting to the very top of the home page. Delayed a
  // beat so FeaturedProjects' own pinned ScrollTrigger has finished
  // setting up its pin-spacer first — scrolling to the section before
  // that settles can land at a slightly wrong offset.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    }, 350);
    return () => clearTimeout(timer);
  }, [location.hash]);

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

      <LazyScroll placeholderHeight="200px">
        <Suspense fallback={null}>
          <Statement />
        </Suspense>
      </LazyScroll>

      <LazyScroll placeholderHeight="100vh">
        <Suspense fallback={null}>
          <FeaturedProjects />
        </Suspense>
      </LazyScroll>

      <LazyScroll placeholderHeight="100vh">
        <Suspense fallback={null}>
          <Stats theme={theme} />
        </Suspense>
      </LazyScroll>

      <LazyScroll placeholderHeight="600px">
        <Suspense fallback={null}>
          <MentorshipTestimonials theme={theme} />
        </Suspense>
      </LazyScroll>

      <LazyScroll placeholderHeight="400px">
        <Suspense fallback={null}>
          <Insight />
        </Suspense>
      </LazyScroll>

      <LazyScroll placeholderHeight="400px">
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </LazyScroll>

      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={menuButtonRef}
      />
    </div>
  );
}

export default HomePage;

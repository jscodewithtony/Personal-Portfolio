import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Hero from "../components/Hero";
import About from "../components/About";
import Statement from "../components/Statement";
import CanvasCursor from "../components/CanvasCursor";
import FeaturedProjects from "../components/FeaturedProjects";
import Stats from "../components/Stats";
import MentorshipTestimonials from "../components/MentorshipTestimonials";
import Insight from "../components/Insight";
import Footer from "../components/Footer";
import MenuOverlay from "../components/MenuOverlay";
import LazyScroll from "../components/LazyScroll";

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
        <Statement />
      </LazyScroll>

      <LazyScroll placeholderHeight="100vh">
        <FeaturedProjects />
      </LazyScroll>

      <LazyScroll placeholderHeight="100vh">
        <Stats theme={theme} />
      </LazyScroll>

      <LazyScroll placeholderHeight="600px">
        <MentorshipTestimonials theme={theme} />
      </LazyScroll>

      <LazyScroll placeholderHeight="400px">
        <Insight />
      </LazyScroll>

      <LazyScroll placeholderHeight="400px">
        <Footer />
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

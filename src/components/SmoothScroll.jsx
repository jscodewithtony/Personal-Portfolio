import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

// Smooth scrolling engine powered by Lenis + GSAP ScrollTrigger ticker.
// Preserves native window scroll, sticky headers, fixed overlays, and
// integrates with GSAP ScrollTrigger at 60/120fps with zero layout bugs.
export default function SmoothScroll() {
  const location = useLocation();
  const lenisRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !prefersReducedMotion,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    // Direct GSAP ScrollTrigger integration
    lenis.on("scroll", ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      window.lenis = null;
    };
  }, []);

  // Handle route navigation & Sanity studio exclusion
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    if (location.pathname.startsWith("/admin")) {
      lenis.stop();
      return;
    }

    lenis.start();

    if (!location.hash) {
      lenis.scrollTo(0, { immediate: true });
    }

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => clearTimeout(refreshTimer);
  }, [location.pathname, location.hash]);

  return null;
}

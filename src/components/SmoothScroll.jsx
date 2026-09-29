import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isPreviewMode } from "../sanity/preview";
import "lenis/dist/lenis.css";

function cleanupLenisClasses() {
  if (typeof document === "undefined") return;
  const classes = [
    "lenis",
    "lenis-smooth",
    "lenis-stopped",
    "lenis-locked",
    "lenis-scrolling",
    "lenis-autoToggle",
  ];
  classes.forEach((cls) => {
    document.documentElement.classList.remove(cls);
    document.body.classList.remove(cls);
  });
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

// Smooth scrolling engine powered by Lenis + GSAP ScrollTrigger ticker.
// Preserves native window scroll, sticky headers, fixed overlays, and
// integrates with GSAP ScrollTrigger at 60/120fps with zero layout bugs.
// Completely disables itself in Sanity Studio (/admin) and Preview mode
// so Sanity Studio panes and document fields scroll 100% natively.
export default function SmoothScroll() {
  const location = useLocation();
  const lenisRef = useRef(null);

  const isAdmin = location.pathname.startsWith("/admin");
  const isPreview = isPreviewMode();
  const shouldDisable = isAdmin || isPreview;

  useEffect(() => {
    if (shouldDisable) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        window.lenis = null;
      }
      cleanupLenisClasses();
      return undefined;
    }

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
      lenisRef.current = null;
      window.lenis = null;
      cleanupLenisClasses();
    };
  }, [shouldDisable]);

  // Handle route navigation for public pages
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis || shouldDisable) return;

    lenis.start();

    if (!location.hash) {
      lenis.scrollTo(0, { immediate: true });
    }

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => clearTimeout(refreshTimer);
  }, [location.pathname, location.hash, shouldDisable]);

  return null;
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Shuffle from "../components/Shuffle";
import { resolveRouteTransition } from "./routeTransitions";

gsap.registerPlugin(CustomEase);

// A genuine custom cubic-bezier curve — not a stock GSAP ease name —
// matching the reference's "slow-in" pacing: it starts slow and
// accelerates hard into full coverage, with no ease-out tail.
const SWEEP_IN_EASE = CustomEase.create(
  "pageTransitionSweepIn",
  "0.7, 0, 0.84, 0"
);
const SWEEP_OUT_EASE = "power3.out";
// Rushing-toward-viewer feel for the exit — accelerating in, no
// deceleration tail, matching the "dissolves" not "gently grows" brief.
const EXIT_SCALE_EASE = "power2.in";

const SWEEP_IN_DURATION = 0.55;
const HOLD_SECONDS = 0.05;
const SWEEP_OUT_DURATION = 0.25;
// This overlay's own <Shuffle> instance is intentionally slower here
// than Hero.jsx's original 0.55s — Hero's own source/timing is
// untouched; only the props passed to this separate instance changed.
const SHUFFLE_DURATION = 0.9;
// Text exit: scales up aggressively from the center while fading out,
// large enough to overflow the viewport and clip at the edges (the
// overlay's own `overflow-hidden` handles the clipping).
const EXIT_DURATION = 0.8;
const EXIT_SCALE_TARGET = 3.5;

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

// Only ever intercepts same-origin, same-tab, non-admin link clicks —
// external links, mailto/tel, target="_blank", modifier-key clicks
// (open in new tab), and anything under /admin (the Studio) fall
// through to the browser's normal, un-intercepted click behavior.
function findInternalLink(target) {
  const a = target.closest?.("a[href]");
  if (!a) return null;
  const href = a.getAttribute("href");
  if (!href || !href.startsWith("/")) return null;
  if (a.target && a.target !== "_self") return null;
  if (href.startsWith("/admin")) return null;
  return a;
}

// Route-transition intro: a full-viewport color panel sweeps in over
// the current page, a page-name headline plays (reusing Hero.jsx's
// exact <Shuffle> entrance, unmodified), then the panel sweeps away to
// reveal the destination page underneath. Mounted once at the app root
// (App.jsx) — not per-page — since it needs to intercept navigation
// before any specific page's own content exists. Never touches
// Header.jsx, MenuOverlay.jsx, or any page's own code: it works purely
// by listening for clicks on the internal <Link>s those components
// already render.
function PageTransitionOverlay() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const headlineWrapRef = useRef(null);
  const timelineRef = useRef(null);
  const currentPathRef = useRef(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("");
  const [panelColor, setPanelColor] = useState("#114AFC");
  const [textColorClass, setTextColorClass] = useState("text-white");

  const runTransition = useCallback(
    // `navHref` is the full href as written (may carry a #hash, e.g.
    // "/#work") — passed to navigate() as-is so React Router still
    // handles any hash scroll. `pathname` is that same href with the
    // hash stripped, used only for matching against ROUTE_TRANSITIONS
    // and tracking "are we already here" — matching against the raw
    // href would silently fail to match "/#work" against "/".
    (navHref, pathname, clickedLinkText) => {
      // Ignore re-clicks while a transition is already mid-flight
      // rather than starting a second, overlapping one.
      if (timelineRef.current) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduceMotion) {
        navigate(navHref);
        return;
      }

      const panel = panelRef.current;
      const headlineWrap = headlineWrapRef.current;
      if (!panel || !headlineWrap) {
        navigate(navHref);
        return;
      }

      const { color, textColorClass: resolvedTextColor, label: resolvedLabel } = resolveRouteTransition(
        pathname,
        clickedLinkText,
        isDarkMode()
      );

      setPanelColor(color);
      setTextColorClass(resolvedTextColor);
      setLabel(resolvedLabel);
      setActive(true);
      currentPathRef.current = pathname;

      document.body.style.overflow = "hidden";

      gsap.set(panel, { scaleY: 0, transformOrigin: "bottom center" });
      gsap.set(headlineWrap, {
        autoAlpha: 0,
        scale: 1,
        transformOrigin: "center center",
      });

      const tl = gsap.timeline({
        onComplete: () => {
          timelineRef.current = null;
          document.body.style.overflow = "";
          setActive(false);
        },
      });
      timelineRef.current = tl;

      tl.to(panel, {
        scaleY: 1,
        duration: SWEEP_IN_DURATION,
        ease: SWEEP_IN_EASE,
      })
        .call(() => {
          window.scrollTo(0, 0);
          navigate(navHref);
        })
        .set(headlineWrap, { autoAlpha: 1 })
        // Headroom for the reused Shuffle entrance to finish playing,
        // then the brief hold so the page name is actually readable.
        .to({}, { duration: SHUFFLE_DURATION + HOLD_SECONDS })
        // Dramatic exit: scales up aggressively from center while
        // fading out — reads as the text rushing toward the viewer and
        // dissolving, not a gentle grow. The overlay's own
        // `overflow-hidden` clips the oversized text at the edges.
        .to(headlineWrap, {
          scale: EXIT_SCALE_TARGET,
          autoAlpha: 0,
          duration: EXIT_DURATION,
          ease: EXIT_SCALE_EASE,
        })
        // No pause — the panel sweep-out starts the instant the
        // scale/fade tween above finishes (default sequential position).
        .set(panel, { transformOrigin: "top center" })
        .to(panel, {
          scaleY: 0,
          duration: SWEEP_OUT_DURATION,
          ease: SWEEP_OUT_EASE,
        });
    },
    [navigate]
  );

  useEffect(() => {
    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const link = findInternalLink(event.target);
      if (!link) return;

      const href = link.getAttribute("href");
      const [pathnameOnly] = href.split("#");
      const destination = pathnameOnly || "/";
      if (destination === currentPathRef.current) return;

      event.preventDefault();
      const label = link.getAttribute("data-transition-label") || link.textContent?.trim();
      runTransition(href, destination, label);
    };

    // Capture phase, not bubble — react-router's <Link> handles the
    // click itself (and calls navigate()) via React's root-delegated
    // listener, which sits below `document` in the tree and so fires
    // first in bubble order. A bubble-phase listener here would always
    // run too late to preventDefault() before that navigation already
    // happened. Capture fires top-down, before that, so this runs
    // first and can actually intercept the click.
    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [runTransition]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      aria-hidden={!active}
      className="pointer-events-none fixed inset-0 z-[999] overflow-hidden"
      style={{ visibility: active ? "visible" : "hidden" }}
    >
      <div
        ref={panelRef}
        className="absolute inset-0"
        style={{ backgroundColor: panelColor }}
      />
      <div
        ref={headlineWrapRef}
        className="absolute inset-0 flex items-center justify-center px-6"
      >
        {label && (
          <Shuffle
            key={label}
            text={label}
            tag="h2"
            className={`select-none whitespace-nowrap font-display font-black uppercase leading-[0.82] tracking-tighter text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] ${textColorClass}`}
            shuffleDirection="right"
            duration={SHUFFLE_DURATION}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power2.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover={true}
            respectReducedMotion={true}
          />
        )}
      </div>
    </div>
  );
}

export default PageTransitionOverlay;

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import aboutPortrait from "../assets/about-portrait.webp";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { homepageContentQuery } from "../sanity/queries";
import { useThemeTokens } from "../theme/ThemeTokensContext";

gsap.registerPlugin(ScrollTrigger);

// The headline below is a structural composition — word-by-word scroll
// spans plus an inline interactive ribbon toggle and marquee box baked
// into specific words — not swappable prose, so it stays hardcoded here
// (CMS only drives the two body paragraphs, which are plain text).
const FALLBACK_BODY = {
  aboutBodyParagraph1:
    "I value clarity, structure, and intent — both in design and in how I build. I am drawn to systems that hold up under scale: patterns, not one-offs. I believe good design is governed, not just made — every decision should trace back to a reason.",
  aboutBodyParagraph2:
    "I like building things end to end, from the first sketch to the shipped product. And I trust frameworks over instinct — but only the ones I've tested myself.",
};

const PIN_DISTANCE_VH = 1.1;
// Touch swipes cover roughly the same physical distance as a desktop
// wheel-scroll tick, but this pin's scroll distance is computed from
// window.innerHeight — which is smaller on mobile — so the same
// gesture consumes a bigger share of it there, making the scrub feel
// like it's rushing by faster on phones. A larger mobile-only distance
// restores a native-feeling pace without changing the animation.
const MOBILE_PIN_DISTANCE_VH = 1.8;

// =========================================================================
// RIBBON & MARQUEE WORD CUSTOMIZATION
// =========================================================================
// Theme accent, frozen to the original purple in dark mode — this class
// previously rendered identically regardless of light/dark (no dark:
// variant existed), so dark mode must keep that exact value now that
// the base color is theme-driven rather than a compile-time constant.
const RIBBON_1_COLOR = "bg-primary dark:bg-[#114AFC]"; // Bottom layer, slanting UP
const RIBBON_2_COLOR = "bg-[#121212]"; // Dark Ribbon (Top layer, slanting DOWN) — not accent-colored, unaffected by theming

const SINGLE_MARQUEE_WORDS = [
  "HUMANS",
  "MEASURABLE",
  "HONEST",
  "MEANINGFUL",
  "PRACTICAL",
];

function About({ theme }) {
  const { data: content, status } = useSanityQuery(
    homepageContentQuery,
    {},
    null
  );
  const body =
    status === "ready" ? { ...FALLBACK_BODY, ...content } : FALLBACK_BODY;
  const themeTokens = useThemeTokens();

  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const imageOuterRef = useRef(null);
  const imageInnerRef = useRef(null);
  const ribbon1Ref = useRef(null);
  const ribbon2Ref = useRef(null);
  const bgLayerRef = useRef(null);
  const bgTweenRef = useRef(null);
  const tlRef = useRef(null);

  const [ribbonsActive, setRibbonsActive] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  // Single-word horizontal marquee interval (Runs ONLY when play button is active)
  useEffect(() => {
    if (!ribbonsActive) {
      setWordIndex(0); // Reset to first word when paused
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % SINGLE_MARQUEE_WORDS.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [ribbonsActive]);

  // React to theme prop updates & document.documentElement class mutations in real time
  useEffect(() => {
    const updateThemeColor = () => {
      if (!bgLayerRef.current) return;
      const isDark = theme
        ? theme === "dark"
        : document.documentElement.classList.contains("dark");
      const targetColor = isDark ? "#0c0a14" : themeTokens.backgroundColor;

      if (bgTweenRef.current) {
        bgTweenRef.current.vars.backgroundColor = targetColor;
        bgTweenRef.current.invalidate();
        if (tlRef.current?.scrollTrigger) {
          tlRef.current.scrollTrigger.update();
        }
      } else {
        gsap.to(bgLayerRef.current, {
          backgroundColor: targetColor,
          duration: 0.3,
        });
      }
    };

    updateThemeColor();

    const observer = new MutationObserver(() => {
      updateThemeColor();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme, themeTokens]);

  useEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const imageOuter = imageOuterRef.current;
    const imageInner = imageInnerRef.current;
    if (!section || !imageOuter || !imageInner || !headline) return;

    const wordElements = headline.querySelectorAll(".word");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      gsap.set(wordElements, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(imageOuter, { clipPath: "inset(0 0 100% 0)" });
      gsap.set(imageInner, { scale: 1.15 });

      // Start headline words dimmed (15% opacity)
      gsap.set(wordElements, { opacity: 0.15 });

      // ScrollTrigger timeline: pinned, scrubbed, continuous 0-1 timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () =>
            `+=${window.innerHeight * (window.innerWidth < 768 ? MOBILE_PIN_DISTANCE_VH : PIN_DISTANCE_VH)}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });

      tlRef.current = tl;

      // Smooth background color morphing from mascot color to target theme background.
      // The start color mirrors whatever the Hero mascot is currently
      // rendering: frozen purple in dark mode (matches Mascot.jsx's own
      // dark: freeze), theme-accent-driven in light mode.
      const isDark = theme
        ? theme === "dark"
        : document.documentElement.classList.contains("dark");
      const morphStartColor = isDark ? "#114AFC" : themeTokens.primaryAccent;
      const targetBgColor = isDark ? "#0c0a14" : themeTokens.backgroundColor;

      if (bgLayerRef.current) {
        bgTweenRef.current = gsap.fromTo(
          bgLayerRef.current,
          { backgroundColor: morphStartColor },
          { backgroundColor: targetBgColor, ease: "power1.out", duration: 0.5 }
        );
        tl.add(bgTweenRef.current, 0);
      }

      // Word-by-word color highlight scrub
      tl.to(
        wordElements,
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
        },
        0
      );

      // Image wipe & scale settle
      tl.to(imageOuter, { clipPath: "inset(0 0 0% 0)", ease: "none", duration: 1 }, 0)
        .to(imageInner, { scale: 1, ease: "none", duration: 1 }, 0);

    }, section);

    return () => ctx.revert();
    // themeTokens starts at the light defaults and updates once the
    // Sanity fetch resolves — rebuilding here (like the other pinned
    // sections do) picks up the real morph-start color for whichever
    // theme is actually selected, instead of staying stuck on defaults.
  }, [themeTokens]);

  // GSAP Smooth Slow Slide-In (Play) & Slow Slide-Out Off-Screen (Pause)
  useEffect(() => {
    const r1 = ribbon1Ref.current;
    const r2 = ribbon2Ref.current;
    if (!r1 || !r2) return;

    if (ribbonsActive) {
      // Toggle ON (Play): Smooth slow slide-in from off-screen opposite edges
      gsap.fromTo(
        r1,
        {
          xPercent: -180,
          rotateZ: 9,
          opacity: 0,
        },
        {
          xPercent: -50,
          rotateZ: 9,
          opacity: 1,
          duration: 0.95,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        r2,
        {
          xPercent: 180,
          rotateZ: -14,
          opacity: 0,
        },
        {
          xPercent: -50,
          rotateZ: -14,
          opacity: 1,
          duration: 0.95,
          delay: 0.08,
          ease: "power3.out",
        }
      );
    } else {
      // Toggle OFF (Pause): Smooth slow slide out all the way off-screen
      gsap.to(r1, {
        xPercent: 180,
        opacity: 0,
        duration: 0.9,
        ease: "power3.inOut",
      });
      gsap.to(r2, {
        xPercent: -220,
        opacity: 0,
        duration: 0.9,
        ease: "power3.inOut",
      });
    }
  }, [ribbonsActive]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 -mt-px overflow-hidden px-6 py-24 text-ink transition-colors duration-300 sm:px-10 sm:py-28 md:px-14 md:py-32 dark:text-white"
    >
      {/* Whole-screen background morphing layer */}
      <div
        ref={bgLayerRef}
        className="pointer-events-none absolute inset-0 z-0 bg-primary dark:bg-[#114AFC]"
      />
      {/* Grid overlay for About section background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundSize: "72px 72px",
          backgroundImage: `
            linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px)
          `
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-8 md:gap-y-24">
        {/* Headline with Interactive Play Button & Single-Word Marquee Box */}
        <h2
          ref={headlineRef}
          className="col-span-1 select-none font-display text-3xl font-extrabold uppercase leading-[1.12] tracking-tight md:col-span-12 sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5.25rem]"
        >
          {/* Line 1 */}
          <span className="word inline-block">A</span>{" "}
          <span className="word inline-block">product</span>{" "}
          <span className="word inline-block">designer</span>
          <br className="hidden sm:block" />{" "}

          {/* Line 2 with Interactive Play Button */}
          <span className="word inline-block">focused</span>{" "}
          <span className="word inline-block">on</span>{" "}
          <button
            type="button"
            onClick={() => setRibbonsActive((v) => !v)}
            aria-label="Toggle diagonal quote ribbons"
            className="group relative inline-flex h-[0.95em] w-[0.95em] mx-1.5 sm:mx-2.5 align-middle items-center justify-center bg-primary text-white rounded-lg sm:rounded-xl shadow-md transition-all duration-200 hover:scale-110 hover:bg-primary-dark active:scale-95 active:bg-primary-active cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-active focus:ring-offset-2 overflow-hidden dark:bg-[#114AFC] dark:hover:bg-[#022CDB] dark:active:bg-[#0013B2] dark:focus:ring-[#0013B2]"
          >
            <span className="inline-flex items-center justify-center w-full h-full animate-shake">
              {ribbonsActive ? (
                <svg className="w-1/2 h-1/2 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-1/2 h-1/2 fill-current translate-x-[1px]" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </span>
          </button>{" "}
          <span className="word inline-block">what</span>{" "}
          <span className="word inline-block">actually</span>
          <br className="hidden sm:block" />{" "}

          {/* Line 3 with Single-Word Marquee Box (Active ONLY when play button is ON) */}
          <span className="word inline-block">works</span>{" "}
          <span className="word inline-block">designing</span>{" "}
          <span className="word inline-block">for</span>{" "}
          <span className="relative inline-flex items-center justify-center align-middle bg-primary dark:bg-[#114AFC] text-white rounded-lg px-2 sm:px-3 py-0.5 mx-1.5 sm:mx-2.5 overflow-hidden w-[3.6em] sm:w-[4.2em] md:w-[4.8em] lg:w-[5.2em] h-[0.92em] shadow-sm select-none shrink-0">
            <span
              key={`${wordIndex}-${ribbonsActive}`}
              className={`inline-block font-extrabold text-white text-[0.60em] sm:text-[0.64em] md:text-[0.68em] leading-none tracking-tight whitespace-nowrap ${ribbonsActive ? "animate-single-word-marquee" : ""
                }`}
            >
              {SINGLE_MARQUEE_WORDS[wordIndex]}
            </span>
          </span>{" "}
          <span className="word inline-block">impact,</span>
          <br className="hidden sm:block" />{" "}

          {/* Line 4 */}
          <span className="word inline-block">not</span>{" "}
          <span className="word inline-block">just</span>{" "}
          <span className="word inline-block">appearance.</span>
        </h2>

        {/* Body copy */}
        <div className="col-span-1 flex flex-col gap-6 self-end md:col-span-4 md:col-start-5">
          <p className="font-display text-base normal-case leading-relaxed text-ink/70 dark:text-white/70 sm:text-lg">
            {body.aboutBodyParagraph1}
          </p>
          <p className="font-display text-base normal-case leading-relaxed text-ink/70 dark:text-white/70 sm:text-lg">
            {body.aboutBodyParagraph2}
          </p>
        </div>

        {/* Portrait */}
        <div
          ref={imageOuterRef}
          className="relative col-span-1 h-[60vh] w-full overflow-hidden md:col-span-4 md:col-start-9 md:h-[34rem]"
        >
          <img
            ref={imageInnerRef}
            src={aboutPortrait}
            alt="Tony, seated outdoors in dark clothing beside a black horse"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Diagonal Ribbon Overlay Layer */}
      <div
        className={`absolute inset-0 z-30 overflow-hidden transition-opacity duration-700 ${ribbonsActive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 delay-700"
          }`}
        onClick={() => setRibbonsActive(false)}
      >
        <div className="relative h-full w-full">
          {/* Ribbon 1: Purple (#114AFC) - Slanted UPWARDS (+9deg) in background */}
          <div
            ref={ribbon1Ref}
            className={`absolute left-1/2 top-[60%] w-[240vw] ${RIBBON_1_COLOR} py-4 sm:py-6 md:py-7 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] will-change-transform z-10`}
          >
            <div className="flex whitespace-nowrap overflow-hidden font-display text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6">
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
              </div>
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6" aria-hidden="true">
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
              </div>
            </div>
          </div>

          {/* Ribbon 2: Dark (#121212) - Slanted DOWNWARDS (-14deg) in foreground crossing over Ribbon 1 */}
          <div
            ref={ribbon2Ref}
            className={`absolute left-1/2 top-[52%] w-[240vw] ${RIBBON_2_COLOR} py-4 sm:py-6 md:py-7 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8)] will-change-transform z-20`}
          >
            <div className="flex whitespace-nowrap overflow-hidden font-display text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6">
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
              </div>
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6" aria-hidden="true">
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
                <span>MOST OF MY IDEAS COMES IN THE MORNING •</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;

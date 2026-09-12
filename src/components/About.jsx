import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import aboutPortrait from "../assets/about-portrait.webp";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { homepageContentQuery } from "../sanity/queries";
import { urlFor } from "../sanity/client";
import { useThemeTokens } from "../theme/ThemeTokensContext";
import CircularTextButton from "./CircularTextButton";

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
const RIBBON_2_COLOR = "bg-[#F8FFB4]"; // Yellow Ribbon matching play button (Top layer, slanting DOWN)

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

  const isDark = theme
    ? theme === "dark"
    : typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const portraitAssetForTheme = isDark ? content?.aboutPortraitDark : content?.aboutPortraitLight;
  const portraitUrl = urlFor(portraitAssetForTheme)?.width(1200).auto("format").url() || aboutPortrait;
  const portraitAlt =
    (isDark ? content?.aboutPortraitDarkAlt : content?.aboutPortraitLightAlt) ||
    "Tony, seated outdoors in dark clothing beside a black horse";

  const lightPortraitUrl = urlFor(content?.aboutPortraitLight)?.width(1200).auto("format").url() || aboutPortrait;
  const darkPortraitUrl = urlFor(content?.aboutPortraitDark)?.width(1200).auto("format").url() || aboutPortrait;

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

    const mm = gsap.matchMedia(section);

    mm.add("(min-width: 768px)", () => {
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
            `+=${window.innerHeight * PIN_DISTANCE_VH}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });

      tlRef.current = tl;

      // Smooth background color morphing from mascot color to target theme background.
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
    });

    mm.add("(max-width: 767px)", () => {
      // Mobile fallback: reveal text/images immediately, no pin
      gsap.set(wordElements, { opacity: 1 });
      gsap.set(imageOuter, { clipPath: "inset(0 0 0% 0)" });
      gsap.set(imageInner, { scale: 1 });

      const isDark = theme
        ? theme === "dark"
        : document.documentElement.classList.contains("dark");
      const targetBgColor = isDark ? "#0c0a14" : themeTokens.backgroundColor;
      if (bgLayerRef.current) {
        gsap.set(bgLayerRef.current, { backgroundColor: targetBgColor });
      }
    });

    return () => mm.revert();
    // themeTokens starts at the light defaults and updates once the
    // Sanity fetch resolves — rebuilding here (like the other pinned
    // sections do) picks up the real morph-start color for whichever
    // theme is actually selected, instead of staying stuck on defaults.
  }, [themeTokens]);

  // GSAP Smooth Slow Slide-In (Play) & Slow Slide-Out Off-Screen (Pause).
  // `will-change` is applied imperatively for just the tween's own
  // duration (onStart -> onComplete) rather than sitting in the JSX as
  // a permanent class — these two full-width (240vw) elements are only
  // ever actually moving during this ~0.9-1s transition; the rest of
  // the time (ribbonsActive sitting true/false at rest) there's no
  // animation running, so no reason to keep either promoted as its own
  // compositor layer. `onComplete` still fires if the tween is
  // overwritten by a fresh toggle before finishing (GSAP calls the
  // outgoing tween's onInterrupt, not onComplete, in that case — added
  // explicitly below so a rapid double-toggle can't leave will-change
  // stuck on).
  useEffect(() => {
    const r1 = ribbon1Ref.current;
    const r2 = ribbon2Ref.current;
    if (!r1 || !r2) return;

    const promote = (el) => { el.style.willChange = "transform"; };
    const settle = (el) => { el.style.willChange = "auto"; };

    if (ribbonsActive) {
      // Toggle ON (Play): Smooth slow slide-in from off-screen opposite edges
      promote(r1);
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
          onComplete: () => settle(r1),
          onInterrupt: () => settle(r1),
        }
      );

      promote(r2);
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
          onComplete: () => settle(r2),
          onInterrupt: () => settle(r2),
        }
      );
    } else {
      // Toggle OFF (Pause): Smooth slow slide out all the way off-screen
      promote(r1);
      gsap.to(r1, {
        xPercent: 180,
        opacity: 0,
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: () => settle(r1),
        onInterrupt: () => settle(r1),
      });
      promote(r2);
      gsap.to(r2, {
        xPercent: -220,
        opacity: 0,
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: () => settle(r2),
        onInterrupt: () => settle(r2),
      });
    }
  }, [ribbonsActive]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 -mt-px overflow-hidden px-6 py-24 text-ink transition-colors duration-300 sm:px-10 sm:py-28 md:px-14 md:py-32 dark:text-white"
    >
      {/* Preload both portrait variants so switching is instant without flashing empty */}
      <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img src={lightPortraitUrl} alt="" />
        <img src={darkPortraitUrl} alt="" />
      </div>

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

      <div className="relative z-10 mx-auto grid w-full max-w-8xl grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-8 md:gap-y-24">
        {/* Headline with Interactive Play Button & Single-Word Marquee Box */}
        <h2
          ref={headlineRef}
          className="col-span-1 select-none font-display text-3xl font-normal normal-case leading-[1.12] tracking-tight md:col-span-12 sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5.25rem]"
        >
          <span className="block font-display text-sm sm:text-base font-normal tracking-wide text-ink/70 dark:text-white/70 uppercase mb-4 sm:mb-6">
            [ About Me ]
          </span>
          {/* Line 1 */}
          <span className="word inline-block">A</span>{" "}
          <span className="word inline-block">product</span>{" "}
          <span className="word inline-block">designer</span>{" "}

          {/* Line 2 with Interactive Play Button */}
          <span className="word inline-block">focused</span>{" "}
          <span className="word inline-block">on</span>{" "}
          <button
            type="button"
            onClick={() => setRibbonsActive((v) => !v)}
            aria-label="Toggle diagonal quote ribbons"
            className="group relative inline-flex h-[0.95em] w-[0.95em] mx-1.5 sm:mx-2.5 align-middle items-center justify-center bg-[#F8FFB4] text-black rounded-lg sm:rounded-xl shadow-md transition-all duration-200 hover:scale-110 hover:brightness-95 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F8FFB4] focus:ring-offset-2 overflow-hidden dark:bg-[#F8FFB4] dark:text-black"
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
          <span className="word inline-block">actually</span>{" "}

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
          <span className="word inline-block">impact,</span>{" "}

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

        {/* Portrait — grid placement + `relative` now live on this
            wrapper, not on imageOuterRef itself. The scroll effect below
            applies an animated `clip-path: inset()` directly to
            imageOuterRef for its reveal wipe, so anything nested inside
            it (the badge included) would be invisible until that wipe
            finishes and re-clipped on scroll-back. Keeping the badge as
            a sibling of imageOuterRef instead avoids that entirely,
            without changing imageOuterRef's own box (same height/width
            classes moved up, imageOuterRef just fills this wrapper). */}
        <div className="relative col-span-1 h-[60vh] w-full md:col-span-4 lg:max-w-[26rem]  md:col-start-9 md:h-[34rem]">
          <div ref={imageOuterRef} className="h-full w-full overflow-hidden">
            <img
              ref={imageInnerRef}
              src={portraitUrl}
              alt={portraitAlt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Badge overlapping the body-copy/portrait column boundary.
              Small offset on mobile (columns are stacked there, so a
              large negative offset would push it past the section's own
              edge padding) and a larger straddling offset from md: up,
              where the two columns actually sit side by side. Wrapped in
              its own positioning div rather than passing `absolute`
              into CircularTextButton's className — the component
              already sets `relative` on itself internally (so its own
              rotating ring/fill span can anchor to it), and stacking an
              `absolute` utility on top of that on the same element would
              be two conflicting `position` utilities with no reliable
              winner. */}
          <div className="absolute -left-4 -top-4 z-20 md:-left-12 md:-top-10">
            <CircularTextButton />
          </div>
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
            className={`absolute left-1/2 top-[60%] w-[240vw] ${RIBBON_1_COLOR} py-4 sm:py-6 md:py-7 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10`}
          >
            <div className="flex whitespace-nowrap overflow-hidden font-display text-2xl sm:text-4xl md:text-4xl font-medium uppercase tracking-tight">
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6">
                <span>WILL REDESIGN THIS PAGE FIVE MORE TIMES •</span>
                <span>HAS STRONG OPINIONS ABOUT BORDER-RADIUS AND PAST LIVES •</span>
                <span>STILL THINKING IN PATTERNS, EVEN OFF THE CLOCK •</span>
                <span>WILL REDESIGN THIS PAGE FIVE MORE TIMES •</span>
                <span>HAS STRONG OPINIONS ABOUT BORDER-RADIUS AND PAST LIVES •</span>
                <span>STILL THINKING IN PATTERNS, EVEN OFF THE CLOCK •</span>


              </div>
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6" aria-hidden="true">
                <span>WILL REDESIGN THIS PAGE FIVE MORE TIMES •</span>
                <span>HAS STRONG OPINIONS ABOUT BORDER-RADIUS AND PAST LIVES •</span>
                <span>STILL THINKING IN PATTERNS, EVEN OFF THE CLOCK •</span>
                <span>WILL REDESIGN THIS PAGE FIVE MORE TIMES •</span>
                <span>HAS STRONG OPINIONS ABOUT BORDER-RADIUS AND PAST LIVES •</span>
                <span>STILL THINKING IN PATTERNS, EVEN OFF THE CLOCK •</span>


              </div>
            </div>
          </div>

          {/* Ribbon 2: Yellow (#F8FFB4) - Slanted DOWNWARDS (-14deg) in foreground crossing over Ribbon 1 */}
          <div
            ref={ribbon2Ref}
            className={`absolute left-1/2 top-[52%] w-[240vw] ${RIBBON_2_COLOR} py-4 sm:py-6 md:py-7 text-black shadow-[0_15px_40px_rgba(0,0,0,0.1)] z-20`}
          >
            <div className="flex whitespace-nowrap overflow-hidden font-display text-2xl sm:text-4xl md:text-4xl font-medium uppercase tracking-tight">
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6">
                <span>PLANS EVERYTHING •</span>
                <span>STILL SHIPS BY INSTINCT •</span>
                <span>REDRAWS THE SAME SCREEN TWELVE TIMES •</span>
                <span>DESIGN IS A DECISION, NOT A DECORATION •</span>
                <span>PLANS EVERYTHING •</span>
                <span>STILL SHIPS BY INSTINCT •</span>
                <span>REDRAWS THE SAME SCREEN TWELVE TIMES •</span>
                <span>DESIGN IS A DECISION, NOT A DECORATION •</span>


              </div>
              <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6" aria-hidden="true">
                <span>PLANS EVERYTHING •</span>
                <span>STILL SHIPS BY INSTINCT •</span>
                <span>REDRAWS THE SAME SCREEN TWELVE TIMES •</span>
                <span>DESIGN IS A DECISION, NOT A DECORATION •</span>
                <span>PLANS EVERYTHING •</span>
                <span>STILL SHIPS BY INSTINCT •</span>
                <span>REDRAWS THE SAME SCREEN TWELVE TIMES •</span>
                <span>DESIGN IS A DECISION, NOT A DECORATION •</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;

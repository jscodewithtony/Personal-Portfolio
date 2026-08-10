import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import aboutPortrait from "../assets/about-portrait.webp";

gsap.registerPlugin(ScrollTrigger);

const PIN_DISTANCE_VH = 1.1;

// =========================================================================
// RIBBON & MARQUEE WORD CUSTOMIZATION
// =========================================================================
const RIBBON_1_COLOR = "bg-[#5953b0]"; // Purple Ribbon (Bottom layer, slanting UP)
const RIBBON_2_COLOR = "bg-[#121212]"; // Dark Ribbon (Top layer, slanting DOWN)

const SINGLE_MARQUEE_WORDS = [
  "HUMANS",
  "MEASURABLE",
  "HONEST",
  "MEANINGFUL",
  "PRACTICAL",
];

function About({ theme }) {
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
      const targetColor = isDark ? "#0c0a14" : "#f1f0fa";

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
  }, [theme]);

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
          end: () => `+=${window.innerHeight * PIN_DISTANCE_VH}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });

      tlRef.current = tl;

      // Smooth background color morphing from mascot purple (#5953b0) to target theme background
      const isDark = theme
        ? theme === "dark"
        : document.documentElement.classList.contains("dark");
      const targetBgColor = isDark ? "#0c0a14" : "#f1f0fa";

      if (bgLayerRef.current) {
        bgTweenRef.current = gsap.fromTo(
          bgLayerRef.current,
          { backgroundColor: "#5953b0" },
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

      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
      const settleTimer = setTimeout(() => ScrollTrigger.refresh(), 300);
      return () => clearTimeout(settleTimer);
    }, section);

    return () => ctx.revert();
  }, []);

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
        className="pointer-events-none absolute inset-0 z-0 bg-[#5953b0]"
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
          <br />

          {/* Line 2 with Interactive Play Button */}
          <span className="word inline-block">focused</span>{" "}
          <span className="word inline-block">on</span>{" "}
          <button
            type="button"
            onClick={() => setRibbonsActive((v) => !v)}
            aria-label="Toggle diagonal quote ribbons"
            className="group relative inline-flex h-[0.95em] w-[0.95em] mx-1.5 sm:mx-2.5 align-middle items-center justify-center bg-[#5953b0] text-white rounded-lg sm:rounded-xl shadow-md transition-all duration-200 hover:scale-110 hover:bg-[#46408c] active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5953b0] focus:ring-offset-2 overflow-hidden"
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
          <br />

          {/* Line 3 with Single-Word Marquee Box (Active ONLY when play button is ON) */}
          <span className="word inline-block">works</span>{" "}
          <span className="word inline-block">designing</span>{" "}
          <span className="word inline-block">for</span>{" "}
          <span className="relative inline-flex items-center justify-center align-middle bg-[#5953b0] text-white rounded-lg px-2 sm:px-3 py-0.5 mx-1.5 sm:mx-2.5 overflow-hidden w-[3.6em] sm:w-[4.2em] md:w-[4.8em] lg:w-[5.2em] h-[0.92em] shadow-sm select-none shrink-0">
            <span
              key={`${wordIndex}-${ribbonsActive}`}
              className={`inline-block font-extrabold text-white text-[0.60em] sm:text-[0.64em] md:text-[0.68em] leading-none tracking-tight whitespace-nowrap ${
                ribbonsActive ? "animate-single-word-marquee" : ""
              }`}
            >
              {SINGLE_MARQUEE_WORDS[wordIndex]}
            </span>
          </span>{" "}
          <span className="word inline-block">impact,</span>
          <br />

          {/* Line 4 */}
          <span className="word inline-block">not</span>{" "}
          <span className="word inline-block">just</span>{" "}
          <span className="word inline-block">appearance.</span>
        </h2>

        {/* Body copy */}
        <div className="col-span-1 flex flex-col gap-6 self-end md:col-span-4 md:col-start-5">
          <p className="font-display text-base leading-relaxed text-ink/70 dark:text-white/70 sm:text-lg">
            I value clarity, structure, and intent — both in design and in
            how I build. I am drawn to systems that hold up under scale:
            patterns, not one-offs. I believe good design is governed, not
            just made — every decision should trace back to a reason.
          </p>
          <p className="font-display text-base leading-relaxed text-ink/70 dark:text-white/70 sm:text-lg">
            I like building things end to end, from the first sketch to
            the shipped product. And I trust frameworks over instinct —
            but only the ones I've tested myself.
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
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Diagonal Ribbon Overlay Layer */}
      <div
        className={`absolute inset-0 z-30 overflow-hidden transition-opacity duration-700 ${
          ribbonsActive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 delay-700"
        }`}
        onClick={() => setRibbonsActive(false)}
      >
        <div className="relative h-full w-full">
          {/* Ribbon 1: Purple (#5953b0) - Slanted UPWARDS (+9deg) in background */}
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

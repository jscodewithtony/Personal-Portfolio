import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FitGroup from "./FitGroup";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { homepageContentQuery } from "../sanity/queries";
import { useSignalSectionMounted } from "../hooks/useSectionMountRefresh";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK = {
  statementHeadline: "Design is a series of decisions so you",
  statementTrailingLine: "Don't have to make one.",
};

// The 4-line poster layout is a fixed visual shape (3 words / 2 words /
// 1 word / 2 words), not a generic wrap — re-chunks whatever headline
// the CMS provides into that same shape so editors can change the
// wording without needing to know the line-break mechanics.
function splitHeadlineIntoLines(headline) {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  const pattern = [3, 2, 1, 2];
  const lines = [];
  let i = 0;
  for (let li = 0; li < pattern.length; li++) {
    const isLast = li === pattern.length - 1;
    const count = isLast ? Math.max(1, words.length - i) : pattern[li];
    lines.push(words.slice(i, i + count).join(" "));
    i += count;
  }
  return lines;
}

const SMALL =
  "font-display text-base font-semibold leading-snug text-ink/80 dark:text-white/90 sm:text-2xl md:text-4xl lg:text-5xl";
const BIG =
  "select-none font-display font-black uppercase leading-[1.0] tracking-tight text-ink dark:text-white";

// How much extra scroll distance (relative to the viewport) the section
// stays pinned for while the heading settles and the aside arrives.
const PIN_DISTANCE_VH = 1.2;
// Touch swipes cover roughly the same physical distance as a desktop
// wheel-scroll tick, but this pin's distance is computed from
// window.innerHeight — smaller on mobile — so the same gesture
// consumes a bigger share of it there, making the scrub feel like
// it's rushing by faster on phones. A larger mobile-only distance
// restores a native-feeling pace without changing the animation.
const MOBILE_PIN_DISTANCE_VH = 1.9;
// Final scale of the heading once the aside has fully arrived.
const HEADING_END_SCALE = 0.72;
// Number of stacked poster lines the heading font-size budget is split
// across.
const LINE_COUNT = 4;

// FitGroup fits font-size to the container's WIDTH only — it has no idea
// how many lines it's stacking, so a flat pixel cap (tried twice already)
// either overflows on shorter viewports or under-fills on taller ones.
// Deriving the cap from the actual viewport height instead means 4
// stacked lines always fit within the section's available vertical
// space (roughly what's left after its own top/bottom padding), on any
// screen, at scale 1 — before the scroll-driven shrink to
// HEADING_END_SCALE even starts.
function computeHeadingMaxFontSize() {
  if (typeof window === "undefined") return 160;
  // Rough worst-case section padding (md:py-32 = 128px top + bottom) plus
  // room for the trailing aside now sitting inline on the last line.
  const verticalChrome = 300;
  const available = Math.max(290, window.innerHeight - verticalChrome);
  const perLine = available / LINE_COUNT;
  // 0.9 safety margin — leading-[1.0] still has a hair of natural
  // overshoot beyond the nominal font-size box. +10 bumps the whole
  // headline up a size notch per request.
  return Math.round(Math.min(290, Math.max(82, perLine * 0.9 + 10)));
}

function Statement() {
  const { data: content, status } = useSanityQuery(
    homepageContentQuery,
    {},
    null
  );
  const c = status === "ready" ? { ...FALLBACK, ...content } : FALLBACK;
  const headlineWords = splitHeadlineIntoLines(c.statementHeadline);
  const fullSentence = `${c.statementHeadline} ${c.statementTrailingLine}`;

  useSignalSectionMounted("statement");

  const sectionRef = useRef(null);
  const scaleWrapRef = useRef(null);
  const trailingAsideRef = useRef(null);
  const line1RowRef = useRef(null);
  const line2RowRef = useRef(null);
  const line3RowRef = useRef(null);
  const line4RowRef = useRef(null);
  const [headingMaxFontSize, setHeadingMaxFontSize] = useState(
    computeHeadingMaxFontSize
  );

  useEffect(() => {
    const handle = () => setHeadingMaxFontSize(computeHeadingMaxFontSize());
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const ROW_CLASS =
    "flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 sm:gap-x-4";

  const lines = [
    {
      key: "line1",
      rowClassName: ROW_CLASS,
      rowRef: line1RowRef,
      content: (
        <>
          Design is<span className="hidden sm:inline"> a</span>
        </>
      ),
    },
    {
      key: "line2",
      rowClassName: ROW_CLASS,
      rowRef: line2RowRef,
      content: (
        <>
          <span className="inline sm:hidden">a </span>series of
        </>
      ),
    },
    { key: "line3", rowClassName: ROW_CLASS, rowRef: line3RowRef, content: "decisions" },
    {
      key: "line4",
      rowClassName: ROW_CLASS,
      rowRef: line4RowRef,
      content: "so you",
      after: (
        <span
          ref={trailingAsideRef}
          aria-hidden="true"
          className={`max-w-[11rem] sm:max-w-[16rem] md:max-w-[24rem] ${SMALL}`}
        >
          {c.statementTrailingLine}
        </span>
      ),
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    const right = trailingAsideRef.current;
    const scaleWrap = scaleWrapRef.current;
    const rowRefs = [line1RowRef, line2RowRef, line3RowRef, line4RowRef];
    const rows = rowRefs.map((r) => r.current);
    const words = rows.map((row) => row?.children[0]);
    if (!section || !right || !scaleWrap || rows.some((r) => !r) || words.some((w) => !w))
      return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      const setRestingPositions = () => {
        gsap.set(right, { x: window.innerWidth, opacity: 0 });
        rows.forEach((row, i) => {
          const word = words[i];
          const fakeCenterOffset = Math.max(
            0,
            (row.clientWidth - word.offsetWidth) / 2
          );
          gsap.set(word, { x: fakeCenterOffset });
        });
      };
      setRestingPositions();
      gsap.set(scaleWrap, { scale: 1, opacity: 1 });

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

      tl.to(scaleWrap, { scale: HEADING_END_SCALE, ease: "none", duration: 1 }, 0);
      words.forEach((word) => {
        tl.to(word, { x: 0, ease: "none", duration: 1 }, 0);
      });
      tl.to(right, { x: 0, opacity: 1, ease: "none", duration: 1 }, 0);

      const handleResize = () => {
        if (tl.scrollTrigger && tl.scrollTrigger.progress === 0) {
          setRestingPositions();
        }
      };
      window.addEventListener("resize", handleResize);

      document.fonts?.ready?.then(() => {
        handleResize();
      });
      const settleTimer = setTimeout(() => {
        handleResize();
      }, 300);
      return () => {
        clearTimeout(settleTimer);
        window.removeEventListener("resize", handleResize);
      };
    }, section);

    return () => ctx.revert();
    // Re-runs when the CMS content resolves from fallback text to the
    // real headline/trailing line, so the word-width measurements this
    // effect takes (setRestingPositions) reflect the final content
    // instead of stale fallback-text dimensions.
  }, [c.statementHeadline, c.statementTrailingLine]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 -mt-px overflow-hidden bg-bg px-6 py-24 text-ink transition-colors duration-300 sm:px-10 sm:py-28 md:px-14 md:py-32 dark:bg-[#0c0a14] dark:text-white"
    >
      {/* Extra inset (on top of the section's own padding) so the fitted
          text reads as a contained block with breathing room on every
          side, instead of stretching flush to the section's edge. */}
      <div
        role="text"
        aria-label={fullSentence}
        className="mx-auto w-full max-w-7xl px-[6%] sm:px-[8%]"
      >
        <div ref={scaleWrapRef}>
          <FitGroup
            className={BIG}
            maxFontSize={headingMaxFontSize}
            minFontSize={40}
            lines={lines}
          />
        </div>
      </div>
    </section>
  );
}

export default Statement;

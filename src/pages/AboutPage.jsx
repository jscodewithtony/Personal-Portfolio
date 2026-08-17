import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Header from "../components/Header";
import Reveal from "../components/Reveal";
import CanvasCursor from "../components/CanvasCursor";
import portraitImg from "../assets/about-page/portrait.webp";
import groupPhotoImg from "../assets/about-page/group-photo.webp";
import travelCollageImg from "../assets/about-page/travel-collage.webp";
import iconMark from "../assets/about-page/icon-mark.svg";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { homepageContentQuery } from "../sanity/queries";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

// Figma: https://www.figma.com/design/I84MayZQYr2Bri3Se2lfRT/Personal-Portfolio
//   Light: node-id=547-714 ("About-me-Blue-White-theme-enabled")
//   Dark:  node-id=568-1398 ("About-me-Blue-Dark-theme-enabled")
//
// Literal 1:1 structural port — every distinct node in the Figma frame
// (by its own top position, top-to-bottom) is its own block below, in
// the same order, nothing merged or dropped. Both frames share the
// exact same node structure/copy/imagery; the only per-theme value is
// the page's own surface color (blue vs Figma's own #161616, which is
// deliberately not the site's usual #0c0a14 dark bg). Everything else
// — white timeline card, yellow highlight bar, gray placeholder blocks,
// off-white body text, orange CTA — is constant across both frames.
//
// Scope note: the shared <Header> keeps its own global light/dark
// text-color rule (off-limits here) — on this page's blue light-mode
// background that reads as a deliberate trade-off, not an oversight.
// The footer/contact section reuses the same shared <Footer /> (piano
// keyboard included) the rest of the site uses, per explicit request,
// rather than this page's own distinct Figma footer treatment.

const FALLBACK_BODY = {
  aboutBodyParagraph1:
    "For the last five years I've worked across Tekxera and a handful of freelance clients, mostly on design systems, AI-native product surfaces, and the occasional brand identity. Outside of client work I build NudgeFile, a solo Windows app, end to end — design, code, and ship.",
};

const MARQUEE_TEXT = "Most of my ideas comes in the morning";
const MARQUEE_REPEATS = Array.from({ length: 10 });

const TIMELINE = [
  { year: "2026", text: "Freelancing alongside Tekxera, including brand and content work for takara.ai" },
  { year: "2025", text: "Launched NudgeFile — first solo shipped product, design to code" },
  { year: "2024", text: "DLS reaches 20+ governed product features across the platform" },
  { year: "2021", text: "Started at Gemraj Technologies as a product designer" },
];

// The repeated-truncation cluster (Figma nodes 547:719/720/721) — three
// separate positioned instances of the same sentence at three different
// cut points, sitting right before the "I designed impactful website…"
// headline. Kept as three literal, separate blocks per the brief,
// rather than collapsed into one paragraph.
const REPEAT_LEFT =
  "For the last five years I've worked across Tekxera and a handful of freelance clients,";
const REPEAT_RIGHT = REPEAT_LEFT;
const REPEAT_CENTER =
  "For the last five years I've worked across Tekxera and a handful of freelance clients, mostly on design systems, AI-native product surfaces,";

// Curtain-mask reveal (adapted from Originkit's Mask Text Reveal) —
// clip-path animates on the whole headline block rather than fading
// words individually. Only plays while the page is actively scrolling
// *down*. Scrolling back up leaves whatever has already revealed
// visible (it does NOT re-hide) — the whole set only re-arms once the
// user scrolls all the way back to the very top of the page, so the
// next downward scroll replays every reveal from scratch.
const CURTAIN_INSET_MAP = {
  "center-horizontal": "inset(0% 50% 0% 50%)",
  "center-vertical": "inset(50% 0% 50% 0%)",
  "left-to-right": "inset(0% 100% 0% 0%)",
  "right-to-left": "inset(0% 0% 0% 100%)",
  "top-to-bottom": "inset(0% 0% 100% 0%)",
  "bottom-to-top": "inset(100% 0% 0% 0%)",
};
const CURTAIN_REVEALED_CLIP = "inset(0% 0% 0% 0%)";

// Single shared scroll listener (ref-counted) instead of one per headline.
// `headlineRegistry` lets that one listener reset every mounted headline
// back to hidden the moment the page reaches scrollY 0.
let sharedScrollDirection = "down";
let sharedLastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
let sharedListenerCount = 0;
const headlineRegistry = new Set();

// Measured fresh from the DOM every time, instead of relying on
// IntersectionObserver's cached/event-driven state — a headline that
// sits close to the very top of the page (like the huge lg:text-[16rem]
// hero headline) can still be "in view" right after the top-reset below,
// with no new crossing event left to fire and re-trigger it. A direct
// rect check has no such staleness window, whatever the element's size.
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function tryRevealHeadline(entry) {
  if (entry.revealedRef.current) return;
  if (isElementInViewport(entry.el)) {
    animate(entry.el, { clipPath: CURTAIN_REVEALED_CLIP }, { duration: 1, ease: "easeInOut" });
    entry.revealedRef.current = true;
  }
}

function handleSharedWindowScroll() {
  const y = window.scrollY;
  if (y > sharedLastScrollY) sharedScrollDirection = "down";
  else if (y < sharedLastScrollY) sharedScrollDirection = "up";
  sharedLastScrollY = y;

  if (y <= 0) {
    headlineRegistry.forEach((entry) => {
      if (entry.revealedRef.current) {
        animate(entry.el, { clipPath: entry.startClip }, { duration: 0 });
        entry.revealedRef.current = false;
      }
    });
    return;
  }

  if (sharedScrollDirection === "down") {
    headlineRegistry.forEach(tryRevealHeadline);
  }
}
function useSharedScrollDirection() {
  useEffect(() => {
    if (sharedListenerCount === 0) {
      sharedLastScrollY = window.scrollY;
      window.addEventListener("scroll", handleSharedWindowScroll, { passive: true });
    }
    sharedListenerCount += 1;
    return () => {
      sharedListenerCount -= 1;
      if (sharedListenerCount === 0) {
        window.removeEventListener("scroll", handleSharedWindowScroll);
      }
    };
  }, []);
}

function WordHeadline({
  text,
  className = "",
  direction = "top-to-bottom",
  animated = true,
  wordRef,
}) {
  const shouldReduceMotion = useReducedMotion();
  const startClip = CURTAIN_INSET_MAP[direction] || CURTAIN_INSET_MAP["top-to-bottom"];
  const elRef = useRef(null);
  const isAnimated = animated && !shouldReduceMotion;

  useSharedScrollDirection();

  useEffect(() => {
    if (!isAnimated) return;
    const el = elRef.current;
    if (!el) return;

    const revealedRef = { current: false };
    const entry = { el, startClip, revealedRef };
    headlineRegistry.add(entry);

    // Covers the case where this headline is already in view on mount
    // (e.g. the hero headline, right at the top of the page on load).
    tryRevealHeadline(entry);

    return () => {
      headlineRegistry.delete(entry);
    };
  }, [isAnimated, startClip]);

  return (
    <h2
      ref={elRef}
      className={`select-none flex flex-wrap justify-center gap-x-[0.28em] font-display font-extrabold uppercase leading-[0.95] tracking-tight text-[#fafafa] ${className}`}
      style={isAnimated ? { clipPath: startClip, willChange: "clip-path" } : undefined}
    >
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          ref={wordRef ? (el) => wordRef(i, el) : undefined}
          className="inline-block"
        >
          {word}
        </span>
      ))}
    </h2>
  );
}

// --- "Know more about Myself Beyond as a designer" annotation dots ---
// Scoped entirely to this one headline instance. Each entry anchors to
// one word in the headline (by its index in the text.split(" ") array)
// and a corner of that word's own bounding box, so the dot tracks the
// text at every breakpoint instead of a raw container-relative percent
// guess. `text` is the placeholder tooltip copy — swap per-dot later,
// or map this array to a Sanity field (e.g. `aboutHeadlineAnnotations`).
const KNOW_MORE_HEADLINE_TEXT = "Know more about Myself Beyond as a designer";
const KNOW_MORE_ANNOTATIONS = [
  {
    id: "know",
    wordIndex: 0, // "Know"
    corner: "top-left",
    text: "Beans and potatoes? Not my thing. But I like mashed Potatoes \u{1F605}",
  },
  {
    id: "about",
    wordIndex: 2, // "about"
    corner: "top-right",
    text: "I have Five best friends and they are all boys. 😕 \u{1F605}",
  },
  {
    id: "beyond",
    wordIndex: 4, // "Beyond"
    corner: "left-center",
    text: "Most of my best ideas come In the Morning 🌞 \u{1F605}",
  },
  {
    id: "designer",
    wordIndex: 7, // "designer"
    corner: "center",
    text: "Less is more – except when it comes to snacks! \u{1F605}",
  },
];

function AnnotationDot({ x, y, text, isOpen, onOpen, onClose, onToggle, supportsHover }) {
  const wrapperRef = useRef(null);
  const [align, setAlign] = useState({ h: "left", v: "top" });

  useEffect(() => {
    if (!isOpen) return;
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setAlign({
      h: rect.left > window.innerWidth * 0.6 ? "right" : "left",
      v: rect.top < 140 ? "bottom" : "top",
    });
  }, [isOpen]);

  return (
    <div
      ref={wrapperRef}
      data-annotation-dot=""
      className="absolute z-20"
      style={{ left: x, top: y, transform: "translate(-10%, 60%)" }}
      onMouseEnter={supportsHover ? onOpen : undefined}
      onMouseLeave={supportsHover ? onClose : undefined}
    >
      <button
        type="button"
        onClick={supportsHover ? undefined : onToggle}
        aria-label="Show note"
        aria-expanded={isOpen}
        className="block h-6 w-6 rounded-full border-[3px] border-white bg-[#D9F51C] normal-case shadow-[0_0_0_2px_rgba(0,0,0,0.18)] transition-transform hover:scale-110 sm:h-7 sm:w-7 md:h-8 md:w-8"
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute z-30 w-72 rounded-none bg-[#D9F51C] p-6 text-left font-sans text-base font-medium normal-case leading-snug text-black shadow-xl sm:w-80 sm:p-3 sm:text-lg md:w-90 ${align.v === "top" ? "bottom-full mb-2" : "top-full mt-2"
              } ${align.h === "left"
                ? "left-0 ml-3 origin-bottom-left"
                : "right-0 mr-3 origin-bottom-right"
              }`}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KnowMoreHeadlineWithAnnotations() {
  const containerRef = useRef(null);
  const wordElsRef = useRef({});
  const [dotPositions, setDotPositions] = useState({});
  const [openDotId, setOpenDotId] = useState(null);
  const [supportsHover, setSupportsHover] = useState(true);
  const autoOpenedRef = useRef(false);

  const handleWordRef = useCallback((index, el) => {
    if (el) wordElsRef.current[index] = el;
    else delete wordElsRef.current[index];
  }, []);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const next = {};
    KNOW_MORE_ANNOTATIONS.forEach((annotation) => {
      const wordEl = wordElsRef.current[annotation.wordIndex];
      if (!wordEl) return;
      const rect = wordEl.getBoundingClientRect();
      let x = rect.left - containerRect.left;
      let y = rect.top - containerRect.top;
      if (annotation.corner === "top-left") {
        // dot stays at the word's own top-left corner
      } else if (annotation.corner === "top-right") {
        x += rect.width;
      } else if (annotation.corner === "left-center") {
        y += rect.height / 2;
      } else {
        x += rect.width * 0.6;
        y += rect.height * 0.55;
      }
      next[annotation.id] = { x, y };
    });
    setDotPositions(next);
  }, []);

  useEffect(() => {
    setSupportsHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Auto-open the first dot's tooltip once this headline scrolls into
  // view, then auto-close it after 5s. Runs once per mount; the other
  // dots stay idle until hovered/tapped.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let closeTimer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || autoOpenedRef.current) return;
        autoOpenedRef.current = true;
        const firstId = KNOW_MORE_ANNOTATIONS[0].id;
        setOpenDotId(firstId);
        closeTimer = window.setTimeout(() => {
          setOpenDotId((current) => (current === firstId ? null : current));
        }, 5000);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );
    observer.observe(container);
    return () => {
      observer.disconnect();
      window.clearTimeout(closeTimer);
    };
  }, []);

  // Tap-to-toggle on touch devices: tapping outside every dot closes
  // whichever one is open.
  useEffect(() => {
    if (supportsHover || !openDotId) return;
    const handlePointerDown = (event) => {
      if (!event.target.closest("[data-annotation-dot]")) {
        setOpenDotId(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [supportsHover, openDotId]);

  return (
    <div ref={containerRef} className="relative">
      <WordHeadline
        text={KNOW_MORE_HEADLINE_TEXT}
        className="mt-32 text-4xl sm:mt-40 sm:text-6xl md:text-8xl lg:text-[10rem]"
        wordRef={handleWordRef}
      />
      {KNOW_MORE_ANNOTATIONS.map((annotation) => {
        const pos = dotPositions[annotation.id];
        if (!pos) return null;
        const isOpen = openDotId === annotation.id;
        return (
          <AnnotationDot
            key={annotation.id}
            x={pos.x}
            y={pos.y}
            text={annotation.text}
            isOpen={isOpen}
            supportsHover={supportsHover}
            onOpen={() => setOpenDotId(annotation.id)}
            onClose={() => setOpenDotId((current) => (current === annotation.id ? null : current))}
            onToggle={() => setOpenDotId((current) => (current === annotation.id ? null : annotation.id))}
          />
        );
      })}
    </div>
  );
}

function AboutPage({ theme, onToggleTheme }) {
  const { data: content, status } = useSanityQuery(
    homepageContentQuery,
    {},
    null
  );
  const body =
    status === "ready" ? { ...FALLBACK_BODY, ...content } : FALLBACK_BODY;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const mainRef = useRef(null);

  return (
    <div className="site-shell relative min-h-[100dvh] bg-primary font-display text-[#fafafa] uppercase transition-colors duration-300 dark:bg-[#161616]">
      <CanvasCursor />
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main ref={mainRef} className="overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-14">
          <Link
            to="/"
            className="inline-block font-display text-xs font-bold uppercase tracking-widest text-[#fafafa]/50 transition-colors hover:text-[#fafafa]"
          >
            ← Back
          </Link>
        </div>

        {/* 547:715 — Hero headline */}
        <WordHeadline
          text="Who is This Curious fellow"
          className="mt-6 px-6 text-5xl sm:mt-10 sm:text-7xl md:text-8xl lg:text-[16rem]"
          animated={false}
        />

        {/* 547:763/764 — yellow ambient marquee band. Always dark text
            on the bright highlight, unchanged across both themes. */}
        <div className="relative z-10 mt-10 overflow-hidden bg-[#e3f900] py-4 text-[#161616] sm:mt-14 sm:py-6">
          <div className="flex whitespace-nowrap font-display text-xl font-semibold uppercase tracking-tight sm:text-3xl md:text-4xl">
            <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6">
              {MARQUEE_REPEATS.map((_, i) => (
                <span key={i}>{MARQUEE_TEXT} •</span>
              ))}
            </div>
            <div
              className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6"
              aria-hidden="true"
            >
              {MARQUEE_REPEATS.map((_, i) => (
                <span key={i}>{MARQUEE_TEXT} •</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-14">
          {/* 547:717 — intro line */}
          <Reveal
            as="p"
            className="mt-14 max-w-4xl font-display text-2xl font-semibold uppercase leading-[1.15] text-[#fafafa] sm:mt-20 sm:text-4xl md:text-5xl"
          >
            I'm a product designer who builds the systems other people design
            inside of — governed, not improvised.
          </Reveal>

          {/* 568:1348 portrait + 547:718 and 547:722 — two literal
              stacked instances of the same bio paragraph, as Figma has
              them, rather than one paragraph. */}
          <div className="mt-16 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-12 md:gap-12">
            <Reveal className="relative h-[50vh] w-full overflow-hidden md:col-span-5 md:h-[38rem]">
              <img
                src={portraitImg}
                alt="Tony"
                className="h-full w-full object-cover"
              />
            </Reveal>
            <div className="flex flex-col gap-8 self-center md:col-span-6 md:col-start-7">
              <Reveal
                as="p"
                delay={120}
                className="font-display text-lg normal-case leading-relaxed text-[#fafafa]/80 sm:text-xl md:text-2xl"
              >
                {body.aboutBodyParagraph1}
              </Reveal>
              <Reveal
                as="p"
                delay={200}
                className="font-display text-lg normal-case leading-relaxed text-[#fafafa]/80 sm:text-xl md:text-2xl"
              >
                {body.aboutBodyParagraph1}
              </Reveal>
            </div>
          </div>

        </div>

        {/* 564:1268 stock photo — full width, no placeholder backdrop */}
        <Reveal delay={100} className="mt-16 w-full sm:mt-20">
          <div className="relative h-[42vh] w-full overflow-hidden md:h-[36rem]">
            <img
              src={groupPhotoImg}
              alt="Tony with colleagues"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </Reveal>

        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-14">
          {/* 547:720 / 547:721 / 547:719 — the three-block repeated
              cluster, kept literal rather than collapsed. */}
          <div className="mt-16 sm:mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
              <Reveal
                as="p"
                className="font-display text-lg normal-case leading-relaxed text-[#fafafa] sm:text-xl md:text-2xl"
              >
                {REPEAT_LEFT}
              </Reveal>
              <Reveal
                as="p"
                delay={80}
                className="font-display text-lg normal-case leading-relaxed text-[#fafafa] sm:text-xl md:text-2xl"
              >
                {REPEAT_RIGHT}
              </Reveal>
            </div>
            <Reveal
              as="p"
              delay={160}
              className="mx-auto mt-8 max-w-3xl text-center font-display text-xl normal-case leading-relaxed text-[#fafafa] sm:mt-10 sm:text-2xl md:text-3xl"
            >
              {REPEAT_CENTER}
            </Reveal>
          </div>

          {/* 547:716 — second headline */}
          <WordHeadline
            text="I designed impactful website using a mix of Typography clean layouts"
            className="mt-32 text-4xl sm:mt-40 sm:text-6xl md:text-8xl lg:text-[10rem]"
          />

        </div>

        {/* 564:1269 second stock photo, full width, no placeholder
            backdrop — the 565:1320 "Professional Experience" white
            card sits dead-centered (both axes) over the photo on
            desktop, fully inside its bounds. */}
        <div className="relative mt-16 w-full sm:mt-20">
          <Reveal delay={0}>
            <div className="relative h-[42vh] w-full overflow-hidden md:h-[42rem]">
              <img
                src={groupPhotoImg}
                alt="Tony with colleagues, second angle"
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </Reveal>
          <Reveal
            delay={150}
            className="relative mx-6 mt-6 flex flex-col gap-6 bg-white p-8 text-ink sm:mx-10 md:absolute md:inset-x-auto md:left-1/2 md:top-1/2 md:mx-0 md:mt-0 md:w-[34rem] md:-translate-x-1/2 md:-translate-y-1/2 md:p-9"
          >
            <img src={iconMark} alt="" className="h-12 w-12" />
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink md:text-4xl">
              Professional Experience
            </h3>
            <div className="flex flex-col">
              {TIMELINE.map((item) => (
                <div
                  key={item.year}
                  className="flex gap-6 border-b border-ink/10 py-4 last:border-b-0"
                >
                  <span className="w-14 shrink-0 font-display text-2xl font-extrabold tracking-tight text-ink md:w-16 md:text-3xl">
                    {item.year}
                  </span>
                  <span className="font-display text-sm font-light normal-case leading-relaxed text-ink/70 md:text-base">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-14">
          {/* 547:765 — third headline, with annotation dots */}
          <KnowMoreHeadlineWithAnnotations />

          {/* 564:1271 (left) and 564:1272 (right) — sits before the
              "Exploring India" headline, exactly as ordered in Figma. */}
          <div className="mt-10 w-full">
            <Reveal
              as="p"
              className="max-w-xl font-display text-lg normal-case leading-relaxed text-[#fafafa]/80 sm:text-xl md:text-2xl"
            >
              I love traveling around India, exploring greenery and snow.
              But my wallet always seems to cry at the thought! It's like
              every time I plan a trip, one of my friends decides it's a
              great time to bail at the last minute. Perfect timing, right?
            </Reveal>
          </div>
          <div className="mt-10 w-full sm:mt-16 md:mt-20">
            <Reveal
              as="p"
              delay={120}
              className="ml-auto max-w-xl font-display text-lg normal-case leading-relaxed text-[#fafafa]/80 sm:text-xl md:text-2xl"
            >
              I've always loved how design affects the way people feel and
              interact. I work to create easy-to-use designs and visuals
              that people remember, making every experience enjoyable and
              valuable.
            </Reveal>
          </div>

          {/* 564:1274 — Exploring India headline */}
          <WordHeadline
            text="Exploring India"
            className="mt-32 text-5xl sm:mt-40 sm:text-8xl md:text-9xl lg:text-[9rem]"
          />

          {/* 564:1276 — second travel paragraph */}
          <Reveal
            as="p"
            className="mx-auto mt-10 max-w-3xl text-center font-display text-lg normal-case leading-relaxed text-[#fafafa]/80 md:text-2xl"
          >
            As I mentioned, I love traveling! So far, I've explored 10 states
            and over 30 cities across India, each place adding something
            unique to my journey.
          </Reveal>

          {/* 568:1345 — travel collage image */}
          <Reveal delay={200} className="mt-16 mb-24 w-full overflow-hidden sm:mt-20 sm:mb-32 md:mb-40">
            <img
              src={travelCollageImg}
              alt="Collage of travel photos across India"
              loading="lazy"
              className="h-[50vh] w-full object-cover md:h-[46rem]"
            />
          </Reveal>
        </div>
      </main>

      <Suspense fallback={null}>
        <Footer variant="about" />
        <MenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
        />
      </Suspense>
    </div>
  );
}

export default AboutPage;

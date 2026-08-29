import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { animate, AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import Header from "../components/Header";
import Reveal from "../components/Reveal";
import CanvasCursor from "../components/CanvasCursor";
import portraitImg from "../assets/about-page/portrait.webp";
import travelCollageImg from "../assets/about-page/travel-collage.webp";
import iconMark from "../assets/about-page/icon-mark.svg";
import tonyBlueImg from "../assets/about-page/tony-blue-strong-full.jpg";
import resumeBgImg from "../assets/about-page/Resume-background.png";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CursorImageTrail from "../components/CursorImageTrail";

gsap.registerPlugin(ScrollTrigger);


import { useSanityQuery } from "../sanity/useSanityQuery";
import { homepageContentQuery, aboutPageQuery } from "../sanity/queries";
import { urlFor } from "../sanity/client";
import { isPreviewMode } from "../sanity/preview";
import { previewClient } from "../sanity/previewClient";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

// Dozens of images plus its own drag/physics-feel interaction logic —
// code-split so its JS and image set only load once it's actually
// scrolled near, not bundled into the page's initial load.
const AntiGravityGallery = lazy(() => import("../components/AntiGravityGallery"));

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
    "Me at somewhere",
};

// Fallback for custom background feature to ensure text readability
function getReadableTextColor(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0d0c14" : "#ffffff";
}

const MARQUEE_REPEATS = Array.from({ length: 10 });

// "Exploring India" scatter-gallery layout — position, rotation (via
// tier), scale, and z-order for each of AntiGravityGallery's 29 fixed
// slots. This is presentation, not content: it stays in code exactly
// as it always has (per explicit scope), and Sanity only ever supplies
// the images that get mapped onto these slots by array order, cycling
// via `i % LAYOUT_SLOTS.length` if there are ever more than 29 photos.
// Values are unchanged from the previous per-field parallel arrays —
// just consolidated into one array-of-objects for a straightforward
// index -> slot mapping.
const EXPLORING_INDIA_LAYOUT_SLOTS = [
  { xPercent: 0, yPercent: 0, z: 0, depth: 0.1, tier: 0 },
  { xPercent: -20, yPercent: -24, z: -50, depth: 0.25, tier: 1 },
  { xPercent: 20, yPercent: -24, z: -50, depth: 0.25, tier: 1 },
  { xPercent: -20, yPercent: 24, z: -50, depth: 0.25, tier: 1 },
  { xPercent: 20, yPercent: 24, z: -50, depth: 0.25, tier: 1 },
  { xPercent: 0, yPercent: -36, z: -80, depth: 0.3, tier: 1 },
  { xPercent: 0, yPercent: 36, z: -80, depth: 0.3, tier: 1 },
  { xPercent: -12, yPercent: -12, z: -40, depth: 0.2, tier: 1 },
  { xPercent: 12, yPercent: 12, z: -40, depth: 0.2, tier: 1 },
  { xPercent: -34, yPercent: -12, z: -120, depth: 0.45, tier: 2 },
  { xPercent: 34, yPercent: -12, z: -120, depth: 0.45, tier: 2 },
  { xPercent: -34, yPercent: 20, z: -140, depth: 0.5, tier: 2 },
  { xPercent: 34, yPercent: 20, z: -140, depth: 0.5, tier: 2 },
  { xPercent: -18, yPercent: -42, z: -150, depth: 0.4, tier: 2 },
  { xPercent: 18, yPercent: -42, z: -150, depth: 0.4, tier: 2 },
  { xPercent: -28, yPercent: -32, z: -130, depth: 0.45, tier: 2 },
  { xPercent: 28, yPercent: 32, z: -130, depth: 0.45, tier: 2 },
  { xPercent: -38, yPercent: 4, z: -110, depth: 0.4, tier: 2 },
  { xPercent: 38, yPercent: -4, z: -110, depth: 0.4, tier: 2 },
  { xPercent: -44, yPercent: -36, z: -220, depth: 0.7, tier: 3 },
  { xPercent: 44, yPercent: -36, z: -220, depth: 0.7, tier: 3 },
  { xPercent: -44, yPercent: 36, z: -220, depth: 0.7, tier: 3 },
  { xPercent: 44, yPercent: 36, z: -220, depth: 0.7, tier: 3 },
  { xPercent: -46, yPercent: 2, z: -200, depth: 0.8, tier: 3 },
  { xPercent: 46, yPercent: 2, z: -200, depth: 0.8, tier: 3 },
  { xPercent: -48, yPercent: -18, z: -240, depth: 0.85, tier: 3 },
  { xPercent: 48, yPercent: 18, z: -240, depth: 0.85, tier: 3 },
  { xPercent: -10, yPercent: -48, z: -210, depth: 0.75, tier: 3 },
  { xPercent: 10, yPercent: 48, z: -210, depth: 0.75, tier: 3 },
];

// Everything below is sourced from the `aboutPage` Sanity singleton
// (aboutPageQuery). This object is what renders when that document (or
// an individual field on it) is empty/unset/still loading, so the page
// never shows blank gaps — it's the exact copy this page shipped with
// before the CMS wiring. The intro bio paragraph beside the portrait is
// the one exception: it still comes from the existing `homepageContent`
// document (FALLBACK_BODY above), shared with the homepage About ribbon.
const FALLBACK_ABOUT = {
  scrollingTicker: "Most of my ideas comes in the morning",
  heroHeadline: "SO WHO IS ACTUALLY BEHIND THIS",
  introParagraph:
    "I'm a product designer who builds the systems other people design inside of — governed, not improvised.",
  leftText: "Me at somewhere  ",
  rightText: "Giving a Unique pose @2022",
  philosophyLabel: "",
  philosophyText:
    "The best products don't just work well, they feel like someone cared enough to get the details right. That's what I aim for in every screen I design.",
  philosophyHeadline: "I design Applications and Websites that build credibility.",
  experienceHeading: "Professional Experience",
  experienceEntries: [
    { year: "2026", description: "Freelancing alongside Tekxera, including brand and content work for takara.ai" },
    { year: "2025", description: "Launched NudgeFile — first solo shipped product, design to code" },
    { year: "2024", description: "DLS reaches 20+ governed product features across the platform" },
    { year: "2021", description: "Started at Gemraj Technologies as a product designer" },
  ],
  knowMoreHeadline: "Know more about Myself Beyond as a designer",
  personalParagraphOne:
    "I love traveling around India, exploring greenery and snow. But my wallet always seems to cry at the thought! It's like every time I plan a trip, one of my friends decides it's a great time to bail at the last minute. Perfect timing, right?",
  personalParagraphTwo:
    "I've always loved how design affects the way people feel and interact. I work to create easy-to-use designs and visuals that people remember, making every experience enjoyable and valuable.",
  exploringIndiaHeadline: "Exploring India",
  exploringIndiaText:
    "As I mentioned, I love traveling! So far, I've explored 10 states and over 30 cities across India, each place adding something unique to my journey.",
};

// Placeholder tooltip copy for the "Know more..." annotation dots —
// `wordIndex`/`corner` stay code-only (per the schema field's own
// description); only `text` is ever overridden by CMS content, matched
// by array order.
const KNOW_MORE_ANNOTATIONS_FALLBACK = [
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
      className={`select-none flex flex-wrap justify-center gap-x-[0.28em] font-display font-extrabold uppercase leading-[0.95] tracking-tight text-[#0d0c14] dark:text-white ${className}`}
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
// guess.

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
            className={`absolute z-30 w-72 rounded-none bg-[#D9F51C] p-6 text-left font-sans text-base font-normal normal-case leading-snug text-black shadow-xl sm:w-80 sm:p-3 sm:text-lg md:w-90 ${align.v === "top" ? "bottom-full mb-2" : "top-full mt-2"
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

function KnowMoreHeadlineWithAnnotations({ headlineText, annotations }) {
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
    annotations.forEach((annotation) => {
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
  }, [annotations]);

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
        const firstId = annotations[0]?.id;
        if (!firstId) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        text={headlineText}
        className="mt-32 text-4xl sm:mt-40 sm:text-6xl md:text-8xl lg:text-[10rem]"
        wordRef={handleWordRef}
      />
      {annotations.map((annotation) => {
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

  // `?sanityPreview=1` is the flag the Studio's Presentation tool loads
  // this page with (see sanity.config.js's presentationTool location for
  // aboutPage). Every other visit renders exactly as before — same
  // client, same published-only data, same everything.
  const preview = isPreviewMode();
  const { data: about } = useSanityQuery(
    aboutPageQuery,
    {},
    null,
    preview && previewClient ? { client: previewClient } : undefined
  );
  // The visual-editing connector itself (enableVisualEditing) is now
  // mounted once at the app root (App.jsx), not per-page — see that
  // file for why. This page only owns the drafts-aware data client.

  // Per-field OR-fallback (not an object spread) so a field left empty
  // in the Studio falls back to FALLBACK_ABOUT's copy instead of
  // rendering blank — `{...FALLBACK, ...about}` would let a genuine
  // `null` from an unset Sanity field clobber the fallback string.
  const scrollingTicker = about?.scrollingTicker || FALLBACK_ABOUT.scrollingTicker;
  const heroHeadline = about?.heroHeadline || FALLBACK_ABOUT.heroHeadline;
  const introParagraph = about?.introParagraph || FALLBACK_ABOUT.introParagraph;
  const leftText = about?.leftText || FALLBACK_ABOUT.leftText;
  const rightText = about?.rightText || FALLBACK_ABOUT.rightText;
  const philosophyLabel = about?.philosophyLabel || FALLBACK_ABOUT.philosophyLabel;
  const philosophyText = about?.philosophyText || FALLBACK_ABOUT.philosophyText;
  const philosophyHeadline = about?.philosophyHeadline || FALLBACK_ABOUT.philosophyHeadline;
  const experienceHeading = about?.experienceHeading || FALLBACK_ABOUT.experienceHeading;
  const experienceEntries =
    about?.experienceEntries?.length > 0
      ? about.experienceEntries
      : FALLBACK_ABOUT.experienceEntries;
  const knowMoreHeadline = about?.knowMoreHeadline || FALLBACK_ABOUT.knowMoreHeadline;
  const personalParagraphOne = about?.personalParagraphOne || FALLBACK_ABOUT.personalParagraphOne;
  const personalParagraphTwo = about?.personalParagraphTwo || FALLBACK_ABOUT.personalParagraphTwo;
  const exploringIndiaHeadline = about?.exploringIndiaHeadline || FALLBACK_ABOUT.exploringIndiaHeadline;
  const exploringIndiaText = about?.exploringIndiaText || FALLBACK_ABOUT.exploringIndiaText;

  const customColorTheme = about?.customColorTheme;
  const isCustomLightActive = customColorTheme?.isEnabled && theme !== "dark" && customColorTheme?.customColor;
  const pageBackgroundColor = isCustomLightActive ? customColorTheme.customColor : undefined;
  const pageTextColor = pageBackgroundColor ? getReadableTextColor(pageBackgroundColor) || "#0d0c14" : undefined;

  const knowMoreAnnotations = KNOW_MORE_ANNOTATIONS_FALLBACK.map((fallback, i) => ({
    ...fallback,
    text: about?.annotationDots?.[i]?.tooltipText || fallback.text,
  }));

  const portraitImageUrl = urlFor(about?.portraitImage)?.width(1200).url();
  const portraitImageAlt = about?.portraitImageAlt || "Tony";

  const narrativeImageOneUrl = urlFor(about?.narrativeImageOne)?.width(2400).url();
  const narrativeImageOneAlt = about?.narrativeImageOneAlt || "Tony";

  const experienceBackgroundUrl = urlFor(about?.experienceBackgroundImage)?.width(2400).url();
  const experienceBackgroundAlt =
    about?.experienceBackgroundImageAlt || "Professional Experience background";

  // Sanity's `travelPhotoCollage` array is the single source of truth
  // for this gallery. When it's empty (nothing entered in the Studio
  // yet), fall back to the one shipped local photo — same "never show
  // a blank gap" convention as every other field's FALLBACK_ABOUT
  // value — rather than an empty section. Width + auto('format') let
  // Sanity's CDN pick the smallest correctly-formatted (WebP/AVIF)
  // response; hotspot is respected automatically by the builder since
  // no explicit crop/rect is passed.
  const travelPhotos = useMemo(() => {
    return about?.travelPhotoCollage?.length > 0
      ? about.travelPhotoCollage.map((item) => ({
        src: urlFor(item)?.width(1600).auto("format").url(),
        alt: item.alt || "Travel photo",
      }))
      : [{ src: travelCollageImg, alt: "Collage of travel photos across India" }];
  }, [about?.travelPhotoCollage]);

  // Array order -> layout slot order, cycling past 29 photos. Always a
  // real array (never `undefined`) so AntiGravityGallery never falls
  // back to its own internal placeholder set — 1 photo renders as just
  // that 1 card (the rest of the 29 slots simply don't render), and 0
  // photos (i.e. the local single-photo fallback above never applies,
  // which can't actually happen today, but is handled below anyway)
  // renders an empty-but-not-crashing gallery.
  const galleryCards = useMemo(() => {
    return travelPhotos.map((photo, i) => ({
      id: i + 1,
      src: photo.src,
      alt: photo.alt,
      ...EXPLORING_INDIA_LAYOUT_SLOTS[i % EXPLORING_INDIA_LAYOUT_SLOTS.length],
    }));
  }, [travelPhotos]);

  const closingHeadlineLines = [about?.closingHeadlineOne, about?.closingHeadlineTwo].filter(
    Boolean
  );
  const contactContent = {
    headlineLines: closingHeadlineLines.length > 0 ? closingHeadlineLines : undefined,
    eyebrow: about?.ctaEyebrow || undefined,
    email: about?.contactEmail || undefined,
    ctaLabel: about?.ctaButtonLabel || undefined,
    ctaHref: about?.ctaButtonLink || undefined,
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const mainRef = useRef(null);

  const zoomImageRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: zoomImageRef,
    offset: ["start end", "center center"]
  });
  const imageScale = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  const scale = shouldReduceMotion ? 1 : imageScale;

  const parallaxContainerRef = useRef(null);
  const { scrollYProgress: parallaxScrollProgress } = useScroll({
    target: parallaxContainerRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(parallaxScrollProgress, [0, 1], ["-12%", "12%"]);
  const yVal = shouldReduceMotion ? 0 : parallaxY;

  useEffect(() => {
    return () => {
      document.body.dataset.cursorTrailHover = "false";
    };
  }, []);

  useEffect(() => {
    if (about) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [about]);



  return (
    <div
      className={`site-shell relative min-h-[100dvh] font-display uppercase transition-colors duration-300 ${pageBackgroundColor ? "about-page-locked-colors" : "bg-[#fbfbf9] text-[#0d0c14] dark:bg-[#0c0a14] dark:text-white"}`}
      style={pageBackgroundColor ? { backgroundColor: pageBackgroundColor, color: pageTextColor } : undefined}
    >
      <CanvasCursor />
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main ref={mainRef}>
        {pageTextColor && (
          <style>{`
            .about-page-locked-colors,
            .about-page-locked-colors [class*="dark:text-white"] {
              color: ${pageTextColor} !important;
            }
          `}</style>
        )}
        {/* <CursorImageTrail
          onMouseEnter={() => {
            document.body.dataset.cursorTrailHover = "true";
          }}
          onMouseLeave={() => {
            document.body.dataset.cursorTrailHover = "false";
          }}
          style={{ width: "100%", height: "auto", overflow: "visible" }}
        > */}
        <WordHeadline
          text={heroHeadline}
          className="mt-6 px-6 text-5xl sm:mt-10 sm:text-7xl md:text-8xl lg:text-[16rem]"
          animated={false}
        />
        {/* </CursorImageTrail> */}

        {/* 547:763/764 — yellow ambient marquee band. Always dark text
            on the bright highlight, unchanged across both themes. */}
        <div className="relative z-10 mt-10 overflow-hidden bg-[#e3f900] py-4 text-[#161616] sm:mt-14 sm:py-6">
          <div className="flex whitespace-nowrap font-display text-xl font-semibold uppercase tracking-tight sm:text-3xl md:text-4xl">
            <div className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6">
              {MARQUEE_REPEATS.map((_, i) => (
                <span key={i}>{scrollingTicker} •</span>
              ))}
            </div>
            <div
              className="animate-marquee inline-flex shrink-0 items-center space-x-6 pr-6"
              aria-hidden="true"
            >
              {MARQUEE_REPEATS.map((_, i) => (
                <span key={i}>{scrollingTicker} •</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-8xl px-6 sm:px-10 md:px-14">
          {/* 547:717 — intro line */}
          <p className="mt-14 max-w-none font-display text-2xl font-light normal-case leading-[1.15] text-[#0d0c14] dark:text-white sm:mt-20 sm:text-4xl md:text-[5rem]"
          >
  {introParagraph}
</p>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-14">
          {/* 568:1348 portrait + 547:718 and 547:722 — two literal
              stacked instances of the same bio paragraph, as Figma has
              them, rather than one paragraph. The bio paragraph itself
              still comes from the existing homepageContent document
              (shared with the homepage About ribbon), per scope. */}
          <div className="mt-16 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-12 md:gap-12">
            <Reveal className="relative h-[40vh] w-full overflow-hidden md:col-span-4 md:h-[30rem] md:self-end">
              <img
                src={portraitImageUrl || portraitImg}
                alt={portraitImageAlt}
                loading="lazy"
                className="h-full w-full object-cover object-bottom"
              />
              {(about?.portraitCaption || about?.portraitSubCaption) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-4 py-3">
                  {about?.portraitCaption && (
                    <p className="font-display text-sm font-semibold normal-case text-white" 
                    >
  {about.portraitCaption}
</p>
                  )}
                  {about?.portraitSubCaption && (
                    <p className="font-display text-xs normal-case text-white/70">
  {about.portraitSubCaption}
</p>
                  )}
                </div>
              )}
            </Reveal>
            <div className="flex flex-col gap-8 self-center md:col-span-6 md:col-start-7">
              <p className="font-display text-lg normal-case leading-relaxed text-[#0d0c14]/80 dark:text-white/80 sm:text-xl md:text-2xl">
  {body.aboutBodyParagraph1}
</p>
              <p className="font-display text-lg normal-case leading-relaxed text-[#0d0c14]/80 dark:text-white/80 sm:text-xl md:text-2xl">
  {body.aboutBodyParagraph1}
</p>
            </div>
          </div>

        </div>

        {/* 564:1268 stock photo — full width, no placeholder backdrop */}
        <div ref={zoomImageRef} className="mx-auto w-full max-w-8xl px-4 sm:px-4 md:px-4 mt-16 sm:mt-20 overflow-hidden">
          <motion.div
            style={{ scale }}
            className="relative w-full overflow-hidden origin-center"
          >
            <img
              src={narrativeImageOneUrl || tonyBlueImg}
              alt={narrativeImageOneAlt}
              loading="lazy"
              onLoad={() => ScrollTrigger.refresh()}
              className="w-full h-auto"
            />
          </motion.div>
        </div>




        {/* 547:720 / 547:721 / 547:719 — the three-block repeated
            cluster, kept literal rather than collapsed. leftText/
            rightText from the Experience Narrative group; the center
            paragraph and the headline below it are Philosophy fields. */}
        <div className="mx-auto w-full max-w-8xl px-4 sm:px-4 md:px-4 mt-2">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
            <p className="font-display text-lg normal-case leading-relaxed text-[#0d0c14] dark:text-white sm:text-xl md:text-2xl text-left sm:max-w-[75%]"
            >
  {leftText}
</p>
            <p className="font-display text-lg normal-case leading-relaxed text-[#0d0c14] dark:text-white sm:text-xl md:text-2xl text-left sm:text-right sm:max-w-[75%] sm:ml-auto"
            >
  {rightText}
</p>
          </div>
        </div>


        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-14">
          <div className="mt-8 sm:mt-40">
            {philosophyLabel && (
              <p className="mx-auto max-w-3xl text-center font-display text-xs font-semibold uppercase tracking-[0.25em] text-[#0d0c14]/60 dark:text-white/60 sm:text-sm">
  {philosophyLabel}
</p>
            )}
            <p className="mx-auto max-w-3xl text-center font-display text-xl normal-case leading-relaxed text-[#0d0c14] dark:text-white sm:text-2xl md:text-3xl mt-12"
            >
  {philosophyText}
</p>
          </div>

          {/* 547:716 — second headline */}
          <WordHeadline
            text={philosophyHeadline}
            className="mt-32 text-4xl sm:mt-20 sm:text-6xl md:text-8xl lg:text-[10rem]"
          />
        </div>


        {/* 564:1269 second stock photo, full width, no placeholder
            backdrop — the 565:1320 "Professional Experience" white
            card sits dead-centered (both axes) over the photo on
            desktop, fully inside its bounds. */}
        {/* Mobile Viewport: Experience Card is inside the full-screen image cover */}
        <div className="relative mt-16 w-full h-[100dvh] block md:hidden">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={experienceBackgroundUrl || resumeBgImg}
              alt={experienceBackgroundAlt}
              loading="lazy"
              className="w-full h-full object-cover origin-center"
            />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2.5rem)] z-10">
            <Reveal
              delay={150}
              className="flex flex-col gap-8 bg-white p-5 text-ink xs:p-6 sm:p-8"
            >
              <div className="flex flex-col gap-6">
                <img src={iconMark} alt="" loading="lazy" className="h-8 w-8 xs:h-10 xs:w-10" />
                <h3 className="font-display text-lg xs:text-xl font-extrabold uppercase tracking-tight text-ink sm:text-2xl">
                  {experienceHeading}
                </h3>
              </div>
              <div className="flex flex-col">
                {experienceEntries.map((item) => (
                  <div
                    key={item.year}
                    className="flex gap-4 border-b border-ink/10 py-4 xs:py-5 last:border-b-0"
                  >
                    <span className="w-12 shrink-0 font-display text-lg xs:text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                      {item.year}
                    </span>
                    <span className="font-display text-xs font-light normal-case leading-relaxed text-ink/70 xs:text-sm">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* Desktop Viewport: Unchanged original layout */}
        <div className="relative mt-16 w-full sm:mt-20 hidden md:block">
          <Reveal delay={0}>
            <div ref={parallaxContainerRef} className="relative w-full overflow-hidden">
              <motion.img
                src={experienceBackgroundUrl || resumeBgImg}
                alt={experienceBackgroundAlt}
                loading="lazy"
                onLoad={() => ScrollTrigger.refresh()}
                style={{ y: yVal, scale: 1.15 }}
                className="w-full h-auto origin-center"
              />
            </div>
          </Reveal>

          <Reveal
            delay={150}
            className="relative mx-6 mt-6 flex flex-col gap-6 bg-white p-8 text-ink sm:mx-10 md:absolute md:inset-x-auto md:left-1/2 md:top-1/2 md:mx-0 md:mt-0 md:w-[34rem] md:-translate-x-1/2 md:-translate-y-1/2 md:p-9"
          >
            <img src={iconMark} alt="" loading="lazy" className="h-12 w-12" />
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink md:text-4xl">
              {experienceHeading}
            </h3>
            <div className="flex flex-col">
              {experienceEntries.map((item) => (
                <div
                  key={item.year}
                  className="flex gap-6 border-b border-ink/10 py-4 last:border-b-0"
                >
                  <span className="w-14 shrink-0 font-display text-2xl font-extrabold tracking-tight text-ink md:w-16 md:text-3xl">
                    {item.year}
                  </span>
                  <span className="font-display text-sm font-light normal-case leading-relaxed text-ink/70 md:text-base">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-14">
          {/* 547:765 — third headline, with annotation dots */}
          <KnowMoreHeadlineWithAnnotations
            headlineText={knowMoreHeadline}
            annotations={knowMoreAnnotations}
          />
        </div>

        {/* 564:1271 (left) and 564:1272 (right) — sits before the
            "Exploring India" headline, exactly as ordered in Figma. */}
        <div className="mx-auto w-full max-w-8xl px-4 sm:px-4 md:px-40">
          <div className="mt-10 w-full">
            <p className="max-w-xl font-display text-lg normal-case leading-relaxed text-[#0d0c14]/80 dark:text-white/80 sm:text-xl md:text-2xl">
  {personalParagraphOne}
</p>
          </div>
          <div className="mt-10 w-full sm:mt-16 md:mt-20">
            <p className="ml-auto max-w-2xl font-display text-lg normal-case leading-relaxed text-[#0d0c14]/80 dark:text-white/80 sm:text-xl md:text-2xl sm:ml-auto sm:text-right">
  {personalParagraphTwo}
</p>
          </div>
        </div>

        <div className="w-full mt-16 mb-24 sm:mt-20 sm:mb-32 md:mb-40">
          <Suspense fallback={null}>
            <AntiGravityGallery
              headline={exploringIndiaHeadline}
              cards={galleryCards}
            />
          </Suspense>
        </div>
      </main>

      <Suspense fallback={null}>
        <Footer variant="about" contactContent={contactContent} />
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

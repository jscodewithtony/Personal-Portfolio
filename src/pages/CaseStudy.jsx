import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PortableText } from "@portabletext/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "../components/Header";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { projectBySlugQuery } from "../sanity/queries";
import { imageUrl } from "../sanity/client";
import { useSeo } from "../hooks/useSeo";
import { isProjectUnlocked, unlockProject } from "../utils/unlockedProjects";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

gsap.registerPlugin(ScrollTrigger);

// Fallback for styleSettings.pageBackgroundColor + pageTextColor (Style
// tab): if a project sets a custom background but leaves the paired
// text color blank, pick a readable one from the background's own
// brightness rather than leaving text broken. The explicit
// pageTextColor field is always preferred when set — this only covers
// the gap.
function getReadableTextColor(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0d0c14" : "#ffffff";
}

// Comprehensive mock/fallback data for the Syncrio Hearing Aid layout
const FALLBACK_PROJECT = {
  title: "SYNCRIO HEARING AID",
  client: "Syncrio",
  eyebrow: "WORK",
  shortDescription: "NudgeFile renames and sorts your files with a local AI - but it asks first, and it always has an undo button, because trusting an AI with your file system sight-unseen is how horror movies start.",
  industry: "Accessibility Companion App",
  role: "UIUX Designer & Lead System Architect",
  timeline: "8 Weeks",
  category: "Mobile App",
  year: "2025",
  contextType: "Personal",
  contextIndustry: "Accessibility Companion App",
  contextTimeline: "8 Weeks",
  contextCategory: "Mobile App",
  contextYear: "2025",
  overviewText: "Many people with hearing loss struggle to feel confident in daily conversations and environments. Existing solutions often feel complicated, outdated, or impersonal. This project focuses on building a simple, inclusive app that works seamlessly with hearing aids, helping people with hearing loss to feel confident, supported, and connected in everyday life.",
  overviewMeta: [
    { label: "About Project", value: "Syncrio" },
    { label: "Industry", value: "Accessibility Companion App" },
    { label: "Timeline", value: "6 Weeks" },
    { label: "Category", value: "Mobile Application" }
  ],
  problemText: "People with hearing challenges want to engage confidently in their daily lives. Existing hearing aids are often complex, lack intelligence to adapt to new environments, and are difficult for non-tech-savvy users to control. This leads to frustration, anxiety about battery life, and social withdrawal (e.g., avoiding restaurants).",
  quotes: [
    "Can't quickly adjust the volume of my wearables (hearing aids)",
    "I can't reach the tiny buttons. Why can't I just say 'volume up'?",
    "Most of time my hearing aid disconnected from my phone every time I get a call",
    "Elderly users or non-tech-savvy individuals struggle with app settings.",
    "No clear indicators or alerts for battery charging",
    "What if my hearing aid battery dies while I'm out and can't recharge?",
    "I avoid restaurants because the background noise overwhelms me."
  ],
  tools: ["UI STRUCTURE", "WEBSITE DESIGN", "DESIGN SYSTEM"],
  problemImage: "https://picsum.photos/800/1000?random=44"
};

// Style Settings (project.js schema's `styleSettings`) — freely-entered
// px numbers and a hex color, validated at the schema level (0–200px /
// 0–300px ranges) so an editor can't accidentally enter something that
// breaks the layout, but otherwise fully open. Each set value becomes a
// real CSS custom property scoped to this page's own root container
// (see the `--cs-*` vars below), so one project's override can never
// leak into another page or any other part of the site. Left unset,
// a field contributes nothing here — sections keep their existing
// Tailwind classes untouched, so a project without styleSettings
// renders exactly as it always has.

// Per-block spacing override (bodyContent block types' `blockSpacing`
// field — see objects/blockSpacing.js). A block's own spacingTop/
// spacingBottom (px) wins outright when set; otherwise spacingTop
// falls back to the page-level Style tab's *Body Block Spacing*
// (inherited automatically via the `--cs-body-block-spacing` CSS var
// set on the page root, if that project set one — deliberately a
// separate control from Content Spacing, which governs section-to-
// section spacing, not block-to-block spacing inside the editor) and
// finally to `defaultTopRem` — this block type's own original default,
// so a block with no override at all renders exactly as it did before
// this field existed.
// spacingBottom has no page-level equivalent — before this field
// existed, inter-block spacing was achieved solely via the *next*
// block's top margin, so its unset default is genuinely "no override",
// not a var() fallback (that would double the gap between blocks).
function getBlockSpacingStyle(blockSpacing, defaultTopRem) {
  const spacingTop = blockSpacing?.spacingTop;
  const spacingBottom = blockSpacing?.spacingBottom;
  return {
    marginTop:
      typeof spacingTop === "number"
        ? `${spacingTop}px`
        : `var(--cs-body-block-spacing, ${defaultTopRem})`,
    ...(typeof spacingBottom === "number" ? { marginBottom: `${spacingBottom}px` } : {}),
  };
}

// Shared by `gallery` and `multiColumn`'s image columns — plain image +
// optional caption directly beneath it, no full-bleed/parallax
// treatment (that's `captionedImage`'s own, distinct look, left as-is).
function ImageWithCaption({ image, widthPx }) {
  const src = imageUrl(image, widthPx);
  if (!src) return null;
  return (
    <figure>
      <img src={src} alt={image.alt || ""} loading="lazy" className="w-full object-cover" />
      {image.caption && (
        <figcaption className="mt-2 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

// 2 columns: ratio-driven (editor's choice). 3/4 columns: always equal
// width, no ratio concept — 3 stays fully stacked until a real desktop
// width (no clean default for which column would be the tablet-width
// odd one out in a 2+1 split, and tablet-portrait widths don't have
// room for 3 comfortable columns anyway); 4 gets a 2x2 intermediate
// step at tablet/small-desktop before going fully 4-across only once
// each column has genuine room (1280px+).
const MULTI_COLUMN_RATIO_CLASSES = {
  "50-50": "grid-cols-1 md:grid-cols-2",
  "60-40": "grid-cols-1 md:grid-cols-[3fr_2fr]",
  "40-60": "grid-cols-1 md:grid-cols-[2fr_3fr]",
};
const MULTI_COLUMN_COUNT_CLASSES = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

// Preset tint + padding combos only (no free-text/raw hex) so every
// option is guaranteed to work in both themes.
//
// Fixed dark-mode contrast bug (confirmed twice): this block sits
// inside bodyContent's always-light `bg-[#fbfbf9]` container (never
// inverts — out of scope to change that here), so a translucent
// `dark:bg-white/5` / `dark:bg-[#114AFC]/10` overlay just tints an
// already-light backdrop lighter — it can never actually go dark. The
// nested text/caption components' existing `dark:text-white` was
// always correct; the background just never became dark enough for it
// to read against. Fix is solid, non-transparent dark colors instead
// of more transparency:
// - Muted dark: `#141418`, a direct reuse of the exact dark-card token
//   FeaturedProjects.jsx already uses for a card sitting on a light
//   page background (the same situation this block is in).
// - Accent dark: `#141c3a`, no existing "dark blue subtle surface"
//   token exists sitewide to copy (primary/#114AFC is otherwise only
//   ever a solid CTA fill, too saturated for body text to sit on) — so
//   this is a computed blend of that same `#141418` dark-card base
//   with ~15% of the site's own primary/#114AFC accent, keeping the
//   same color identity while staying genuinely dark enough for white
//   text on top.
// Light mode is unchanged (already correct, confirmed working).
// Padding matches the Professional Experience card's own mobile
// padding scale (AboutPage.jsx `p-5 xs:p-6 sm:p-8`) for consistency
// with an existing similarly-weighted content panel.
const MULTI_COLUMN_BACKGROUND_CLASSES = {
  none: "",
  muted: "bg-ink/5 dark:bg-[#141418] p-5 xs:p-6 sm:p-8",
  accent: "bg-primary/10 dark:bg-[#141c3a] p-5 xs:p-6 sm:p-8",
};

// One column slot: image or text, per its own `contentType`. Text
// reuses the exact same block-style renderers as the rest of the body
// (nested PortableText with the same components map) rather than a
// second copy of the normal/blockquote JSX.
function MultiColumnSlot({ column }) {
  if (!column) return null;
  if (column.contentType === "image" && column.image) {
    return <ImageWithCaption image={column.image} widthPx={1200} />;
  }
  if (column.contentType === "text" && column.text?.length > 0) {
    return <PortableText value={column.text} components={portableTextComponents} />;
  }
  return null;
}

const portableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-16 font-display text-3xl font-black uppercase leading-tight tracking-tight text-ink dark:text-white sm:text-4xl md:text-5xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-12 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink dark:text-white sm:text-3xl">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-8 font-display text-xl font-bold uppercase leading-tight tracking-tight text-ink dark:text-white sm:text-2xl">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mt-6 font-sans text-base normal-case leading-relaxed text-ink/80 dark:text-white/80 sm:text-lg">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-8 border-l-4 border-primary pl-6 font-display text-xl font-bold normal-case leading-snug text-ink dark:border-[#114AFC] dark:text-white sm:text-2xl">
        {children}
      </blockquote>
    ),
  },
  types: {
    captionedImage: ({ value }) => {
      const src = imageUrl(value, 2400);
      if (!src) return null;
      return (
        <figure
          style={getBlockSpacingStyle(value.blockSpacing, "3.5rem")}
          className="reveal-on-scroll relative left-1/2 w-screen -translate-x-1/2 overflow-hidden"
        >
          <div className="parallax-image-wrap overflow-hidden">
            {/* No forced height/object-cover — the image renders at its
                own natural aspect ratio, full width. Only crops if the
                editor explicitly sets a hotspot/crop in Sanity. */}
            <img
              src={src}
              alt={value.alt || ""}
              loading="lazy"
              className="parallax-image h-auto w-full"
            />
          </div>
          {value.caption && (
            <figcaption className="mx-auto mt-3 max-w-4xl px-6 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50 sm:px-10 md:px-14">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    videoEmbed: ({ value }) => {
      const fileUrl = value.file?.asset?.url;
      return (
        <figure
          style={getBlockSpacingStyle(value.blockSpacing, "2.5rem")}
          className="reveal-on-scroll"
        >
          {fileUrl ? (
            <video src={fileUrl} controls className="w-full" />
          ) : value.externalUrl ? (
            <div className="aspect-video w-full overflow-hidden">
              <iframe
                src={value.externalUrl}
                title={value.caption || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : null}
          {value.caption && (
            <figcaption className="mt-3 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    gallery: ({ value }) => (
      <div
        style={getBlockSpacingStyle(value.blockSpacing, "2.5rem")}
        className="reveal-on-scroll grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {(value.images || []).map((img, i) => (
          <ImageWithCaption key={img._key || i} image={img} widthPx={1000} />
        ))}
      </div>
    ),
    multiColumn: ({ value }) => {
      const columns = value.columns || [];
      const count = columns.length || 2;
      const gridClass =
        count === 2
          ? MULTI_COLUMN_RATIO_CLASSES[value.columnRatio] || MULTI_COLUMN_RATIO_CLASSES["50-50"]
          : MULTI_COLUMN_COUNT_CLASSES[count] || MULTI_COLUMN_COUNT_CLASSES[2];
      const bgClass = MULTI_COLUMN_BACKGROUND_CLASSES[value.backgroundStyle] || "";
      return (
        <div
          style={getBlockSpacingStyle(value.blockSpacing, "3.5rem")}
          className={`reveal-on-scroll grid gap-x-8 gap-y-8 ${gridClass} ${bgClass}`}
        >
          {columns.map((column, i) => (
            <MultiColumnSlot key={column._key || i} column={column} />
          ))}
        </div>
      );
    },
  },
};

// projectInfoFields entries carry their value in one of three
// fieldType-specific columns (see project.js schema) — this picks
// whichever one is actually populated for a given row.
function getProjectInfoValue(field) {
  if (field.fieldType === "select") return field.selectValue;
  if (field.fieldType === "number") return field.numberValue;
  return field.textValue;
}

function CaseStudyPasswordGate({ project, onUnlock }) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const expected = (project?.caseStudyPassword || "").trim();
    const entered = password.trim();

    if (expected && entered === expected) {
      setErrorMessage("");
      onUnlock();
    } else {
      setErrorMessage("Incorrect password. Please try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.select();
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1],
          x: { duration: 0.4, ease: "easeInOut" },
        }}
        className="relative w-full max-w-[496px] border border-ink/10 bg-[#fbfbf9] p-8 text-[#0d0c14] shadow-[0_24px_64px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-[#12111a] dark:text-white dark:shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)]"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex h-[34px] items-center gap-[6px] border border-[rgba(13,12,20,0.15)] px-3 py-1 dark:border-white/15">
            <span className="h-[6px] w-[6px] rounded-full bg-[#0d38bf] dark:bg-[#114AFC]" />
            <span className="font-display text-[10px] font-bold uppercase tracking-[2px] text-[rgba(13,12,20,0.8)] dark:text-white/80">
              Protected Case Study
            </span>
          </div>

          <Link
            to="/work"
            aria-label="Back to Work"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l10 10M13 3L3 13" />
            </svg>
          </Link>
        </div>

        <div className="mt-5 flex flex-col items-start w-full">
          <h1
            className="font-display text-[30px] font-bold uppercase leading-[36px] tracking-[-0.75px] text-[#0d0c14] dark:text-white"
          >
            {project?.title || "Case Study"}
          </h1>
          <p className="mt-2 font-display text-[14px] font-normal leading-[22.75px] normal-case text-[rgba(13,12,20,0.6)] dark:text-white/60">
            This case study is under a confidential NDA. Please enter the password provided to access the full work.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col w-full">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="ENTER PASSWORD…"
              className="h-[50px] w-full border border-[rgba(13,12,20,0.15)] bg-white/70 px-4 font-display text-[14px] uppercase tracking-[0.35px] text-ink placeholder:text-[rgba(13,12,20,0.4)] focus:border-[#0d38bf] focus:outline-none focus:ring-1 focus:ring-[#0d38bf]/20 dark:border-white/15 dark:bg-black/40 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#114AFC] dark:focus:ring-[#114AFC]/30"
            />
            {errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 font-display text-xs font-semibold normal-case text-red-500 dark:text-red-400"
              >
                {errorMessage}
              </motion.p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 items-center w-full">
            <button
              type="submit"
              className="flex h-[48px] w-full items-center justify-center bg-[#0d38bf] font-display text-[19px] font-bold uppercase tracking-[-0.6px] text-white shadow-[0px_10px_7.5px_rgba(13,56,191,0.25),0px_4px_3px_rgba(13,56,191,0.25)] transition-all hover:bg-[#0b2fa3] active:scale-[0.99] dark:bg-[#114AFC] dark:shadow-[0px_10px_15px_rgba(17,74,252,0.3)] dark:hover:bg-[#0d3ecf]"
            >
              Unlock Case Study
            </button>

            <Link
              to="/work"
              className="flex h-[40px] w-full items-center justify-center font-display text-[12px] font-bold uppercase tracking-[0.6px] text-[rgba(13,12,20,0.6)] transition-colors hover:text-[#0d0c14] dark:text-white/60 dark:hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function CaseStudy({ theme, onToggleTheme }) {
  const { slug } = useParams();
  const { data: project, status } = useSanityQuery(
    projectBySlugQuery,
    { slug },
    null
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const [unlockedNonce, setUnlockedNonce] = useState(0);
  const isUnlocked = isProjectUnlocked(slug) || unlockedNonce > 0;
  const isLocked = Boolean(project?.isPasswordProtected && !isUnlocked);

  // Each SEO field falls back to its Overview counterpart. Runs on
  // every render (hook rules), but the effect inside only fires when
  // a value actually changes — i.e. once the project loads. Image
  // chain ends on mainImage because existing projects predate
  // coverImage being required and some have none set.
  useSeo({
    title: project?.seoTitle || project?.title,
    description: project?.seoDescription || project?.shortDescription,
    image: imageUrl(project?.ogImage || project?.coverImage || project?.mainImage, 1200),
    path: `/projects/${slug}`,
    type: "article",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (status === "ready" && project) {
      const isExternal =
        project.projectType === "external" ||
        (!project.projectType && Boolean(project.externalLink));
      if (isExternal && project.externalLink) {
        window.location.replace(project.externalLink);
      }
    }
  }, [status, project]);

  const pageContainerRef = useRef(null);

  useEffect(() => {
    if (status !== "ready" || !project || isLocked) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      // Fade & slide up panels on scroll
      const panels = gsap.utils.toArray(".reveal-panel");
      panels.forEach((el) => {
        gsap.set(el, { y: 30, opacity: 0 });
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Subtle parallax effect on structural mockups or pedestal visual
      const parallaxElements = gsap.utils.toArray(".parallax-visual");
      parallaxElements.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 20 },
          {
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
      const settleTimer = setTimeout(() => ScrollTrigger.refresh(), 300);
      return () => clearTimeout(settleTimer);
    }, pageContainerRef);

    return () => ctx.revert();
  }, [status, project, isLocked]);

  // Merge Sanity query results with Syncrio defaults/fallback data
  const data = status === "ready" && project ? {
    title: project.title || FALLBACK_PROJECT.title,
    eyebrow: project.eyebrow || FALLBACK_PROJECT.eyebrow,
    coverImageUrl: imageUrl(project.coverImage, 2400),
    coverImageAlt: project.coverImage?.alt,
    shortDescription: project.shortDescription || FALLBACK_PROJECT.shortDescription,
    industry: project.industry || FALLBACK_PROJECT.industry,
    role: project.role || FALLBACK_PROJECT.role,
    // Right-rail sidebar: tags (schema's `tags`) and the flexible,
    // editor-defined info rows (schema's `projectInfoFields`) — both
    // fall back to the existing static content when a project hasn't
    // set them yet.
    tags: project.tags?.length ? project.tags : FALLBACK_PROJECT.tools,
    projectInfoRows: project.projectInfoFields?.length
      ? project.projectInfoFields.map((field) => ({
          label: field.label,
          value: getProjectInfoValue(field),
        }))
      : [
          { label: "Type", value: FALLBACK_PROJECT.contextType },
          { label: "Industry", value: FALLBACK_PROJECT.contextIndustry },
          { label: "Timeline", value: FALLBACK_PROJECT.contextTimeline },
          { label: "Category", value: FALLBACK_PROJECT.contextCategory },
          { label: "Year", value: FALLBACK_PROJECT.contextYear },
        ],
    nextProject: project.nextProject
  } : {
    ...FALLBACK_PROJECT,
    tags: FALLBACK_PROJECT.tools,
    projectInfoRows: [
      { label: "Type", value: FALLBACK_PROJECT.contextType },
      { label: "Industry", value: FALLBACK_PROJECT.contextIndustry },
      { label: "Timeline", value: FALLBACK_PROJECT.contextTimeline },
      { label: "Category", value: FALLBACK_PROJECT.contextCategory },
      { label: "Year", value: FALLBACK_PROJECT.contextYear },
    ],
  };

  // Style Settings: a number/hex value only when the editor actually
  // set it — `0` is a legitimate, intentional value (e.g. edge-to-edge
  // padding), so this checks for null/undefined specifically rather
  // than falsiness. pagePadding is now 4 independent sides (schema's
  // styleSettings.pagePadding.{paddingTop,Right,Bottom,Left}), each
  // wired to its own CSS var.
  const styleSettings = project?.styleSettings || {};
  const padding = styleSettings.pagePadding || {};
  const paddingTop = typeof padding.paddingTop === "number" ? `${padding.paddingTop}px` : undefined;
  const paddingRight = typeof padding.paddingRight === "number" ? `${padding.paddingRight}px` : undefined;
  const paddingBottom = typeof padding.paddingBottom === "number" ? `${padding.paddingBottom}px` : undefined;
  const paddingLeft = typeof padding.paddingLeft === "number" ? `${padding.paddingLeft}px` : undefined;
  const contentSpacingY =
    typeof styleSettings.contentSpacing === "number" ? `${styleSettings.contentSpacing}px` : undefined;
  // Dedicated default for spacing *between individual blocks* inside
  // the body content editor — deliberately separate from
  // contentSpacingY above (which is section-to-section spacing), so
  // the two can be tuned independently.
  const bodyBlockSpacingY =
    typeof styleSettings.bodyBlockSpacing === "number" ? `${styleSettings.bodyBlockSpacing}px` : undefined;
  const pageBackgroundColor = styleSettings.pageBackgroundColor || undefined;
  // Only meaningful once a custom background is actually set — this is
  // an intentional, fixed pair for THIS page, independent of the site's
  // light/dark toggle. Explicit pageTextColor wins; otherwise a
  // luminance-based readable color is picked automatically so the page
  // never renders with broken contrast just because the text color was
  // left blank.
  const pageTextColor = pageBackgroundColor
    ? styleSettings.pageTextColor || getReadableTextColor(pageBackgroundColor) || "#0d0c14"
    : undefined;

  const pageCssVars = {
    ...(paddingTop ? { "--cs-padding-top": paddingTop } : {}),
    ...(paddingRight ? { "--cs-padding-right": paddingRight } : {}),
    ...(paddingBottom ? { "--cs-padding-bottom": paddingBottom } : {}),
    ...(paddingLeft ? { "--cs-padding-left": paddingLeft } : {}),
    ...(contentSpacingY ? { "--cs-content-spacing": contentSpacingY } : {}),
    ...(bodyBlockSpacingY ? { "--cs-body-block-spacing": bodyBlockSpacingY } : {}),
    ...(pageBackgroundColor ? { "--cs-bg": pageBackgroundColor } : {}),
    ...(pageTextColor ? { "--cs-text": pageTextColor } : {}),
  };
  // All the CSS custom properties live on the page root (harmless to
  // declare — a custom property does nothing on its own until some
  // descendant actually references it via var()). Only `backgroundColor`
  // is *applied* here, though: `color` is applied on <main> instead (see
  // below), so the shared <Header>'s own theme-toggle-driven colors
  // (including the toggle button itself) are never affected by it.
  const pageRootStyle = Object.keys(pageCssVars).length
    ? { ...pageCssVars, ...(pageBackgroundColor ? { backgroundColor: "var(--cs-bg)" } : {}) }
    : undefined;

  // Page-edge top/bottom padding applies to <main> as a whole; left/
  // right applies per-section, since each section already has its own
  // horizontal container. Inline style always wins over a matching
  // Tailwind class regardless of specificity, so a section's existing
  // px-*/py-* classes stay applied untouched for any side left unset —
  // no conditional className removal needed.
  const mainStyle =
    paddingTop || paddingBottom
      ? {
          ...(paddingTop ? { paddingTop: "var(--cs-padding-top)" } : {}),
          ...(paddingBottom ? { paddingBottom: "var(--cs-padding-bottom)" } : {}),
        }
      : undefined;
  const horizontalPaddingStyle =
    paddingLeft || paddingRight
      ? {
          ...(paddingLeft ? { paddingLeft: "var(--cs-padding-left)" } : {}),
          ...(paddingRight ? { paddingRight: "var(--cs-padding-right)" } : {}),
        }
      : undefined;
  const spacingYStyle = contentSpacingY
    ? { paddingTop: "var(--cs-content-spacing)", paddingBottom: "var(--cs-content-spacing)" }
    : undefined;

  return (
    <div
      ref={pageContainerRef}
      style={pageRootStyle}
      className={`site-shell relative min-h-[100dvh] font-display uppercase transition-colors duration-300 ${
        pageBackgroundColor ? "" : "text-[#0d0c14] dark:text-white bg-[#fbfbf9] dark:bg-[#0c0a14]"
      }`}
    >
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {status === "loading" && (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-ink/50 dark:text-white/50">
            Loading case study…
          </p>
        </div>
      )}

      {status === "empty" && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="font-display text-2xl font-bold uppercase text-ink dark:text-white">
            Project not found
          </p>
          <Link
            to="/#featured-projects"
            className="font-display text-sm font-bold uppercase tracking-widest text-primary underline dark:text-[#114AFC]"
          >
            ← All Projects
          </Link>
        </div>
      )}

      {status === "ready" && data && (
        isLocked ? (
          <CaseStudyPasswordGate
            project={project}
            onUnlock={() => {
              unlockProject(slug);
              setUnlockedNonce((n) => n + 1);
            }}
          />
        ) : (
          <main
            style={{ ...mainStyle, ...(pageTextColor ? { color: "var(--cs-text)" } : {}) }}
            className={`w-full ${pageTextColor ? "case-study-locked-colors" : ""}`}
          >
          {/* Custom Style-tab background+text color is an intentional,
              fixed pair for this page's own content — the site's light/
              dark toggle stays visible/functional (it lives in <Header>,
              a sibling of <main>, so it's untouched by this), but must
              not flip this page's own text colors. The scattered
              dark:text-white* utilities throughout this file are exactly
              the theme-toggle-driven text colors that would otherwise
              silently keep responding to the toggle regardless of the
              inline `color` above (inline color doesn't cascade over an
              element's own more-specific class) — this scopes an
              override to just those classes, just within this page's
              content. */}
          {pageTextColor && (
            <style>{`
              .case-study-locked-colors [class*="dark:text-white"] {
                color: var(--cs-text) !important;
              }
            `}</style>
          )}
          {/* Hero Section */}
          <div className="w-full pt-10 pb-0 text-center">
            <div style={horizontalPaddingStyle} className="mx-auto w-full max-w-[85rem] px-4 sm:px-6 md:px-8">
              <span className="font-display text-xs font-bold tracking-widest text-[#0d0c14]/60 dark:text-white/60">
                {data.eyebrow}
              </span>
              <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-[1.05] tracking-tighter text-[#0d0c14] dark:text-white sm:text-7xl md:text-8xl lg:text-[8.5rem] max-w-5xl mx-auto">
                {data.title}
              </h1>
            </div>
          </div>

          {/* Cover Image (schema's coverImage) — full-bleed, edge to edge */}
          {data.coverImageUrl && (
            <div className="relative left-1/2 mt-12 w-screen -translate-x-1/2">
              <img
                src={data.coverImageUrl}
                alt={data.coverImageAlt || data.title}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Context Block */}
          <div
            style={spacingYStyle}
            className={`w-full bg-[#fcfcfb] ${contentSpacingY ? "" : "py-16 md:py-24"}`}
          >
            <div
              style={horizontalPaddingStyle}
              className="mx-auto w-full max-w-[85rem] px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16"
            >
              {/* Left Context Info */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <h2 className="font-display text-4xl font-extrabold tracking-tight uppercase mb-6 text-[#0d0c14]">
                    Context
                  </h2>
                  <p className="font-sans text-base md:text-lg normal-case leading-relaxed text-[#0d0c14]/80 max-w-2xl">
                    {data.shortDescription}
                  </p>
                </div>
                {/* tags */}
                <div className="flex flex-wrap gap-2.5 mt-8">
                  {data.tags.map((tag) => (
                    <span key={tag} className="border border-[#6ca57c]/60 rounded-full px-4 py-1 text-[10px] font-bold tracking-wider text-[#3b5d45] uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Metadata Rows */}
              <div className="md:col-span-5 flex flex-col pt-8 md:pt-0 md:pl-12">
                {data.projectInfoRows.map((item) => (
                  <div key={item.label} className="grid grid-cols-[140px_1fr] py-3.5 border-b border-neutral-200/60 items-center last:border-b-0">
                    <span className="font-display text-xs font-bold tracking-wide text-[#0d0c14]">
                      {item.label}
                    </span>
                    <span className="font-display text-xs md:text-sm normal-case tracking-wide text-neutral-500 font-medium">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Process / Approach (Sanity Portable Text support) */}
          {project.bodyContent?.length > 0 && (
            <div
              style={spacingYStyle}
              className={`w-full bg-[#fbfbf9] ${contentSpacingY ? "" : "py-16 md:py-24"}`}
            >
              <div
                style={horizontalPaddingStyle}
                className="mx-auto w-full max-w-4xl px-6 sm:px-10 md:px-14"
              >
                <div className="normal-case">
                  <PortableText
                    value={project.bodyContent}
                    components={portableTextComponents}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Next Case Study */}
          {data.nextProject && (() => {
            const nextIsExternal =
              data.nextProject.projectType === "external" ||
              (!data.nextProject.projectType && Boolean(data.nextProject.externalLink));
            const NextTag = nextIsExternal && data.nextProject.externalLink ? "a" : Link;
            const nextProps = nextIsExternal && data.nextProject.externalLink
              ? { href: data.nextProject.externalLink, target: "_blank", rel: "noopener noreferrer" }
              : { to: `/projects/${data.nextProject.slug}`, "data-transition-label": data.nextProject.title };

            return (
              <NextTag
                {...nextProps}
                className="group relative flex w-full items-center justify-center overflow-hidden border-t border-neutral-200"
              >
                {data.nextProject.mainImage && (
                  <img
                    src={imageUrl(data.nextProject.mainImage, 1200)}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-15 transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-20 text-center sm:py-28">
                  <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-[#0d0c14]/60 dark:text-white/60">
                    Next {nextIsExternal ? "Project" : "Case Study"}
                  </p>
                  <h3 className="font-display text-4xl font-black uppercase leading-[1.02] tracking-tight text-[#0d0c14] dark:text-white sm:text-6xl md:text-7xl">
                    {data.nextProject.title}
                  </h3>
                  <span className="mt-2 font-display text-sm font-bold uppercase tracking-widest text-[#114AFC] transition-transform group-hover:translate-x-1">
                    {nextIsExternal ? "View project ↗" : "View project →"}
                  </span>
                </div>
              </NextTag>
            );
          })()}
          </main>
        )
      )}

      <Suspense fallback={null}>
        <Footer />
        <MenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
        />
      </Suspense>
    </div>
  );
}

export default CaseStudy;

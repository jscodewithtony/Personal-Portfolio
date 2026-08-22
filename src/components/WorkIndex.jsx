import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { projectsQuery } from "../sanity/queries";
import { imageUrl } from "../sanity/client";

gsap.registerPlugin(ScrollTrigger);

// Figma: https://www.figma.com/design/I84MayZQYr2Bri3Se2lfRT/Personal-Portfolio?node-id=735-869
// Scroll-synced work index — pinned two-column preview list. Scroll
// progress (scrub, not snap) maps to an index in the project list; the
// item crossing the anchor line (~45vh, set via the list's padding-top
// below) is "active." Preview media + metadata cross-dissolve on index
// change; everything else transitions continuously off scroll progress
// so nothing ever hard-swaps.

// Each row's display value lives in whichever of textValue/selectValue/
// numberValue matches its own fieldType — this is the single place that
// picks the right one, mirroring getProjectInfoValue in CaseStudy.jsx.
function getInfoRowValue(field) {
  if (field.fieldType === "select") return field.selectValue;
  if (field.fieldType === "number") return field.numberValue;
  return field.textValue;
}

function mapProject(doc) {
  const infoRows = doc.projectInfoFields || [];
  return {
    id: doc._id,
    slug: doc.slug,
    title: doc.title,
    mediaUrl: imageUrl(doc.mainImage, 1600),
    overview: doc.shortDescription,
    infoRows: infoRows
      .map((field) => ({ label: field.label, value: getInfoRowValue(field) }))
      .filter((row) => row.value != null && row.value !== ""),
  };
}

function MediaLayer({ project, mediaRef }) {
  if (!project) return null;
  return (
    <div ref={mediaRef} className="absolute inset-0 opacity-0">
      <img
        src={project.mediaUrl}
        alt={project.title}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

// Renders whatever rows exist in projectInfoFields, in stored order —
// no row name is assumed. 0 rows renders nothing (no empty container,
// via the length check below); many rows scroll inside a capped height
// instead of growing the section (which is pinned at a fixed h-screen
// and must never change size while pinned). `compact` switches to the
// mobile frame's own type scale (Figma node 736:1009) rather than
// scaling the desktop numbers down by eye.
function MetaPanel({ project, metaRef, compact }) {
  if (!project) return null;
  const gridCols = compact ? "grid-cols-[170px_1fr]" : "grid-cols-[140px_1fr]";
  const rowGap = compact ? "gap-3" : "gap-6";
  const rowPad = compact ? "py-3" : "py-4";
  const labelSize = compact ? "text-[12px] leading-[21px]" : "text-lg";
  const valueSize = compact ? "text-[10px] leading-normal" : "text-lg leading-relaxed";
  return (
    <div ref={metaRef} className={`col-start-1 row-start-1 flex flex-col ${metaRef ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      {project.overview && (
        <div className={`grid ${gridCols} ${rowGap} border-b border-ink/10 ${rowPad} dark:border-white/10`}>
          <span className={`font-display ${labelSize} normal-case tracking-wide text-ink dark:text-white`}>Overview</span>
          <span className={`font-display ${valueSize} normal-case text-ink/50 dark:text-white/50`}>{project.overview}</span>
        </div>
      )}
      {project.infoRows.length > 0 && (
        <div className={compact ? "flex flex-col" : "flex max-h-[32vh] flex-col overflow-y-auto pr-2"}>
          {project.infoRows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className={`grid ${gridCols} ${rowGap} border-b border-ink/10 ${rowPad} dark:border-white/10`}
            >
              <span className={`font-display ${labelSize} normal-case tracking-wide text-ink dark:text-white`}>{row.label}</span>
              <span className={`font-display ${valueSize} normal-case text-ink/50 dark:text-white/50`}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {project.slug && (
        compact ? (
          <Link
            to={`/projects/${project.slug}`}
            data-transition-label={project.title}
            className={`mt-2 inline-block font-display text-[12px] normal-case tracking-wide text-primary transition-opacity hover:opacity-70`}
          >
            View Case study →
          </Link>
        ) : (
          <span
            className={`mt-2 inline-block font-display text-sm normal-case tracking-wide text-primary transition-opacity hover:opacity-70`}
          >
            View Case study →
          </span>
        )
      )}
    </div>
  );
}

// Below 1024px (Figma node 736:1009 — "iPhone 16 & 17 Pro Max - 3"): a
// single active project (title, media, metadata, CTA) with the rest of
// the project names listed below it. Tapping a name makes it active;
// the tapped-away-from project returns to the list at its original
// array position since `remaining` is re-derived from the untouched
// `projects` order every render, never reshuffled.
function MobileWork({ projects, activeIndex, onSelect }) {
  return (
    <div className="pb-16 pr-6 md:pr-12">
      <ul className="flex flex-col gap-6">
        {projects.map((project, i) => {
          const isActive = i === activeIndex;
          return (
            <li key={project.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => onSelect(i)}
                className="block w-full text-left font-display text-[46px] font-bold uppercase leading-[52.81px] tracking-[-0.271px] text-ink transition-opacity duration-300 focus:outline-none focus-visible:underline dark:text-white"
                style={{ opacity: isActive ? 1 : 0.3 }}
              >
                {project.title}
              </button>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex flex-col pb-4">
                      <div className="relative aspect-[4096/2381] w-full overflow-hidden bg-ink/5 dark:bg-white/5">
                        <img
                          src={project.mediaUrl}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="relative mt-3">
                        <MetaPanel project={project} metaRef={null} compact />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WorkIndex() {
  const { data: docs, status } = useSanityQuery(projectsQuery, {}, []);
  const projects = status === "ready" ? docs.map(mapProject) : [];

  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const rowRefs = useRef([]);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollTriggerRef = useRef(null);

  // Two alternating content slots for the preview media + metadata —
  // whichever isn't currently visible receives the next project's
  // content, then the two cross-dissolve and roles swap. Keeps both
  // layers in the DOM at all times so a dissolve never shows blank.
  const [slots, setSlots] = useState([null, null]);
  const visibleSlotRef = useRef(0);
  const mediaRefs = [useRef(null), useRef(null)];
  const metaRefs = [useRef(null), useRef(null)];
  const initializedRef = useRef(false);

  const reduceMotionRef = useRef(false);
  useLayoutEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Mouse & Custom Cursor Refs (no re-renders, 60fps persistent RAF)
  const followerRef = useRef(null);
  const mousePosRef = useRef({ x: -200, y: -200 });
  const posRef = useRef({ x: -200, y: -200 });
  const scaleRef = useRef(0);
  const activeHoverCardRef = useRef(false);

  useEffect(() => {
    // Only run on desktop/fine pointer devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animId;
    const tick = () => {
      posRef.current.x += (mousePosRef.current.x - posRef.current.x) * 0.2;
      posRef.current.y += (mousePosRef.current.y - posRef.current.y) * 0.2;

      const targetScale = activeHoverCardRef.current ? 1 : 0;
      scaleRef.current += (targetScale - scaleRef.current) * 0.22;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(${scaleRef.current})`;
        followerRef.current.style.opacity = scaleRef.current > 0.01 ? "1" : "0";
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      document.body.dataset.cursorProjectHover = "false";
      window.removeEventListener("mousemove", handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Seed slot 0 with the initially-active project once data arrives.
  useEffect(() => {
    if (!projects.length || initializedRef.current) return;
    initializedRef.current = true;
    setSlots([projects[0], null]);
  }, [projects]);

  // Cross-dissolve the two content slots whenever the active index
  // changes. Runs for both the scrub-driven desktop path and the
  // reduced-motion/keyboard-focus path, so behavior is identical.
  useEffect(() => {
    if (!projects.length || !initializedRef.current) return;
    const nextProject = projects[activeIndex];
    if (!nextProject) return;
    const visible = visibleSlotRef.current;
    const hidden = visible === 0 ? 1 : 0;
    if (slots[visible]?.id === nextProject.id) return;

    setSlots((prev) => {
      const copy = [...prev];
      copy[hidden] = nextProject;
      return copy;
    });

    const reduceMotion = reduceMotionRef.current;
    const duration = reduceMotion ? 0.01 : 0.3;

    // Wait a frame so the hidden slot's new content is in the DOM
    // before it fades in.
    requestAnimationFrame(() => {
      [
        [mediaRefs, visible, hidden],
        [metaRefs, visible, hidden],
      ].forEach(([refs, outIdx, inIdx]) => {
        const outEl = refs[outIdx].current;
        const inEl = refs[inIdx].current;
        if (outEl) gsap.to(outEl, { opacity: 0, pointerEvents: "none", duration, overwrite: true });
        if (inEl) gsap.to(inEl, { opacity: 1, pointerEvents: "auto", duration, overwrite: true });
      });
    });
    visibleSlotRef.current = hidden;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, projects]);

  // Preload the adjacent projects' media so the dissolve never shows a
  // blank/loading frame.
  useEffect(() => {
    if (!projects.length) return;
    [activeIndex - 1, activeIndex + 1].forEach((i) => {
      const p = projects[i];
      if (p?.mediaUrl) {
        const img = new Image();
        img.src = p.mediaUrl;
      }
    });
  }, [activeIndex, projects]);

  // Set the very first slot's layers visible once mounted.
  useLayoutEffect(() => {
    [mediaRefs[0], metaRefs[0]].forEach((ref) => {
      if (ref.current) gsap.set(ref.current, { opacity: 1, pointerEvents: "auto" });
    });
    [mediaRefs[1], metaRefs[1]].forEach((ref) => {
      if (ref.current) gsap.set(ref.current, { opacity: 0, pointerEvents: "none" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots[0]]);

  useEffect(() => {
    if (status !== "ready" || !projects.length) return;
    const section = sectionRef.current;
    const list = listRef.current;
    if (!section || !list) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const rows = rowRefs.current.filter(Boolean);
      let rowHeight = rows[0]?.getBoundingClientRect().height || 0;

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${(projects.length - 1) * window.innerHeight * 0.4 + window.innerHeight}`,
        pin: true,
        scrub: true,
        snap: {
          snapTo: projects.length > 1 ? 1 / (projects.length - 1) : 0,
          duration: { min: 0.25, max: 0.45 },
          delay: 0.05,
          ease: "power2.inOut",
        },
        anticipatePin: 1,
        onRefresh: () => {
          rowHeight = rows[0]?.getBoundingClientRect().height || rowHeight;
        },
        onUpdate: (self) => {
          const raw = gsap.utils.clamp(0, projects.length - 1, self.progress * (projects.length - 1));
          gsap.set(list, { y: -raw * rowHeight, force3D: true });

          rows.forEach((row, i) => {
            const dist = Math.abs(i - raw);
            const t = gsap.utils.clamp(0, 1, 1 - dist);
            gsap.set(row, { opacity: gsap.utils.interpolate(0.3, 1, t) });
          });

          const idx = Math.round(raw);
          if (idx !== activeIndexRef.current) {
            activeIndexRef.current = idx;
            setActiveIndex(idx);
          }
        },
      });
      scrollTriggerRef.current = st;

      return () => {
        st.kill();
        scrollTriggerRef.current = null;
      };
    });

    return () => mm.revert();
  }, [status, projects.length]);

  const handleRowFocus = (index) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  const handleRowClick = (index) => {
    const st = scrollTriggerRef.current;
    if (st && projects.length) {
      const progress = projects.length > 1 ? index / (projects.length - 1) : 0;
      const scrollPos = st.start + progress * (st.end - st.start);
      window.scrollTo({ top: scrollPos, behavior: "smooth" });
    }
  };

  const handleSelect = (index) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  if (status === "loading" || status === "empty") return null;

  return (
    <>
      {/* SCOPED CUSTOM CIRCULAR CURSOR FOLLOWER */}
      <div
        ref={followerRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-50 flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-primary text-white shadow-2xl shadow-primary/40 opacity-0 will-change-transform dark:bg-[#114AFC] dark:shadow-[#114AFC]/40"
        style={{ transform: "translate3d(-200px, -200px, 0) translate(-50%, -50%) scale(0)" }}
      >
        <div className="select-none font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-center leading-[1.15] text-white drop-shadow-sm">
          VIEW
          <br />
          PROJECT
        </div>
      </div>

      {/* Figma: node 735:869 (desktop) / 736:1009 (mobile) — "Every move
          so far" headline sits above the list on both breakpoints, per
          the mobile frame — kept visible at every width. Sized off the
          same scale CaseStudy.jsx already uses for its own giant
          display title, rather than the raw 224px/56.8px Figma values
          (each tuned for one fixed frame width). */}
      <section className="bg-bg pl-6 pt-20 pb-12 sm:pb-16 text-ink transition-colors duration-300 md:pl-12 lg:pl-16 dark:bg-[#0c0a14] dark:text-white">
        <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tighter sm:text-7xl md:text-8xl lg:text-[8.5rem]">
          Every move
          <br />
          so far
        </h2>
      </section>
      <section
        ref={sectionRef}
        id="work-index"
        className="relative w-full overflow-hidden bg-bg pl-6 text-ink transition-colors duration-300 md:pl-12 lg:pl-16 dark:bg-[#0c0a14] dark:text-white"
      >
        {/* Desktop/tablet — pinned, scrub-synced two-column layout. */}
        <div className="hidden h-screen w-full lg:grid lg:grid-cols-2 lg:gap-x-24">
          <Link
            to={projects[activeIndex]?.slug ? `/projects/${projects[activeIndex].slug}` : "#"}
            data-transition-label={projects[activeIndex]?.title}
            onMouseEnter={() => {
              activeHoverCardRef.current = true;
              document.body.dataset.cursorProjectHover = "true";
            }}
            onMouseLeave={() => {
              activeHoverCardRef.current = false;
              document.body.dataset.cursorProjectHover = "false";
            }}
            className="relative flex flex-col justify-center group cursor-pointer lg:cursor-none text-ink dark:text-white hover:no-underline"
          >
            <div className="relative aspect-[4096/2381] w-full overflow-hidden bg-ink/5 dark:bg-white/5">
              <MediaLayer project={slots[0]} mediaRef={mediaRefs[0]} />
              <MediaLayer project={slots[1]} mediaRef={mediaRefs[1]} />
            </div>
            <div className="relative mt-6 grid">
              <MetaPanel project={slots[0]} metaRef={metaRefs[0]} />
              <MetaPanel project={slots[1]} metaRef={metaRefs[1]} />
            </div>
          </Link>

          <div className="relative overflow-hidden">
            <ul
              ref={listRef}
              className="flex flex-col gap-4"
              style={{ paddingTop: "calc(45vh - 1rem)" }}
            >
              {projects.map((project, i) => (
                <li key={project.id}>
                  <div
                    ref={(el) => (rowRefs.current[i] = el)}
                    className="block text-left font-display text-5xl font-bold uppercase leading-tight tracking-tight text-ink xl:text-6xl dark:text-white"
                    style={{ opacity: activeIndex === i ? 1 : 0.3 }}
                  >
                    {project.title}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Below 1024px (Figma node 736:1009) — no pin, no scrub, no
          odometer: a single active project up top, the rest listed
          below at the dim/inactive token. Tapping a name calls the
          same handleSelect the desktop path's onFocus uses, so both
          breakpoints drive the identical activeIndex/slots state. */}
        <div className="lg:hidden">
          <MobileWork
            projects={projects}
            activeIndex={activeIndex}
            onSelect={handleSelect}
          />
        </div>
      </section>
    </>
  );
}

export default WorkIndex;

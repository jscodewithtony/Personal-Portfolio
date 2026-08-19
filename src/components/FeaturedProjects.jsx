import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import projectTekxera from "../assets/project-tekxera.webp";
import projectJewelry from "../assets/project-jewelry.webp";
import projectStrategy from "../assets/project-strategy.webp";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { projectsQuery } from "../sanity/queries";
import { urlFor, imageUrl } from "../sanity/client";

gsap.registerPlugin(ScrollTrigger);

// Original hardcoded projects, reused as the loading/empty fallback.
// The pinned scroll animation below is hand-tuned for exactly 3 cards
// (fixed per-index offsets/rotations), so the CMS-backed list is
// clamped to its first 3 entries (by displayOrder) to keep that
// animation contract intact rather than changing the motion.
const FALLBACK_PROJECTS = [
  {
    id: "01",
    client: "Tekxera",
    title: "Tekxera\nTechnology",
    description:
      "NudgeFile renames and sorts your files with a local AI — but it asks first, and it always has an undo button, because trusting an AI with your file system sight-unseen is how horror movies start.",
    industry: "TECHNOLOGY | IT SUPPORT",
    role: "UIUX DESIGNER | DESIGN SYSTEM",
    image: projectTekxera,
    thumbnailImage: projectJewelry,
    slug: null,
  },
  {
    id: "02",
    client: "Aurelle",
    title: "Aurelle Fine\nJewelry",
    description:
      "An immersive luxury e-commerce experience crafted for high-end bespoke jewelry, featuring fluid micro-interactions, spatial product showcases, and bespoke design systems.",
    industry: "E-COMMERCE | LUXURY RETAIL",
    role: "LEAD DESIGNER | FRONTEND ARCHITECT",
    image: projectJewelry,
    thumbnailImage: projectStrategy,
    slug: null,
  },
  {
    id: "03",
    client: "Meridian",
    title: "Meridian\nTelemetry",
    description:
      "Real-time financial risk assessment and decision-making platform for enterprise finance teams. Consolidates multi-market telemetry streams into intuitive interactive dashboards.",
    industry: "FINTECH | RISK ANALYTICS",
    role: "PRODUCT DESIGNER | GSAP DEVELOPER",
    image: projectStrategy,
    thumbnailImage: projectTekxera,
    slug: null,
  },
];

function mapSanityProject(doc) {
  const mainImageUrl = urlFor(doc.mainImage)?.width(1200).url();
  const thumbUrl = imageUrl(doc.thumbnail, 400);
  return {
    id: doc._id,
    // The schema no longer has a separate "client" field — this small
    // eyebrow slot (and the alt text / transition label that reuse it)
    // now shows industry instead, same position, same markup.
    client: doc.industry,
    title: doc.title,
    description: doc.shortDescription,
    industry: doc.industry,
    role: doc.role,
    image: mainImageUrl || projectTekxera,
    thumbnailImage: thumbUrl || projectJewelry,
    slug: doc.slug,
  };
}

const BG_ROWS = Array.from(
  { length: 94 },
  () => "FEATURED PROJECTS FEATURED PROJECTS FEATURED PROJECTS"
);

function FeaturedProjects() {
  const { data: docs, status } = useSanityQuery(projectsQuery, {}, []);
  const projects =
    status === "ready" && docs?.length
      ? docs.slice(0, 3).map(mapSanityProject)
      : FALLBACK_PROJECTS;

  const sectionRef = useRef(null);
  const bgWallRef = useRef(null);
  const bgRowsRef = useRef([]);
  const cardRefs = useRef([]);

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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      const pinDistance = window.innerHeight * 3.4;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${pinDistance}`,
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
        },
      });

      bgRowsRef.current.forEach((row) => {
        if (!row) return;
        gsap.set(row, { opacity: 1, y: 0, scale: 1, force3D: true });
      });

      // Position text wall initially shifted UP (-1800px) so it can travel DOWN as user scrolls DOWN
      gsap.set(bgWallRef.current, { y: -1800, force3D: true });

      // Clean card initial offsets
      if (cardRefs.current[0]) {
        gsap.set(cardRefs.current[0], { opacity: 1, y: 650, rotate: 0, force3D: true });
      }
      if (cardRefs.current[1]) {
        gsap.set(cardRefs.current[1], { opacity: 1, y: 950, rotate: 0, force3D: true });
      }
      if (cardRefs.current[2]) {
        gsap.set(cardRefs.current[2], { opacity: 1, y: 1250, rotate: 0, force3D: true });
      }

      tl.to(
        bgWallRef.current,
        {
          y: 600,
          duration: 1.0,
          ease: "none",
          force3D: true,
        },
        0.0
      );

      // --- Card 1 ---
      if (cardRefs.current[0]) {
        tl.to(
          cardRefs.current[0],
          { y: 0, rotate: 0.8, duration: 0.22, ease: "sine.inOut", force3D: true },
          0.05
        );
        tl.to(
          cardRefs.current[0],
          { y: -850, rotate: -10, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.36
        );
      }

      // --- Card 2 ---
      if (cardRefs.current[1]) {
        tl.to(
          cardRefs.current[1],
          { y: 0, rotate: 8.6, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.36
        );
        tl.to(
          cardRefs.current[1],
          { y: -850, rotate: 14, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.64
        );
      }

      // --- Card 3 ---
      if (cardRefs.current[2]) {
        tl.to(
          cardRefs.current[2],
          { y: 0, rotate: -7.8, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.64
        );
        tl.to(
          cardRefs.current[2],
          { y: -850, rotate: -10, duration: 0.20, ease: "sine.inOut", force3D: true },
          0.90
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="featured-projects"
      onMouseLeave={() => {
        activeHoverCardRef.current = false;
        document.body.dataset.cursorProjectHover = "false";
      }}
      className="relative z-10 h-screen w-full overflow-hidden bg-bg text-ink transition-colors duration-300 select-none dark:bg-[#0c0a14] dark:text-white"
    >
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

      {/* REVERSE PARALLAX BACKGROUND TEXT WALL */}
      <div
        ref={bgWallRef}
        className="pointer-events-none absolute -top-[2400px] -bottom-[2400px] inset-x-0 flex flex-col justify-start items-center overflow-hidden z-0 py-2"
      >
        <div className="w-full space-y-2 sm:space-y-4 text-center">
          {BG_ROWS.map((rowText, idx) => (
            <div
              key={idx}
              ref={(el) => (bgRowsRef.current[idx] = el)}
              className="font-display font-black text-[9.5vw] leading-[0.88] uppercase tracking-normal text-ink/5 dark:text-white/5 whitespace-nowrap will-change-transform"
            >
              {rowText}
            </div>
          ))}
        </div>
      </div>

      {/* INDIVIDUAL CLEAN CARD STAGE */}
      <div className="relative z-10 flex h-full w-full items-center justify-center py-4 px-0 sm:p-6 lg:p-10 pointer-events-none">
        {projects.map((project, index) => {
          const CardTag = project.slug ? Link : "div";
          const cardTagProps = project.slug ? { to: `/projects/${project.slug}` } : {};
          return (
            <div
              key={index}
              ref={(el) => (cardRefs.current[index] = el)}
              className="absolute inset-0 flex items-center justify-center py-4 px-0 sm:p-6 lg:p-10 pointer-events-auto will-change-transform"
            >
              <CardTag
                {...cardTagProps}
                data-transition-label={project.client}
                onMouseEnter={() => {
                  activeHoverCardRef.current = true;
                  document.body.dataset.cursorProjectHover = "true";
                }}
                onMouseLeave={() => {
                  activeHoverCardRef.current = false;
                  document.body.dataset.cursorProjectHover = "false";
                }}
                className="relative w-full max-w-5xl lg:max-w-6xl overflow-hidden rounded-none border-none bg-white shadow-2xl transition-colors duration-300 dark:bg-[#141418] group cursor-pointer md:cursor-none"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px] sm:min-h-[600px] lg:min-h-[640px]">

                  {/* Left Column: Full-Height Portrait Image */}
                  <div className="md:col-span-5 relative overflow-hidden h-72 sm:h-96 md:h-full w-full">
                    <img
                      src={project.image}
                      alt={project.client}
                      loading="lazy"
                      className="h-full w-full object-cover rounded-none transition-transform duration-700 hover:scale-105"
                    />
                  </div>

                  {/* Right Column */}
                  <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-white relative rounded-none transition-colors duration-300 dark:bg-[#141418]">

                    <div className="space-y-4 max-w-xl">
                      <div className="text-sm font-normal tracking-normal text-ink/80 dark:text-white/80">
                        {project.client}
                      </div>

                      <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink dark:text-white leading-[1.08] font-display tracking-tight whitespace-pre-line">
                        {project.title}
                      </h3>

                      <p className="line-clamp-3 text-xs sm:line-clamp-none sm:text-sm lg:text-base text-ink/70 dark:text-white/70 leading-relaxed font-sans normal-case pt-2">
                        {project.description}
                      </p>
                    </div>

                    <div className="mt-8 flex flex-row items-end justify-between gap-4 relative">
                      <div className="space-y-4 shrink-0">
                        <div>
                          <div className="text-sm lg:text-base font-normal text-ink dark:text-white">Industry</div>
                          <div className="text-xs font-normal tracking-wider text-ink/50 dark:text-white/50 uppercase mt-0.5">
                            {project.industry}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm lg:text-base font-normal text-ink dark:text-white">Role</div>
                          <div className="text-xs font-normal tracking-wider text-ink/50 dark:text-white/50 uppercase mt-0.5">
                            {project.role}
                          </div>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-none border border-ink/10 dark:border-white/10 bg-bg dark:bg-black/60 shadow-2xl w-48 sm:w-60 lg:w-72 aspect-[16/10] shrink-0 self-end">
                        <img
                          src={project.thumbnailImage}
                          alt={`${project.client} preview`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 rounded-none"
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </CardTag>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FeaturedProjects;

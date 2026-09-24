import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { projectsQuery } from "../sanity/queries";
import { imageUrl } from "../sanity/client";
import ArchiveSection from "./ArchiveSection";
import DirectionHover from "./DirectionHover";
import PasswordModal from "./PasswordModal";
import { isProjectUnlocked } from "../utils/unlockedProjects";

// Figma: https://www.figma.com/design/I84MayZQYr2Bri3Se2lfRT/Personal-Portfolio?node-id=1003-552
// Alternate /work template — additive, does not touch WorkIndex.jsx.
// Selected by siteSettings.workPageTemplate === "gallery" (Phase 4).
//
// Two sections: a 3-column masonry project grid (Selected Work), and a
// row-per-category Archive listing (archiveCategory documents, global
// and project-independent — confirmed against the Figma directly,
// which shows one shared date range per category row, not per
// project). Header/contact-form/footer/piano are already handled by
// WorkPage.jsx and are unchanged here.

// Same helper as WorkIndex.jsx — project titles carry literal "\n"
// line breaks from the CMS for display elsewhere; normalized to a
// single readable line here too.
function toTitleCase(str) {
  if (!str) return "";
  const normalized = str.replace(/\n/g, " ");
  return normalized
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// The Figma shows 3 differently-sized columns (large/medium/small)
// repeating as a masonry row. Cycled by index so it scales to however
// many real projects exist, rather than the mockup's fixed 6 slots.
const GRID_COLUMN_SIZE = ["lg", "md", "sm"];

const CARD_SIZE_CLASSES = {
  lg: {
    wrap: "lg:col-span-5",
    title: "text-2xl sm:text-3xl lg:text-[32px]",
    link: "text-base sm:text-lg",
    tag: "text-xs sm:text-sm",
  },
  md: {
    wrap: "lg:col-span-4",
    title: "text-xl sm:text-2xl lg:text-[25px]",
    link: "text-sm sm:text-base",
    tag: "text-xs sm:text-sm",
  },
  sm: {
    wrap: "lg:col-span-3",
    title: "text-lg sm:text-xl lg:text-[21px]",
    link: "text-sm",
    tag: "text-[11px] sm:text-xs",
  },
};

// Text-type projectInfoFields rows only (e.g. Type/Industry/Timeline/
// Category). If any row has `showOnGalleryCard === true`, only the
// selected rows are shown; otherwise falls back to showing all text
// rows so projects without explicit selection don't break. Select/Number
// rows are intentionally excluded. Empty when a project has no text rows
// (e.g. Aurelle, Meridian), rendering nothing in that slot.
function getGalleryInfoValues(doc) {
  const fields = doc.projectInfoFields || [];
  const textRows = fields.filter((f) => f.fieldType === "text" && f.textValue?.trim());
  if (textRows.length === 0) return [];

  const selectedRows = textRows.filter((f) => f.showOnGalleryCard === true);
  const activeRows = selectedRows.length > 0 ? selectedRows : textRows;

  return activeRows.map((f) => f.textValue.trim());
}

function mapProject(doc) {
  const isExternal =
    doc.projectType === "external" ||
    (!doc.projectType && Boolean(doc.externalLink));
  return {
    id: doc._id,
    slug: doc.slug,
    title: toTitleCase(doc.title),
    mediaUrl: imageUrl(doc.mainImage, 1600),
    mediaAlt: doc.mainImage?.alt,
    infoValues: getGalleryInfoValues(doc),
    caseStudyLinkLabel: doc.caseStudyLinkLabel || (isExternal ? "View Project" : "View Case Study"),
    isPasswordProtected: !isExternal && doc.isPasswordProtected === true,
    caseStudyPassword: doc.caseStudyPassword || "",
    projectType: doc.projectType,
    externalLink: isExternal ? doc.externalLink : null,
  };
}

function GalleryProjectCard({ project, size, onHoverStart, onHoverEnd, onProjectClick }) {
  const navigate = useNavigate();
  const linkRef = useRef(null);
  const cls = CARD_SIZE_CLASSES[size];
  const isLocked = Boolean(project.isPasswordProtected && !isProjectUnlocked(project.slug));

  const handleCardClick = (e) => {
    if (e.target.closest("a")) return;
    if (project.externalLink) {
      window.open(project.externalLink, "_blank", "noopener,noreferrer");
      return;
    }
    if (project.slug) {
      if (onProjectClick && onProjectClick(e, project)) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (linkRef.current) {
        linkRef.current.click();
      } else {
        navigate(`/projects/${project.slug}`);
      }
    }
  };

  const handleLinkClick = (e) => {
    if (onProjectClick && onProjectClick(e, project)) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={`group flex flex-col gap-2 ${cls.wrap} cursor-pointer md:cursor-none`}
    >
      <div className="aspect-[669/539] w-full overflow-hidden bg-ink/5 dark:bg-white/5">
        {project.mediaUrl && (
          <img
            src={project.mediaUrl}
            alt={project.mediaAlt || project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <p className={`font-display font-bold normal-case tracking-tight text-ink dark:text-white ${cls.title}`}>
            {project.title}
          </p>
          {project.externalLink ? (
            <a
              ref={linkRef}
              href={project.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`shrink-0 whitespace-nowrap border-b border-primary font-display normal-case tracking-tight text-primary dark:border-white dark:text-white ${cls.link}`}
            >
              <DirectionHover>{project.caseStudyLinkLabel}</DirectionHover> ↗
            </a>
          ) : project.slug ? (
            <Link
              ref={linkRef}
              to={`/projects/${project.slug}`}
              onClick={handleLinkClick}
              onMouseDown={(e) => {
                if (isLocked) {
                  e.preventDefault();
                }
              }}
              data-no-transition={isLocked ? "true" : undefined}
              data-transition-label={project.title}
              className={`shrink-0 whitespace-nowrap border-b border-primary font-display normal-case tracking-tight text-primary dark:border-white dark:text-white ${cls.link}`}
            >
              <DirectionHover>{project.caseStudyLinkLabel}</DirectionHover> →
            </Link>
          ) : null}
        </div>
        {project.infoValues.length > 0 && (
          <div className="flex flex-col gap-y-1">
            {project.infoValues.map((val, idx) => (
              <span
                key={idx}
                className={`font-display normal-case text-ink/60 dark:text-white/60 ${cls.tag}`}
              >
                {val}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkGallery() {
  const { data: projectDocs, status: projectsStatus } = useSanityQuery(projectsQuery, {}, []);
  const projects = projectsStatus === "ready" ? projectDocs.map(mapProject) : [];

  const sectionRef = useRef(null);
  const followerRef = useRef(null);
  const mousePosRef = useRef({ x: -200, y: -200 });
  const posRef = useRef({ x: -200, y: -200 });
  const scaleRef = useRef(0);
  const activeHoverCardRef = useRef(false);

  useEffect(() => {
    // Only run on desktop/fine pointer devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animId;
    let isVisible = true;

    const tick = () => {
      posRef.current.x += (mousePosRef.current.x - posRef.current.x) * 0.2;
      posRef.current.y += (mousePosRef.current.y - posRef.current.y) * 0.2;

      const targetScale = isVisible && activeHoverCardRef.current ? 1 : 0;
      scaleRef.current += (targetScale - scaleRef.current) * 0.22;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(${scaleRef.current})`;
        followerRef.current.style.opacity = scaleRef.current > 0.01 ? "1" : "0";
      }

      // Keep ticking until scaled down completely to 0 even if isVisible became false
      if (!isVisible && scaleRef.current <= 0.01) {
        animId = null;
        return;
      }

      animId = requestAnimationFrame(tick);
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            if (!animId) {
              tick();
            }
          } else {
            activeHoverCardRef.current = false;
            document.body.dataset.cursorProjectHover = "false";
            // Ensure tick runs to finish scale-down or reset immediately
            if (!animId) {
              tick();
            }
          }
        });
      },
      { threshold: 0.01 }
    );
    sectionObserver.observe(section);

    animId = requestAnimationFrame(tick);

    return () => {
      document.body.dataset.cursorProjectHover = "false";
      sectionObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const [lockedProjectModal, setLockedProjectModal] = useState(null);
  const navigate = useNavigate();

  const handleProjectClick = (e, project) => {
    if (!project?.slug) return false;
    if (project.isPasswordProtected && !isProjectUnlocked(project.slug)) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setLockedProjectModal(project);
      return true;
    }
    return false;
  };

  const handleModalSuccess = (slug) => {
    setLockedProjectModal(null);
    navigate(`/projects/${slug}`);
  };

  const handleHoverStart = () => {
    activeHoverCardRef.current = true;
    document.body.dataset.cursorProjectHover = "true";
  };

  const handleHoverEnd = () => {
    activeHoverCardRef.current = false;
    document.body.dataset.cursorProjectHover = "false";
  };

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

      <section
        ref={sectionRef}
        onMouseLeave={handleHoverEnd}
        className="bg-bg pl-6 pt-20 pb-12 text-ink transition-colors duration-300 sm:pb-16 md:pl-12 lg:pl-16 dark:bg-[#0c0a14] dark:text-white"
      >
        <div className="pr-6 md:pr-12 lg:pr-16">
          <h1 className="font-display text-5xl font-semibold normal-case leading-[0.95] tracking-tighter sm:text-7xl md:text-[clamp(6rem,4.33rem+3.47vw,8.5rem)]">
            Selected Work
          </h1>
        </div>

        {projects.length > 0 && (
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 pr-6 sm:mt-20 md:pr-12 lg:grid-cols-12 lg:pr-16">
            {projects.map((project, i) => (
              <GalleryProjectCard
                key={project.id}
                project={project}
                size={GRID_COLUMN_SIZE[i % 3]}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onProjectClick={handleProjectClick}
              />
            ))}
          </div>
        )}
      </section>

      <PasswordModal
        isOpen={Boolean(lockedProjectModal)}
        onClose={() => setLockedProjectModal(null)}
        project={lockedProjectModal}
        onSuccess={handleModalSuccess}
      />

      <ArchiveSection />
    </>
  );
}

export default WorkGallery;

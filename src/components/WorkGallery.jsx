import { Link } from "react-router-dom";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { projectsQuery } from "../sanity/queries";
import { imageUrl } from "../sanity/client";
import ArchiveSection from "./ArchiveSection";

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

function mapProject(doc) {
  return {
    id: doc._id,
    slug: doc.slug,
    title: toTitleCase(doc.title),
    mediaUrl: imageUrl(doc.mainImage, 1600),
    mediaAlt: doc.mainImage?.alt,
    tags: doc.tags || [],
  };
}

function GalleryProjectCard({ project, size }) {
  const cls = CARD_SIZE_CLASSES[size];
  return (
    <div className={`flex flex-col gap-2 ${cls.wrap}`}>
      <div className="aspect-[669/539] w-full overflow-hidden bg-ink/5 dark:bg-white/5">
        {project.mediaUrl && (
          <img
            src={project.mediaUrl}
            alt={project.mediaAlt || project.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <p className={`font-display font-bold normal-case tracking-tight text-ink dark:text-white ${cls.title}`}>
            {project.title}
          </p>
          {project.slug && (
            <Link
              to={`/projects/${project.slug}`}
              data-transition-label={project.title}
              className={`shrink-0 whitespace-nowrap border-b border-primary font-display normal-case tracking-tight text-primary transition-opacity hover:opacity-70 dark:border-[#114AFC] dark:text-[#114AFC] ${cls.link}`}
            >
              View Case Study →
            </Link>
          )}
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-col gap-1">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className={`font-display normal-case text-ink/60 dark:text-white/60 ${cls.tag}`}
              >
                {tag}
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

  return (
    <>
      <section className="bg-bg pl-6 pt-20 pb-12 text-ink transition-colors duration-300 sm:pb-16 md:pl-12 lg:pl-16 dark:bg-[#0c0a14] dark:text-white">
        <div className="pr-6 md:pr-12 lg:pr-16">
          <h1 className="font-display text-5xl font-semibold normal-case leading-[0.95] tracking-tighter sm:text-7xl md:text-8xl lg:text-[8.5rem]">
            Selected Work
          </h1>
        </div>

        {projects.length > 0 && (
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 pr-6 sm:mt-20 md:pr-12 lg:grid-cols-12 lg:pr-16">
            {projects.map((project, i) => (
              <GalleryProjectCard key={project.id} project={project} size={GRID_COLUMN_SIZE[i % 3]} />
            ))}
          </div>
        )}
      </section>

      <ArchiveSection />
    </>
  );
}

export default WorkGallery;

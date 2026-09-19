import { useSanityQuery } from "../sanity/useSanityQuery";
import { archiveCategoriesQuery } from "../sanity/queries";
import { imageUrl } from "../sanity/client";

// Figma: node 1003:552 — one Archive row per archiveCategory document
// (global, project-independent). Shared between the "gallery" Work
// template (WorkGallery.jsx) and the "classic" one (WorkIndex.jsx) —
// this is the single implementation both render, not two copies.
//
// Renders nothing (not an empty heading/shell) when zero
// archiveCategory documents exist, same guard in both templates —
// classic ships with this state today since no content has been added
// yet.
function ArchiveRow({ category }) {
  const items = category.items || [];
  return (
    <div className="flex flex-col gap-6 border-b border-ink/10 py-12 sm:col-span-3 sm:grid sm:grid-cols-subgrid sm:items-center sm:py-10 md:py-14 dark:border-white/10">
      {/* Column 1: Title + Date (auto-adjusts to the widest title across rows) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 md:gap-8 sm:whitespace-nowrap">
        <p className="font-display text-2xl font-medium normal-case tracking-tight text-ink sm:text-2xl md:text-3xl dark:text-white">
          {category.title}
        </p>
        {category.dateRangeLabel && (
          <p className="font-display text-base normal-case tracking-tight text-ink/40 sm:text-lg dark:text-white/40">
            {category.dateRangeLabel}
          </p>
        )}
      </div>

      {/* Column 2: Category Tag (vertically aligned across all rows) */}
      <div className="flex items-center">
        {category.categoryTag && (
          <div className="inline-block w-fit rounded-none border border-ink/20 px-3.5 py-1 font-display text-xs font-bold uppercase tracking-wider text-ink/90 dark:border-white/30 dark:bg-white/10 dark:text-white/90">
            {category.categoryTag}
          </div>
        )}
      </div>

      {/* Column 3: Thumbnails (aligned to right) */}
      {items.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-4">
          {items.map((item, i) => {
            const url = imageUrl(item.media, 400);
            if (!url) return null;
            return (
              <div
                key={i}
                className="relative z-0 h-24 w-32 shrink-0 overflow-hidden bg-ink/5 transition-all duration-300 ease-out hover:z-10 hover:scale-120 hover:shadow-xl sm:h-28 sm:w-36 dark:bg-white/5 dark:hover:shadow-black/60 motion-reduce:transition-none motion-reduce:hover:scale-100"
              >
                <img
                  src={url}
                  alt={item.alt || category.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

function ArchiveSection() {
  const { data: archiveDocs, status } = useSanityQuery(archiveCategoriesQuery, {}, []);
  const archiveCategories = status === "ready" ? archiveDocs : [];

  if (archiveCategories.length === 0) return null;

  return (
    <section className="bg-bg pl-6 pt-24 pb-12 text-ink transition-colors duration-300 sm:pt-32 sm:pb-16 md:pl-12 lg:pl-16 dark:bg-[#0c0a14] dark:text-white">
      <div className="pr-6 md:pr-12 lg:pr-16">
        <h2 className="font-display text-5xl font-semibold normal-case leading-[0.95] tracking-tighter sm:text-4xl md:text-[clamp(3rem,1.67rem+2.78vw,5rem)]">
          Archive
        </h2>
        <div className="mt-8 flex flex-col border-t border-ink/10 sm:mt-10 sm:grid sm:grid-cols-[max-content_auto_1fr] sm:gap-x-8 md:gap-x-12 dark:border-white/10">
          {archiveCategories.map((category) => (
            <ArchiveRow key={category._id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ArchiveSection;

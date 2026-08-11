import { useRef, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { PortableText } from "@portabletext/react";
import Header from "../components/Header";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { projectBySlugQuery } from "../sanity/queries";
import { urlFor } from "../sanity/client";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

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
      <p className="mt-6 font-sans text-base leading-relaxed text-ink/80 dark:text-white/80 sm:text-lg">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-8 border-l-4 border-primary pl-6 font-display text-xl font-bold uppercase leading-snug text-ink dark:text-white sm:text-2xl">
        {children}
      </blockquote>
    ),
  },
  types: {
    captionedImage: ({ value }) => {
      const src = urlFor(value)?.width(1600).url();
      if (!src) return null;
      return (
        <figure className="mt-10">
          <img
            src={src}
            alt={value.alt || ""}
            className="w-full object-cover"
          />
          {value.caption && (
            <figcaption className="mt-3 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    videoEmbed: ({ value }) => {
      const fileUrl = value.file?.asset?.url;
      return (
        <figure className="mt-10">
          {fileUrl ? (
            <video
              src={fileUrl}
              controls
              className="w-full"
            />
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
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(value.images || []).map((img, i) => {
          const src = urlFor(img)?.width(900).url();
          if (!src) return null;
          return (
            <figure key={img._key || i}>
              <img
                src={src}
                alt={img.alt || ""}
                className="w-full object-cover"
              />
              {img.caption && (
                <figcaption className="mt-2 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    ),
  },
};

function CaseStudy({ theme, onToggleTheme }) {
  const { slug } = useParams();
  const { data: project, status } = useSanityQuery(
    projectBySlugQuery,
    { slug },
    null
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const heroImageUrl = urlFor(project?.mainImage)?.width(1800).url();

  return (
    <div className="site-shell relative min-h-[100dvh] bg-bg font-display text-ink uppercase transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
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
            to="/"
            className="font-display text-sm font-bold uppercase tracking-widest text-primary underline"
          >
            Back to home
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-ink/50 dark:text-white/50">
            Couldn&rsquo;t load this case study right now.
          </p>
        </div>
      )}

      {status === "ready" && project && (
        <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-10 sm:px-10 md:px-14">
          <Link
            to="/"
            className="inline-block font-display text-xs font-bold uppercase tracking-widest text-ink/50 transition-colors hover:text-ink dark:text-white/50 dark:hover:text-white"
          >
            ← Back
          </Link>

          <p className="mt-6 font-display text-sm font-bold uppercase tracking-widest text-ink/60 dark:text-white/60">
            {project.client}
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase leading-[1.05] tracking-tight text-ink dark:text-white sm:text-6xl md:text-7xl">
            {project.title}
          </h1>

          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {project.industry && (
              <div>
                <div className="font-display text-xs font-bold uppercase text-ink dark:text-white">
                  Industry
                </div>
                <div className="mt-0.5 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50">
                  {project.industry}
                </div>
              </div>
            )}
            {project.role && (
              <div>
                <div className="font-display text-xs font-bold uppercase text-ink dark:text-white">
                  Role
                </div>
                <div className="mt-0.5 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50">
                  {project.role}
                </div>
              </div>
            )}
            {project.externalLink && (
              <a
                href={project.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xs font-bold uppercase tracking-wider text-primary underline"
              >
                Visit live site ↗
              </a>
            )}
          </div>

          {heroImageUrl && (
            <img
              src={heroImageUrl}
              alt={project.client}
              className="mt-12 w-full object-cover"
            />
          )}

          {project.caseStudyBody?.length ? (
            <div className="normal-case">
              <PortableText
                value={project.caseStudyBody}
                components={portableTextComponents}
              />
            </div>
          ) : (
            <p className="mt-10 font-sans text-base normal-case leading-relaxed text-ink/60 dark:text-white/60">
              The full case study for this project is coming soon.
            </p>
          )}
        </article>
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

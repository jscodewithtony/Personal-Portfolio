import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { PortableText } from "@portabletext/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "../components/Header";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { projectBySlugQuery } from "../sanity/queries";
import { urlFor } from "../sanity/client";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

gsap.registerPlugin(ScrollTrigger);

// Shown for whichever of the newer fields (timeline/tools/overview/
// outcome stats) a project doesn't have filled in yet in Sanity — keeps
// the page fully populated with placeholder content rather than
// leaving visible gaps, per the "use dummy/placeholder text for now"
// brief. Real projects override these field by field once authored.
const DUMMY = {
  timeline: "6 Weeks · Q1 2026",
  tools: ["Figma", "React", "GSAP"],
  overviewParagraphs: [
    "The client came to us with a product that worked, but users kept dropping off before they ever reached the moment it actually proved its value. The brief wasn't \"redesign everything\" — it was \"find where trust breaks down, and fix that.\"",
    "We spent the first two weeks embedded in support tickets and session recordings rather than sketching screens. The pattern that emerged wasn't a single broken flow — it was a dozen small moments where the product asked for trust it hadn't earned yet.",
    "The goal became narrow and concrete: redesign the first five minutes of the experience so every irreversible or unclear action explains itself before it happens, without slowing down the people who already know exactly what they're doing.",
  ],
  outcomeStats: [
    { value: "32%", label: "Reduction in onboarding drop-off" },
    { value: "2.4x", label: "Faster task completion" },
    { value: "18", label: "Components shipped to the design system" },
  ],
};

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
    // Full-bleed image break: breaks out of the prose column to span
    // the full viewport width, rather than staying capped at max-w-4xl.
    captionedImage: ({ value }) => {
      const src = urlFor(value)?.width(2400).url();
      if (!src) return null;
      return (
        <figure className="reveal-on-scroll relative left-1/2 mt-14 w-screen -translate-x-1/2 overflow-hidden">
          <div className="parallax-image-wrap overflow-hidden">
            <img
              src={src}
              alt={value.alt || ""}
              loading="lazy"
              className="parallax-image h-[46vh] w-full object-cover sm:h-[60vh] md:h-[72vh]"
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
        <figure className="reveal-on-scroll mt-10">
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
    // Multi-image grid: the "gallery/varied visual content" requirement
    // — a project author drops one of these blocks anywhere in the
    // Process/Approach body.
    gallery: ({ value }) => (
      <div className="reveal-on-scroll mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(value.images || []).map((img, i) => {
          const src = urlFor(img)?.width(1000).url();
          if (!src) return null;
          return (
            <figure key={img._key || i}>
              <img src={src} alt={img.alt || ""} loading="lazy" className="w-full object-cover" />
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

  // A fresh case study visited from a card click should open at the
  // top, not inherit whatever scroll position the previous page (or a
  // previous case study) was at.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const heroRef = useRef(null);
  const heroImgRef = useRef(null);
  const metaRef = useRef(null);
  const overviewRef = useRef(null);
  const processRef = useRef(null);
  const outcomeRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    if (status !== "ready" || !project) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      // Same fade/slide-up-on-scroll-enter idiom used elsewhere on the
      // site (Insight.jsx's article grid): bidirectional, replays if
      // the user scrolls back up past the section and down again.
      const revealPanels = [
        metaRef.current,
        overviewRef.current,
        processRef.current,
        outcomeRef.current,
        nextRef.current,
      ].filter(Boolean);

      revealPanels.forEach((el) => {
        gsap.set(el, { y: 40, opacity: 0 });
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Outcome stat cards stagger in individually rather than as one block.
      const statCards = outcomeRef.current?.querySelectorAll("[data-stat-card]");
      if (statCards?.length) {
        gsap.set(statCards, { y: 24, opacity: 0 });
        gsap.to(statCards, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: outcomeRef.current,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      }

      // Portable Text figures/galleries get the same reveal, matched by
      // class since they're rendered by the portableTextComponents
      // above rather than held in a ref here.
      const bodyReveals = processRef.current?.querySelectorAll(".reveal-on-scroll");
      bodyReveals?.forEach((el) => {
        gsap.set(el, { y: 30, opacity: 0 });
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Subtle scale-down-on-scroll (classic Ken Burns) on every image
      // that opts in via this class — hero cover + the full-bleed break
      // inside the Process body. Scrubbed to scroll position, same
      // mechanism (not the same intensity) as the rest of the site's
      // scroll-scrubbed motion.
      const parallaxImages = gsap.utils.toArray(".parallax-image");
      parallaxImages.forEach((img) => {
        gsap.fromTo(
          img,
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: img,
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
    }, heroRef);

    return () => ctx.revert();
  }, [status, project]);

  const heroImageUrl = urlFor(project?.mainImage)?.width(2400).url();
  const nextThumbUrl = urlFor(project?.nextProject?.mainImage)?.width(1200).url();

  const timeline = project?.timeline || DUMMY.timeline;
  const tools = project?.tools?.length ? project.tools : DUMMY.tools;
  const overviewParagraphs = project?.overviewParagraphs?.length
    ? project.overviewParagraphs
    : DUMMY.overviewParagraphs;
  const outcomeStats = project?.outcomeStats?.length
    ? project.outcomeStats
    : DUMMY.outcomeStats;

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
            to="/#featured-projects"
            className="font-display text-sm font-bold uppercase tracking-widest text-primary underline dark:text-[#114AFC]"
          >
            ← All Projects
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
        <main ref={heroRef}>
          <div className="mx-auto w-full max-w-4xl px-6 pt-10 sm:px-10 md:px-14">
            <Link
              to="/#featured-projects"
              className="inline-block font-display text-xs font-bold uppercase tracking-widest text-ink/50 transition-colors hover:text-ink dark:text-white/50 dark:hover:text-white"
            >
              ← All Projects
            </Link>
          </div>

          {/* Hero block */}
          <div className="mx-auto mt-6 w-full max-w-4xl px-6 sm:px-10 md:px-14">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-ink/60 dark:text-white/60">
              {project.client}
            </p>
            <h1 className="mt-2 font-display text-4xl font-black uppercase leading-[1.02] tracking-tight text-ink dark:text-white sm:text-6xl md:text-7xl lg:text-8xl">
              {project.title}
            </h1>
            <p className="mt-4 max-w-2xl font-sans text-base normal-case leading-relaxed text-ink/70 dark:text-white/70 sm:text-lg">
              {project.shortDescription}
            </p>
          </div>

          {heroImageUrl && (
            <div className="parallax-image-wrap mt-10 w-full overflow-hidden sm:mt-12">
              <img
                ref={heroImgRef}
                src={heroImageUrl}
                alt={project.client}
                className="parallax-image h-[50vh] w-full object-cover sm:h-[65vh] md:h-[80vh]"
              />
            </div>
          )}

          <div className="mx-auto w-full max-w-4xl px-6 pb-24 sm:px-10 md:px-14">
            {/* Meta row */}
            <div
              ref={metaRef}
              className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-b border-ink/10 pb-10 dark:border-white/10 sm:mt-12"
            >
              {[
                { label: "Client", value: project.client },
                { label: "Industry", value: project.industry },
                { label: "Role", value: project.role },
                { label: "Timeline", value: timeline },
                { label: "Tools", value: tools.join(" · ") },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label}>
                    <div className="font-display text-xs font-bold uppercase text-ink dark:text-white">
                      {item.label}
                    </div>
                    <div className="mt-0.5 font-display text-xs uppercase tracking-wider text-ink/50 dark:text-white/50">
                      {item.value}
                    </div>
                  </div>
                ))}
              {project.externalLink && (
                <a
                  href={project.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-end font-display text-xs font-bold uppercase tracking-wider text-primary underline dark:text-[#114AFC]"
                >
                  Visit live site ↗
                </a>
              )}
            </div>

            {/* Overview */}
            <div ref={overviewRef} className="mt-12 sm:mt-14">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-ink dark:text-white sm:text-3xl">
                Overview
              </h2>
              <div className="normal-case">
                {overviewParagraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="mt-6 font-sans text-base leading-relaxed text-ink/80 dark:text-white/80 sm:text-lg"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Process / Approach — Portable Text: headings, paragraphs,
                a full-bleed image break, and a multi-image gallery all
                come from this one CMS-authored rich body. */}
            <div ref={processRef} className="mt-4">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-ink dark:text-white sm:text-3xl">
                Process &amp; Approach
              </h2>
              {project.caseStudyBody?.length ? (
                <div className="normal-case">
                  <PortableText
                    value={project.caseStudyBody}
                    components={portableTextComponents}
                  />
                </div>
              ) : (
                <p className="mt-6 font-sans text-base normal-case leading-relaxed text-ink/60 dark:text-white/60">
                  The full process write-up for this project is coming soon.
                </p>
              )}
            </div>

            {/* Outcome / Results — matches Stats.jsx's card + big-figure
                typography (border card, font-black stat-value figure,
                small caption underneath). */}
            <div ref={outcomeRef} className="mt-16 sm:mt-20">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-ink dark:text-white sm:text-3xl">
                Outcome &amp; Results
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {outcomeStats.map((stat) => (
                  <div
                    key={stat.label}
                    data-stat-card
                    className="border border-ink/15 bg-white p-6 dark:border-white/15 dark:bg-[#141416]"
                  >
                    <div className="font-display text-4xl font-black leading-none tracking-tight text-stat-value dark:text-white sm:text-5xl">
                      {stat.value}
                    </div>
                    <div className="mt-3 font-display text-xs uppercase tracking-wider text-ink/60 dark:text-white/60">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Case Study */}
          {project.nextProject && (
            <Link
              ref={nextRef}
              to={`/projects/${project.nextProject.slug}`}
              className="group relative flex w-full items-center justify-center overflow-hidden border-t border-ink/10 dark:border-white/10"
            >
              {nextThumbUrl && (
                <img
                  src={nextThumbUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full scale-105 object-cover opacity-20 transition-transform duration-700 group-hover:scale-110 dark:opacity-15"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-20 text-center sm:py-28">
                <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-ink/60 dark:text-white/60">
                  Next Case Study
                </p>
                <h3 className="font-display text-4xl font-black uppercase leading-[1.02] tracking-tight text-ink dark:text-white sm:text-6xl md:text-7xl">
                  {project.nextProject.title}
                </h3>
                <span className="mt-2 font-display text-sm font-bold uppercase tracking-widest text-primary transition-transform group-hover:translate-x-1 dark:text-[#114AFC]">
                  View project →
                </span>
              </div>
            </Link>
          )}
        </main>
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

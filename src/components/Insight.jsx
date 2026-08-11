import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ArticleCard from "./ArticleCard";
import fallbackInsights from "../data/insights.json";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { articlesQuery } from "../sanity/queries";
import { urlFor } from "../sanity/client";

gsap.registerPlugin(ScrollTrigger);

function mapSanityArticle(doc) {
  return {
    title: doc.title,
    excerpt: doc.excerpt,
    date: doc.publishDate,
    image: urlFor(doc.thumbnail)?.width(800).url(),
    link: doc.externalLink,
    source: doc.sourcePlatform,
  };
}

// Formats "2026-07-13" (insights.json's ISO date) into "Jul 13, 2026" —
// the display format the card was already built for. Parsed as UTC
// so the displayed date can't shift a day depending on the reader's
// timezone.
function formatDisplayDate(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Insight() {
  const { data: docs, status } = useSanityQuery(articlesQuery, {}, []);
  const insights =
    status === "ready" && docs?.length
      ? docs.map(mapSanityArticle)
      : fallbackInsights;

  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const grid = gridRef.current;
    if (!section || !headline || !grid) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      const cards = grid.children;

      gsap.set(headline, { y: 32, opacity: 0 });
      gsap.set(cards, { y: 40, opacity: 0 });

      // Bidirectional entrance, not pinned/scrubbed like the poster
      // sections: plays forward as the section scrolls into view, and
      // reverses (slides/fades back down) if the user scrolls back up
      // past the trigger point, replaying forward again if they scroll
      // back down — a plain toggle, not a one-shot. Explicit start/end
      // (rather than leaving end to default) so the "scrolled back up
      // past start" crossing that reverse depends on is unambiguous.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(headline, { y: 0, opacity: 1, duration: 0.7 }, 0).to(
        cards,
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.15 },
        0.15
      );

      // Several heavy sections sit above this one (Stats' Three.js
      // scene, the testimonials carousel) whose own height can still be
      // settling well after mount — if ScrollTrigger measures this
      // section's position before that settles, the stored start/end
      // range (and therefore exactly where "scrolled back up past
      // start" fires) ends up stale, which reads as "reverse doesn't
      // work" even though the trigger itself is configured correctly.
      // Refresh repeatedly, including on the window load event, to
      // catch layout that finishes settling later than a single timer.
      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
      const settleTimers = [300, 800, 1500].map((delay) =>
        setTimeout(() => ScrollTrigger.refresh(), delay)
      );
      const handleLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", handleLoad);
      return () => {
        settleTimers.forEach(clearTimeout);
        window.removeEventListener("load", handleLoad);
      };
    }, section);

    return () => ctx.revert();
    // Re-runs once `status` resolves so the reveal targets the real
    // (possibly different-count) CMS article grid, not just whatever
    // grid.children looked like at the fallback-content first render.
  }, [status]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-bg px-6 py-20 text-ink transition-colors duration-300 sm:px-10 sm:py-24 md:px-14 md:py-28 dark:bg-[#0c0a14] dark:text-white"
    >
      <div className="mx-auto flex w-full flex-col gap-12 sm:gap-14 md:gap-16">
        <h2
          ref={headlineRef}
          className="select-none font-display text-6xl font-black uppercase leading-[0.85] tracking-tight text-ink dark:text-white sm:text-7xl md:text-8xl"
        >
          Insight
        </h2>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2"
        >
          {insights.map((entry) => (
            <ArticleCard
              key={entry.link}
              article={{
                title: entry.title,
                excerpt: entry.excerpt,
                date: formatDisplayDate(entry.date),
                image: entry.image,
                href: entry.link,
                source: entry.source,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Insight;

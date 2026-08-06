import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import aboutPortrait from "../assets/about-portrait.png";

gsap.registerPlugin(ScrollTrigger);

// Same pinned-scrub shape Statement (Section 3) uses: the section holds
// while the image settles into place across this much extra scroll
// distance, instead of a fixed-duration one-shot entrance.
const PIN_DISTANCE_VH = 1.1;

// Fixed 4-line layout with intentional wide gaps mid-line, matching the
// Figma source exactly. Built with non-breaking space (NBSP) runs.
const NBSP = "\u00A0";
const HEADLINE_STRUCTURE = [
  { words: ["A", "product", "designer"], gaps: [" ", " "] },
  { words: ["focused", "on", "what", "actually"], gaps: [" ", NBSP.repeat(6), " "] },
  { words: ["works", "designing", "for"], gaps: [" ", " "] },
  { words: ["impact,", "not", "just", "appearance."], gaps: [" ", " ", NBSP.repeat(4)] },
];

function About() {
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const imageOuterRef = useRef(null);
  const imageInnerRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const imageOuter = imageOuterRef.current;
    const imageInner = imageInnerRef.current;
    if (!section || !imageOuter || !imageInner || !headline) return;

    const wordElements = headline.querySelectorAll(".word");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      gsap.set(wordElements, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(imageOuter, { clipPath: "inset(0 0 100% 0)" });
      gsap.set(imageInner, { scale: 1.15 });

      // Start headline words dimmed (15% opacity)
      gsap.set(wordElements, { opacity: 0.15 });

      // Same ScrollTrigger shape as Statement: pinned, scrubbed, continuous 0-1 timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * PIN_DISTANCE_VH}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });

      // Word-by-word color highlight scrub
      tl.to(
        wordElements,
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
        },
        0
      );

      // Image wipe & scale settle
      tl.to(imageOuter, { clipPath: "inset(0 0 0% 0)", ease: "none", duration: 1 }, 0)
        .to(imageInner, { scale: 1, ease: "none", duration: 1 }, 0);

      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
      const settleTimer = setTimeout(() => ScrollTrigger.refresh(), 300);
      return () => clearTimeout(settleTimer);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-bg px-6 py-24 text-ink transition-colors duration-300 sm:px-10 sm:py-28 md:px-14 md:py-32 dark:bg-[#0c0a14] dark:text-white"
    >
      {/* Subtle Grid Background Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-8 md:gap-y-24">
        {/* Headline: full-width, left-aligned statement with GSAP ScrollTrigger word highlight */}
        <h2
          ref={headlineRef}
          className="col-span-1 select-none font-display text-3xl font-extrabold uppercase leading-[1.12] tracking-tight md:col-span-12 sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5.25rem]"
        >
          {HEADLINE_STRUCTURE.map((line, lineIdx) => (
            <React.Fragment key={lineIdx}>
              {line.words.map((word, wordIdx) => (
                <React.Fragment key={wordIdx}>
                  <span className="word inline-block">
                    {word}
                  </span>
                  {line.gaps[wordIdx] || ""}
                </React.Fragment>
              ))}
              {lineIdx < HEADLINE_STRUCTURE.length - 1 && <br />}
            </React.Fragment>
          ))}
        </h2>

        {/* Body copy */}
        <div className="col-span-1 flex flex-col gap-6 self-end md:col-span-4 md:col-start-5">
          <p className="font-display text-base leading-relaxed text-ink/70 dark:text-white/70 sm:text-lg">
            I value clarity, structure, and intent — both in design and in
            how I build. I am drawn to systems that hold up under scale:
            patterns, not one-offs. I believe good design is governed, not
            just made — every decision should trace back to a reason.
          </p>
          <p className="font-display text-base leading-relaxed text-ink/70 dark:text-white/70 sm:text-lg">
            I like building things end to end, from the first sketch to
            the shipped product. And I trust frameworks over instinct —
            but only the ones I've tested myself.
          </p>
        </div>

        {/* Portrait */}
        <div
          ref={imageOuterRef}
          className="relative col-span-1 h-[60vh] w-full overflow-hidden md:col-span-4 md:col-start-9 md:h-[34rem]"
        >
          <img
            ref={imageInnerRef}
            src={aboutPortrait}
            alt="Tony, seated outdoors in dark clothing beside a black horse"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export default About;

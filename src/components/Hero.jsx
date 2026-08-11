import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Mascot from "./Mascot";
import FitText from "./FitText";
import Shuffle from "./Shuffle";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { homepageContentQuery } from "../sanity/queries";

gsap.registerPlugin(ScrollTrigger);

const PIN_DISTANCE_VH = 1.3;
const MERGE_COVER_MARGIN = 1.35;

// Original hardcoded copy, reused as the fallback shown while the CMS
// fetch is loading and if homepageContent has no value for a field yet
// — the hero is never left blank.
const FALLBACK = {
  heroHeadline: "HELLO I'M TONY",
  heroBasedInLocation: "INDIA",
  heroTagline: "DESIGN WITH AI",
  heroSpecs: ["UIUX DESIGNER", "ACCESSIBILITY(A11Y)", "DESIGN SYSTEM"],
  heroBadgeLine1: "STILL WAITING FOR",
  heroBadgeLine2: "FIRST DESIGN AWARD 🏆",
};

function Hero() {
  const { data: content, status } = useSanityQuery(
    homepageContentQuery,
    {},
    null
  );
  const c = status === "ready" ? { ...FALLBACK, ...content } : FALLBACK;
  const heroSpecs =
    c.heroSpecs && c.heroSpecs.length ? c.heroSpecs : FALLBACK.heroSpecs;

  const sectionRef = useRef(null);
  const leftLabelRef = useRef(null);
  const rightLabelRef = useRef(null);
  const headlineWrapRef = useRef(null);
  const mascotWrapRef = useRef(null);
  const mascotFaceRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * PIN_DISTANCE_VH}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      tl.to(leftLabelRef.current, {
        y: -90,
        x: -24,
        duration: 0.7,
        ease: "power1.in",
      }, 0)
        .to(rightLabelRef.current, {
          y: -90,
          x: 24,
          duration: 0.7,
          ease: "power1.in",
        }, 0)
        .to(headlineWrapRef.current, {
          y: () => {
            const rect = headlineWrapRef.current.getBoundingClientRect();
            return -(rect.bottom + 80);
          },
          scale: 0.9,
          duration: 0.75,
          ease: "power1.in",
        }, 0)
        .to(mascotFaceRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "none",
        }, 0.45)
        .to(mascotWrapRef.current, {
          scale: () => {
            const rect = mascotWrapRef.current.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) || 1;
            const viewportSpan = Math.max(window.innerWidth, window.innerHeight);
            return (viewportSpan / size) * MERGE_COVER_MARGIN;
          },
          duration: 0.75,
          ease: "power2.in",
        }, 0.4);

      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
      const settleTimer = setTimeout(() => ScrollTrigger.refresh(), 300);
      return () => clearTimeout(settleTimer);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden bg-bg pb-6 pt-0 text-ink transition-colors duration-300 select-none dark:bg-[#0c0a14] dark:text-white"
    >
      <div className="relative z-10 flex flex-col justify-between flex-1 w-full max-w-[94vw] mx-auto pt-2 pb-6">
        {/* Top Headline: Full Width HELLO I'M TONY */}
        <div
          ref={headlineWrapRef}
          className="relative z-10 w-full text-center"
        >
          <FitText
            as="div"
            className="select-none font-display font-black leading-[0.82] tracking-tighter text-ink dark:text-white"
            maxFontSize={800}
            minFontSize={70}
          >
            <Shuffle
              key={c.heroHeadline}
              text={c.heroHeadline}
              tag="h1"
              className="select-none font-display font-black leading-[0.82] tracking-tighter text-ink dark:text-white whitespace-nowrap"
              shuffleDirection="right"
              duration={0.55}
              animationMode="evenodd"
              shuffleTimes={1}
              ease="power2.out"
              stagger={0.03}
              threshold={0.1}
              triggerOnce={true}
              triggerOnHover={true}
              respectReducedMotion={true}
            />
          </FitText>

          {/* Sub-headline bar: BASED IN INDIA & DESIGN WITH AI */}
          <div className="relative z-10 flex items-center justify-between mt-2 px-1 sm:px-2">
            <p className="font-display text-xs sm:text-sm md:text-base lg:text-[1.5em] font-bold uppercase tracking-[0.70em] text-ink/90 dark:text-white/90">
              BASED IN {c.heroBasedInLocation}
            </p>
            <p className="font-display text-xs sm:text-sm md:text-base lg:text-[1.5em] font-bold uppercase tracking-[0.70em] text-ink/90 dark:text-white/90">
              {c.heroTagline}
            </p>
          </div>
        </div>

        {/* Center Main Row: Left Specs + Mascot + Right Specs */}
        <div className="relative z-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16 my-auto pt-4 pb-2 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8">
          {/* Left Spec Column */}
          <div
            ref={leftLabelRef}
            className="flex flex-col items-end justify-center gap-2 sm:gap-3 text-right"
          >
            {heroSpecs.map((spec) => (
              <p
                key={spec}
                className="font-display text-xs sm:text-sm md:text-lg lg:text-2xl xl:text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white uppercase whitespace-nowrap"
              >
                {spec}
              </p>
            ))}
          </div>

          {/* Center Mascot */}
          <div ref={mascotWrapRef} className="relative z-30 shrink-0">
            <Mascot faceRef={mascotFaceRef} />
          </div>

          {/* Right Spec Column */}
          <div
            ref={rightLabelRef}
            className="flex flex-col items-start justify-center gap-2 sm:gap-3 text-left"
          >
            <p className="font-display text-xs sm:text-sm md:text-lg lg:text-2xl xl:text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white uppercase whitespace-nowrap">
              {c.heroBadgeLine1}
            </p>
            <p className="font-display text-xs sm:text-sm md:text-lg lg:text-2xl xl:text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white uppercase flex items-center gap-2 whitespace-nowrap">
              {c.heroBadgeLine2}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

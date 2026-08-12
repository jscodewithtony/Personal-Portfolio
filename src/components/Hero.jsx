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

// Easily adjust the font size of mobile sub-details here (e.g., text-[12px], text-sm, text-base)
const MOBILE_SPEC_FONT_SIZE = "text-[18px]";

// Easily adjust the vertical spacing between the left and right mobile sections here (e.g., mt-4, mt-6, mt-8, mt-12)
const MOBILE_SPEC_VERTICAL_GAP = "mt-6";

// Easily adjust the top margin/gap of the mobile mascot here (e.g., mt-2, mt-4, mt-6, mt-8)
const MOBILE_MASCOT_TOP_GAP = "mt-2";

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
  const desktopLeftLabelRef = useRef(null);
  const desktopRightLabelRef = useRef(null);
  const desktopHeadlineWrapRef = useRef(null);
  const desktopMascotWrapRef = useRef(null);
  const desktopMascotFaceRef = useRef(null);

  const mobileLeftLabelRef = useRef(null);
  const mobileRightLabelRef = useRef(null);
  const mobileHeadlineWrapRef = useRef(null);
  const mobileMascotWrapRef = useRef(null);
  const mobileMascotFaceRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const mm = gsap.matchMedia();

    // Desktop Layout Scroll Motion
    mm.add("(min-width: 768px)", () => {
      const headlineWrap = desktopHeadlineWrapRef.current;
      const leftLabel = desktopLeftLabelRef.current;
      const rightLabel = desktopRightLabelRef.current;
      const mascotWrap = desktopMascotWrapRef.current;
      const mascotFace = desktopMascotFaceRef.current;

      if (!headlineWrap || !leftLabel || !rightLabel || !mascotWrap || !mascotFace)
        return;

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

      tl.to(leftLabel, {
        y: -90,
        x: -24,
        duration: 0.7,
        ease: "power1.in",
      }, 0)
        .to(rightLabel, {
          y: -90,
          x: 24,
          duration: 0.7,
          ease: "power1.in",
        }, 0)
        .to(headlineWrap, {
          y: () => {
            const rect = headlineWrap.getBoundingClientRect();
            return -(rect.bottom + 80);
          },
          scale: 0.9,
          duration: 0.75,
          ease: "power1.in",
        }, 0)
        .to(mascotFace, {
          opacity: 0,
          duration: 0.3,
          ease: "none",
        }, 0.45)
        .to(mascotWrap, {
          scale: () => {
            const rect = mascotWrap.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) || 1;
            const viewportSpan = Math.max(window.innerWidth, window.innerHeight);
            return (viewportSpan / size) * MERGE_COVER_MARGIN;
          },
          duration: 0.75,
          ease: "power2.in",
        }, 0.4);
    });

    // Mobile Layout Scroll Motion
    mm.add("(max-width: 767px)", () => {
      const headlineWrap = mobileHeadlineWrapRef.current;
      const leftLabel = mobileLeftLabelRef.current;
      const rightLabel = mobileRightLabelRef.current;
      const mascotWrap = mobileMascotWrapRef.current;
      const mascotFace = mobileMascotFaceRef.current;

      if (!headlineWrap || !leftLabel || !rightLabel || !mascotWrap || !mascotFace)
        return;

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

      tl.to(leftLabel, {
        y: -90,
        x: -24,
        duration: 0.7,
        ease: "power1.in",
      }, 0)
        .to(rightLabel, {
          y: -90,
          x: 24,
          duration: 0.7,
          ease: "power1.in",
        }, 0)
        .to(headlineWrap, {
          y: () => {
            const rect = headlineWrap.getBoundingClientRect();
            return -(rect.bottom + 80);
          },
          scale: 0.9,
          duration: 0.75,
          ease: "power1.in",
        }, 0)
        .to(mascotFace, {
          opacity: 0,
          duration: 0.3,
          ease: "none",
        }, 0.45)
        .to(mascotWrap, {
          scale: () => {
            const rect = mascotWrap.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) || 1;
            const viewportSpan = Math.max(window.innerWidth, window.innerHeight);
            return (viewportSpan / size) * MERGE_COVER_MARGIN;
          },
          duration: 0.75,
          ease: "power2.in",
        }, 0.4);
    });

    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    const settleTimer = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      clearTimeout(settleTimer);
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden bg-bg pb-0 md:pb-6 pt-0 text-ink transition-colors duration-300 select-none dark:bg-[#0c0a14] dark:text-white"
    >
      <div className="relative z-10 flex flex-col justify-start md:justify-between flex-1 w-full max-w-none md:max-w-[94vw] mx-auto pt-2 pb-0 md:pb-6">
        {/* Top Headline Section */}
        <div className="relative z-10 w-full text-center">
          {/* Mobile View: Centered Badge + Stacked 2-line Headline */}
          <div ref={mobileHeadlineWrapRef} className="md:hidden flex flex-col items-center pt-2 pb-1 px-4">
            <div className="inline-block px-3 py-1 border border-ink/40 dark:border-white/40 font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink dark:text-white mb-3">
              WAITING FOR FIRST DESIGN AWARD 🏆
            </div>
            <h1 className="select-none font-display font-black leading-[0.84] tracking-tighter text-center text-ink dark:text-white uppercase text-[90px]">
              {c.heroHeadline.split(" ")[0] || "HELLO"}
              <br />
              {c.heroHeadline.split(" ").slice(1).join(" ") || "I'M TONY"}
            </h1>
          </div>

          {/* Desktop View: FitText + Shuffle Headline + Sub-bar */}
          <div ref={desktopHeadlineWrapRef} className="hidden md:block">
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

            <div className="relative z-10 flex items-center justify-between mt-2 px-1 sm:px-2">
              <p className="font-display text-xs sm:text-sm md:text-base lg:text-[1.5em] font-bold uppercase tracking-[0.70em] text-ink/90 dark:text-white/90">
                BASED IN {c.heroBasedInLocation}
              </p>
              <p className="font-display text-xs sm:text-sm md:text-base lg:text-[1.5em] font-bold uppercase tracking-[0.70em] text-ink/90 dark:text-white/90">
                {c.heroTagline}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Details: Left Column (Full Width) */}
        <div ref={mobileLeftLabelRef} className="md:hidden w-full px-4 pt-3">
          <div className="flex flex-col gap-1 text-left">
            <p className={`font-display sm:text-xs font-bold uppercase tracking-tight text-ink/90 dark:text-white/90 ${MOBILE_SPEC_FONT_SIZE}`}>
              BASED IN {c.heroBasedInLocation}
            </p>
            <p className={`font-display sm:text-xs font-bold uppercase tracking-tight text-ink/90 dark:text-white/90 ${MOBILE_SPEC_FONT_SIZE}`}>
              {c.heroTagline}
            </p>
          </div>
        </div>

        {/* Mobile Sub-Details: Right Column (Full Width) */}
        <div ref={mobileRightLabelRef} className={`md:hidden w-full px-4 pb-3 ${MOBILE_SPEC_VERTICAL_GAP}`}>
          <div className="flex flex-col gap-1 text-right">
            {heroSpecs.map((spec) => (
              <p
                key={spec}
                className={`font-display sm:text-xs font-bold uppercase tracking-tight text-ink/90 dark:text-white/90 ${MOBILE_SPEC_FONT_SIZE}`}
              >
                {spec}
              </p>
            ))}
          </div>
        </div>

        {/* Desktop Main Row (Left specs + Mascot + Right specs) */}
        <div className="hidden md:grid relative z-0 grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16 my-auto pt-4 pb-2 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8">
          <div
            ref={desktopLeftLabelRef}
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

          <div ref={desktopMascotWrapRef} className="relative z-30 shrink-0">
            <Mascot faceRef={desktopMascotFaceRef} />
          </div>

          <div
            ref={desktopRightLabelRef}
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

        {/* Mobile Mascot Container (Full-width purple block at bottom) */}
        <div className="md:hidden w-full flex-1 flex flex-col justify-end">
          <div
            ref={mobileMascotWrapRef}
            className={`relative z-30 w-full min-h-[320px] sm:min-h-[380px] bg-primary dark:bg-[#5953b0] flex items-center justify-start p-6 rounded-none overflow-hidden ${MOBILE_MASCOT_TOP_GAP}`}
          >
            <Mascot faceRef={mobileMascotFaceRef} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

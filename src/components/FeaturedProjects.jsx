import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import projectTekxera from "../assets/project-tekxera.png";
import projectJewelry from "../assets/project-jewelry.png";
import projectStrategy from "../assets/project-strategy.png";

gsap.registerPlugin(ScrollTrigger);

const PROJECTS = [
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
  },
];

// 47 Rows of background text covering full scroll height with 0 blank space
const BG_ROWS = Array.from(
  { length: 47 },
  () => "FEATURED PROJECTS FEATURED PROJECTS FEATURED PROJECTS"
);

function FeaturedProjects() {
  const sectionRef = useRef(null);
  const bgWallRef = useRef(null);
  const bgRowsRef = useRef([]);
  const cardRefs = useRef([]);

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
          scrub: 1.2, // Smooth responsive scrub
          anticipatePin: 1,
        },
      });

      // -------------------------------------------------------------
      // Initial Setup: Text Wall VISIBLE
      // -------------------------------------------------------------
      bgRowsRef.current.forEach((row) => {
        if (!row) return;
        gsap.set(row, { opacity: 1, y: 0, scale: 1, force3D: true });
      });

      // Position text wall initially shifted UP (-1800px) so it can travel DOWN as user scrolls DOWN
      gsap.set(bgWallRef.current, { y: -1800, force3D: true });

      // Clean card initial offsets (NO card stacking or overlap!)
      // Distances trimmed to just clear the viewport rather than
      // overshooting far past it — less travel means less of each
      // card's transition window is spent fully off-screen, which
      // closes up the empty gap between one project leaving and the
      // next arriving.
      if (cardRefs.current[0]) {
        gsap.set(cardRefs.current[0], { opacity: 1, y: 650, rotate: 0, force3D: true });
      }
      if (cardRefs.current[1]) {
        gsap.set(cardRefs.current[1], { opacity: 1, y: 950, rotate: 0, force3D: true });
      }
      if (cardRefs.current[2]) {
        gsap.set(cardRefs.current[2], { opacity: 1, y: 1250, rotate: 0, force3D: true });
      }

      /* =============================================================
         REVERSE TEXT SCROLL PARALLAX (Text moves DOWN as user scrolls DOWN)
         ============================================================= */
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

      /* =============================================================
         CLEAN INDIVIDUAL CARD PRESENTATIONS (NO Overlap / Stacking)
         ============================================================= */

      // --- Card 1 ---
      if (cardRefs.current[0]) {
        // Enters center stage cleanly (y: 950 -> 0)
        tl.to(
          cardRefs.current[0],
          { y: 0, rotate: 0.8, duration: 0.22, ease: "sine.inOut", force3D: true },
          0.05
        );
        // Exits UP to top (y: 0 -> -1250) and tilts dynamically
        tl.to(
          cardRefs.current[0],
          { y: -850, rotate: -10, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.36
        );
      }

      // --- Card 2 ---
      if (cardRefs.current[1]) {
        // Enters center stage AFTER Card 1 exits (NO overlap) and tilts dynamically (0deg -> 8.6deg)
        tl.to(
          cardRefs.current[1],
          { y: 0, rotate: 8.6, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.36
        );
        // Exits UP to top and tilts to 14deg
        tl.to(
          cardRefs.current[1],
          { y: -850, rotate: 14, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.64
        );
      }

      // --- Card 3 ---
      if (cardRefs.current[2]) {
        // Enters center stage AFTER Card 2 exits (NO overlap) and tilts dynamically (0deg -> -7.8deg)
        tl.to(
          cardRefs.current[2],
          { y: 0, rotate: -7.8, duration: 0.24, ease: "sine.inOut", force3D: true },
          0.64
        );
        // Exits UP to top and tilts to -12deg
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
      className="relative z-10 h-screen w-full overflow-hidden bg-bg text-ink transition-colors duration-300 select-none dark:bg-[#0c0a14] dark:text-white"
    >
      {/* Background Accent Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* -----------------------------------------------------------------
          REVERSE PARALLAX BACKGROUND TEXT WALL
          ----------------------------------------------------------------- */}
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

      {/* -----------------------------------------------------------------
          INDIVIDUAL CLEAN CARD STAGE (Zero Overlap / Stacking)
          ----------------------------------------------------------------- */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-none">
        {PROJECTS.map((project, index) => (
          <div
            key={project.id}
            ref={(el) => (cardRefs.current[index] = el)}
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-auto will-change-transform"
          >
            {/* Exact Card Shell matching Frame 32 reference */}
            <div className="relative w-full max-w-5xl lg:max-w-6xl overflow-hidden rounded-none border-none bg-white shadow-2xl transition-colors duration-300 dark:bg-[#141418]">
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px] lg:min-h-[640px]">

                {/* Left Column: Full-Height Portrait Image */}
                <div className="md:col-span-5 relative overflow-hidden h-72 sm:h-96 md:h-full w-full">
                  <img
                    src={project.image}
                    alt={project.client}
                    className="h-full w-full object-cover rounded-none transition-transform duration-700 hover:scale-105"
                  />
                </div>

                {/* Right Column: Title, Description, Metadata & Bottom-Right Preview Thumbnail Insert */}
                <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-white relative rounded-none transition-colors duration-300 dark:bg-[#141418]">

                  {/* Top Content: Client Header, Title, Description */}
                  <div className="space-y-4 max-w-xl">
                    <div className="text-sm font-normal tracking-normal text-ink/80 dark:text-white/80">
                      {project.client}
                    </div>

                    <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink dark:text-white leading-[1.08] font-display tracking-tight whitespace-pre-line">
                      {project.title}
                    </h3>

                    <p className="text-xs sm:text-sm lg:text-base text-ink/70 dark:text-white/70 leading-relaxed font-sans pt-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Bottom Content: Industry & Role on left, Screenshot Thumbnail Insert on bottom-right */}
                  <div className="mt-8 flex flex-row items-end justify-between gap-4 relative">

                    {/* Industry & Role Info */}
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

                    {/* Bottom-Right Screenshot Preview Insert */}
                    <div className="relative overflow-hidden rounded-none border border-ink/10 dark:border-white/10 bg-bg dark:bg-black/60 shadow-2xl w-48 sm:w-60 lg:w-72 aspect-[16/10] shrink-0 self-end">
                      <img
                        src={project.thumbnailImage}
                        alt={`${project.client} preview`}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 rounded-none"
                      />
                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturedProjects;

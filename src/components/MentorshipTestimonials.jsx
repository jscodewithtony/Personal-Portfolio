import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TestimonialCard from "./TestimonialCard";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { testimonialsQuery } from "../sanity/queries";
import { urlFor } from "../sanity/client";

gsap.registerPlugin(ScrollTrigger);

// Original hardcoded testimonials, reused as the loading/empty
// fallback. The stack animation's per-card stackRot/stackY offsets are
// hand-tuned for exactly these 5 slots, so CMS testimonials are
// clamped to their first 5 (by displayOrder) and mapped onto this same
// position config rather than generating new offsets.
const FALLBACK_TESTIMONIALS = [
  {
    id: "radhika",
    name: "RADHIKA MALHOTRA",
    quote:
      "I booked a portfolio review session with Tony and it was really insightful. He gave me a lot of tips and things to improve upon. I also feel more inspired towards my work approach after the call. He seemed like a dedicated designer knowing a lot about the industry. If you have any confusion in your Design Career, I recommend to get in touch with him.",
    platform: "topmate",
    role: "Product Designer",
    stackRot: -6,
    stackY: 0,
  },
  {
    id: "deepanshu",
    name: "DEEPANSHU",
    quote:
      "Tony has been an incredible support throughout my portfolio revamp and job search journey. His insights, feedback, and guidance made the entire process smoother and more focused. From helping me fine-tune my work to giving strategic advice, Tony truly made a difference. Grateful for all the help!",
    platform: "topmate",
    role: "UI/UX Designer",
    stackRot: 6,
    stackY: 8,
  },
  {
    id: "vaishnavi",
    name: "VAISHNAVI",
    quote:
      "The session was incredibly insightful and exactly what I needed as a beginner in UI/UX. Tony sir explained things so clearly, broke down complex concepts into simple steps, and gave me practical advice that really boosted my confidence. I finally feel like I have a direction to move forward in. Super grateful for such a helpful and supportive session!",
    platform: "topmate",
    role: "Aspiring Designer",
    stackRot: -3,
    stackY: 16,
  },
  {
    id: "neha",
    name: "NEHA BISHT",
    quote:
      "I truly appreciate the way he teaches and ensures every concept is thoroughly explained. His teaching style is clear, engaging, and easy to understand. He patiently addresses all my doubts and makes sure I grasp each topic with confidence. Thank you so much for helping me and making learning such a great experience.",
    platform: "topmate",
    role: "UX Researcher",
    stackRot: 4,
    stackY: 24,
  },
  {
    id: "ankit",
    name: "ANKIT VERMA",
    quote:
      "Tony's mentorship session gave me immense clarity on product design frameworks and portfolio presentation. His actionable feedback helped me refine my design case studies and stand out in interviews!",
    platform: "topmate",
    role: "Product Designer",
    stackRot: -2,
    stackY: 32,
  },
];

const STACK_POSITIONS = FALLBACK_TESTIMONIALS.map(({ stackRot, stackY }) => ({
  stackRot,
  stackY,
}));

function mapSanityTestimonial(doc, index) {
  const pos = STACK_POSITIONS[index] || { stackRot: 0, stackY: index * 8 };
  return {
    id: doc._id,
    name: doc.name,
    quote: doc.quote,
    platform: (doc.sourcePlatform || "topmate").toLowerCase(),
    platformLogo: urlFor(doc.sourceLogo)?.width(80).url(),
    role: doc.role,
    ...pos,
  };
}

function MentorshipTestimonials() {
  const { data: docs, status } = useSanityQuery(testimonialsQuery, {}, []);
  const TESTIMONIALS =
    status === "ready" && docs?.length
      ? docs.slice(0, 5).map(mapSanityTestimonial)
      : FALLBACK_TESTIMONIALS;

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;

    if (!section || !heading) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      gsap.set(heading, { opacity: 1, y: 0, filter: "blur(0px)" });
      cardsRef.current.forEach((card, idx) => {
        if (card) {
          const item = TESTIMONIALS[idx];
          gsap.set(card, {
            opacity: 1,
            x: 0,
            y: item.stackY || 0,
            rotate: item.stackRot || 0,
            scale: 1,
          });
        }
      });
      return;
    }

    const ctx = gsap.context(() => {
      const pinDistance = window.innerHeight * 3.5;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${pinDistance}`,
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // -------------------------------------------------------------
      // Heading Reveal (Smooth ease-snap cubic bezier)
      // -------------------------------------------------------------
      gsap.set(heading, {
        opacity: 0,
        y: 40,
        filter: "blur(12px)",
        force3D: true,
      });

      tl.to(
        heading,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.2,
          ease: "cubic-bezier(0.23, 1, 0.32, 1)",
          force3D: true,
        },
        0.0
      );

      /* =================================================================
         VERSION 1: CONTINUOUS ARC MOTION (COMMENTED OUT AS REQUESTED)
         =================================================================
         cardsRef.current.forEach((card) => {
           if (!card) return;
           gsap.set(card, {
             opacity: 1,
             x: "60vw",
             y: "50vh",
             rotate: 10,
             scale: 0.82,
             force3D: true,
           });
         });

         const startOffset = 0.12;
         const cardSpacing = 0.28;
         const totalDuration = 1.0;

         TESTIMONIALS.forEach((_, idx) => {
           const card = cardsRef.current[idx];
           if (!card) return;

           const cardStart = startOffset + idx * cardSpacing;
           const halfDuration = totalDuration / 2;

           tl.to(
             card,
             { x: "-60vw", rotate: -10, duration: totalDuration, ease: "none", force3D: true },
             cardStart
           );
           tl.to(
             card,
             { y: "-4vh", scale: 1.0, duration: halfDuration, ease: "power1.out", force3D: true },
             cardStart
           );
           tl.to(
             card,
             { y: "50vh", scale: 0.82, duration: halfDuration, ease: "power1.in", force3D: true },
             cardStart + halfDuration
           );
         });
         ================================================================= */

      /* =================================================================
         VERSION 2: STACKED CARD DECK ANIMATION (ACTIVE - Testimoninal-Version-2.mp4)
         Cards fly up from bottom and stack on top of each other in the center
         ================================================================= */
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.set(card, {
          opacity: 0,
          y: "90vh",
          rotate: 12,
          scale: 0.85,
          force3D: true,
        });
      });

      const startOffset = 0.15;
      const stackStep = 0.28;

      TESTIMONIALS.forEach((item, idx) => {
        const card = cardsRef.current[idx];
        if (!card) return;

        const cardStart = startOffset + idx * stackStep;

        tl.to(
          card,
          {
            opacity: 1,
            y: item.stackY || 0,
            rotate: item.stackRot || 0,
            scale: 1.0,
            duration: 0.38,
            ease: "power2.out",
            force3D: true,
          },
          cardStart
        );
      });
    }, section);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
    // Re-runs once `status` flips from "loading" to its resolved value
    // so cardsRef gets fresh gsap.set/timeline targets sized to the
    // real TESTIMONIALS list instead of staying keyed to the fallback
    // array captured on first mount.
  }, [status]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex h-screen w-full overflow-hidden bg-bg transition-colors duration-300 dark:bg-[#0c0a14]"
    >
      {/* Centered Heading Layer */}
      <div className="absolute inset-0 z-10 flex pointer-events-none items-center justify-center px-6 text-center">
        <div ref={headingRef} className="will-change-transform">
          <h2 className="select-none font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink dark:text-white sm:text-6xl md:text-7xl lg:text-8xl xl:text-[110px]">
            FROM THE PEOPLE
            <br />
            I'VE MENTORED
          </h2>
        </div>
      </div>

      {/* Stacked Card Deck Layer (Version 2) */}
      <div className="absolute inset-0 z-20 flex pointer-events-none items-center justify-center">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={t.id}
            ref={(el) => (cardsRef.current[idx] = el)}
            style={{ zIndex: 20 + idx * 5 }}
            className="absolute pointer-events-auto w-[300px] sm:w-[420px] md:w-[460px] lg:w-[500px] will-change-transform"
          >
            <TestimonialCard
              name={t.name}
              quote={t.quote}
              platform={t.platform}
              role={t.role}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default MentorshipTestimonials;

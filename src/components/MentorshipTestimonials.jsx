import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TestimonialCard from "./TestimonialCard";
import DirectionHover from "./DirectionHover";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { testimonialsQuery } from "../sanity/queries";
import { urlFor } from "../sanity/client";
import { useSignalSectionMounted } from "../hooks/useSectionMountRefresh";

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
    platformLogo: urlFor(doc.sourceLogo)?.width(80).auto("format").url(),
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

  useSignalSectionMounted("mentorship-testimonials");

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef([]);
  const buttonRef = useRef(null);

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
      if (buttonRef.current) {
        gsap.set(buttonRef.current, {
          opacity: 1,
          y: 0,
          pointerEvents: "auto",
        });
      }
      return;
    }

    const mm = gsap.matchMedia(section);

    mm.add(
      {
        isMobile: "(max-width: 767px)",
        isDesktop: "(min-width: 768px)",
      },
      (context) => {
      // Touch swipes cover roughly the same physical distance as a
      // desktop wheel-scroll tick, but this pin's distance is computed
      // from window.innerHeight — smaller on mobile — so the same
      // gesture consumed a bigger share of it there, making the scrub
      // feel like it's rushing by faster on phones. A larger mobile
      // multiplier restores a native-feeling pace, animation unchanged.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * (window.innerWidth < 768 ? 5.6 : 3.5)}`,
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

      // Initialize button hidden
      if (buttonRef.current) {
        gsap.set(buttonRef.current, {
          opacity: 0,
          y: 20,
          pointerEvents: "none",
        });

        const lastCardStart = startOffset + (TESTIMONIALS.length - 1) * stackStep;
        tl.to(
          buttonRef.current,
          {
            opacity: 1,
            y: 0,
            pointerEvents: "auto",
            duration: 0.35,
            ease: "power2.out",
          },
          lastCardStart + 0.38
        );
      }
      }
    );

    return () => {
      mm.revert();
    };
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

      {/* Book a Call Button */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none sm:bottom-12 md:bottom-16">
        <a
          href="mailto:Tony2742000@gmail.com"
          ref={buttonRef}
          className="pointer-events-auto select-none px-6 py-4 font-display text-base font-bold uppercase tracking-tight transition-colors sm:px-8 sm:py-5 sm:text-xl bg-primary text-white hover:bg-primary-dark active:bg-primary-active dark:bg-[#114AFC] dark:hover:bg-[#022CDB] dark:active:bg-[#0013B2] shadow-lg"
        >
          <DirectionHover>Book a call with me</DirectionHover>
        </a>
      </div>
    </section>
  );
}

export default MentorshipTestimonials;

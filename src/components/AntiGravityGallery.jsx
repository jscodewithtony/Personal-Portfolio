import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_CARDS = [
  // Hero (Tier 0)
  { id: 1, src: 'https://picsum.photos/600/800?random=1', xPercent: 0, yPercent: 0, z: 0, depth: 0.1, tier: 0 },
  // Tier 1: Inner Orbit
  { id: 2, src: 'https://picsum.photos/600/800?random=2', xPercent: -20, yPercent: -24, z: -50, depth: 0.25, tier: 1 },
  { id: 3, src: 'https://picsum.photos/600/800?random=3', xPercent: 20, yPercent: -24, z: -50, depth: 0.25, tier: 1 },
  { id: 4, src: 'https://picsum.photos/600/800?random=4', xPercent: -20, yPercent: 24, z: -50, depth: 0.25, tier: 1 },
  { id: 5, src: 'https://picsum.photos/600/800?random=5', xPercent: 20, yPercent: 24, z: -50, depth: 0.25, tier: 1 },
  { id: 6, src: 'https://picsum.photos/600/800?random=6', xPercent: 0, yPercent: -36, z: -80, depth: 0.3, tier: 1 },
  { id: 7, src: 'https://picsum.photos/600/800?random=7', xPercent: 0, yPercent: 36, z: -80, depth: 0.3, tier: 1 },
  { id: 20, src: 'https://picsum.photos/600/800?random=20', xPercent: -12, yPercent: -12, z: -40, depth: 0.2, tier: 1 },
  { id: 21, src: 'https://picsum.photos/600/800?random=21', xPercent: 12, yPercent: 12, z: -40, depth: 0.2, tier: 1 },
  // Tier 2: Mid Viewport
  { id: 8, src: 'https://picsum.photos/600/800?random=8', xPercent: -34, yPercent: -12, z: -120, depth: 0.45, tier: 2 },
  { id: 9, src: 'https://picsum.photos/600/800?random=9', xPercent: 34, yPercent: -12, z: -120, depth: 0.45, tier: 2 },
  { id: 10, src: 'https://picsum.photos/600/800?random=10', xPercent: -34, yPercent: 20, z: -140, depth: 0.5, tier: 2 },
  { id: 11, src: 'https://picsum.photos/600/800?random=11', xPercent: 34, yPercent: 20, z: -140, depth: 0.5, tier: 2 },
  { id: 12, src: 'https://picsum.photos/600/800?random=12', xPercent: -18, yPercent: -42, z: -150, depth: 0.4, tier: 2 },
  { id: 13, src: 'https://picsum.photos/600/800?random=13', xPercent: 18, yPercent: -42, z: -150, depth: 0.4, tier: 2 },
  { id: 22, src: 'https://picsum.photos/600/800?random=22', xPercent: -28, yPercent: -32, z: -130, depth: 0.45, tier: 2 },
  { id: 23, src: 'https://picsum.photos/600/800?random=23', xPercent: 28, yPercent: 32, z: -130, depth: 0.45, tier: 2 },
  { id: 24, src: 'https://picsum.photos/600/800?random=24', xPercent: -38, yPercent: 4, z: -110, depth: 0.4, tier: 2 },
  { id: 25, src: 'https://picsum.photos/600/800?random=25', xPercent: 38, yPercent: -4, z: -110, depth: 0.4, tier: 2 },
  // Tier 3: Edge Perimeter
  { id: 14, src: 'https://picsum.photos/600/800?random=14', xPercent: -44, yPercent: -36, z: -220, depth: 0.7, tier: 3 },
  { id: 15, src: 'https://picsum.photos/600/800?random=15', xPercent: 44, yPercent: -36, z: -220, depth: 0.7, tier: 3 },
  { id: 16, src: 'https://picsum.photos/600/800?random=16', xPercent: -44, yPercent: 36, z: -220, depth: 0.7, tier: 3 },
  { id: 17, src: 'https://picsum.photos/600/800?random=17', xPercent: 44, yPercent: 36, z: -220, depth: 0.7, tier: 3 },
  { id: 18, src: 'https://picsum.photos/600/800?random=18', xPercent: -46, yPercent: 2, z: -200, depth: 0.8, tier: 3 },
  { id: 19, src: 'https://picsum.photos/600/800?random=19', xPercent: 46, yPercent: 2, z: -200, depth: 0.8, tier: 3 },
  { id: 26, src: 'https://picsum.photos/600/800?random=26', xPercent: -48, yPercent: -18, z: -240, depth: 0.85, tier: 3 },
  { id: 27, src: 'https://picsum.photos/600/800?random=27', xPercent: 48, yPercent: 18, z: -240, depth: 0.85, tier: 3 },
  { id: 28, src: 'https://picsum.photos/600/800?random=28', xPercent: -10, yPercent: -48, z: -210, depth: 0.75, tier: 3 },
  { id: 29, src: 'https://picsum.photos/600/800?random=29', xPercent: 10, yPercent: 48, z: -210, depth: 0.75, tier: 3 },
];

export const AntiGravityGallery = ({ cards = DEFAULT_CARDS, headline }) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const innerCardsRef = useRef(new Map());

  // Lightbox States
  const [activeIndex, setActiveIndex] = useState(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    setActiveIndex(null);
  };

  // Keyboard navigation & scroll lock
  useEffect(() => {
    if (activeIndex === null) return;
    
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, cards.length]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX.current;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  useGSAP(() => {
    const t0 = gsap.utils.toArray('.card-tier-0');
    const t1 = gsap.utils.toArray('.card-tier-1');
    const t2 = gsap.utils.toArray('.card-tier-2');
    const t3 = gsap.utils.toArray('.card-tier-3');
    const allSecondary = [...t1, ...t2, ...t3];
    const headlineEl = gsap.utils.toArray('.gallery-headline');

    if (allSecondary.length === 0) return;

    // Initial state: collapse secondary cards behind center hero
    gsap.set(allSecondary, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      z: -700,
      scale: 0.2,
      opacity: 0,
    });

    // Make sure center card has initial centered state set explicitly by GSAP (starts visible at scale 1, opacity 1)
    gsap.set(t0, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      opacity: 1,
    });

    // Make sure headline is visible initially
    gsap.set(headlineEl, {
      opacity: 1,
    });

    // Scroll timeline with pinning
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=4000', // Increased scroll height to accommodate the initial shrink/fade + existing stages
        scrub: 1.2,
        pin: true,
        pinSpacing: true,
      },
    });

    const buildTierTween = (elements) => ({
      xPercent: -50,
      yPercent: -50,
      x: (_i, target) => {
        const card = cards.find((c) => String(c.id) === target.dataset.id);
        return ((card?.xPercent || 0) / 100) * window.innerWidth;
      },
      y: (_i, target) => {
        const card = cards.find((c) => String(c.id) === target.dataset.id);
        return ((card?.yPercent || 0) / 100) * window.innerHeight;
      },
      z: (_i, target) => {
        const card = cards.find((c) => String(c.id) === target.dataset.id);
        return card?.z || 0;
      },
      scale: 1,
      opacity: 1,
      stagger: 0.04,
      ease: 'power2.out',
      duration: 1.5,
    });

    // 1. Progress 0 -> ~30%: Center image shrinks (scale 0) and fades out (opacity 0)
    tl.to(t0, {
      scale: 0,
      opacity: 0,
      duration: 1.5,
      ease: 'power1.inOut',
    })
    // 2. Progress ~30% -> ~50%: Center image fades/scales back in (Stage 1), while headline fades out
    .to(t0, {
      scale: 1,
      opacity: 1,
      duration: 1.5,
      ease: 'power1.inOut',
    }, '+=0.4')
    .to(headlineEl, {
      opacity: 0,
      duration: 1.5,
      ease: 'power1.inOut',
    }, '<')
    // 3. Progress ~50% onward: Secondary tiers fan out (Stage 2 and 3) exactly as built
    .to(t1, buildTierTween(t1), '+=0.4')
    .to(t2, buildTierTween(t2), '+=0.4')
    .to(t3, buildTierTween(t3), '+=0.4');

    // Force ScrollTrigger refresh after DOM has settled
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      clearTimeout(refreshTimer);
    };
  }, { scope: containerRef, dependencies: [cards] });

  useEffect(() => {
    // Mouse Parallax Animation Loop
    let mouseX = 0;
    let mouseY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let animationFrameId;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const render = () => {
      smoothX += (mouseX - smoothX) * 0.05;
      smoothY += (mouseY - smoothY) * 0.05;

      if (stageRef.current) {
        stageRef.current.style.transform = `rotateY(${smoothX * 10}deg) rotateX(${-smoothY * 10}deg)`;
      }

      cards.forEach((card) => {
        const inner = innerCardsRef.current.get(card.id);
        if (inner) {
          const shiftX = smoothX * card.depth * 80;
          const shiftY = smoothY * card.depth * 80;
          inner.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove);
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [cards]);

  return (
    <>
      <section 
        ref={containerRef} 
        className="relative h-[100dvh] w-full overflow-hidden [perspective:1200px] flex items-center justify-center"
      >
        {/* Background Headline */}
        {headline && (
          <div className="gallery-headline absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none text-center select-none w-full flex justify-center items-center px-6">
            <h2 className="font-display font-extrabold uppercase leading-[0.95] tracking-tight text-[#fafafa] text-5xl sm:text-8xl md:text-[8vw] lg:text-[9rem]">
              {headline}
            </h2>
          </div>
        )}

        <div ref={stageRef} className="relative w-full h-full [transform-style:preserve-3d] will-change-transform">
          {cards.map((card, index) => {
            const isCenter = card.tier === 0;
            return (
              <div
                key={card.id}
                data-id={card.id}
                onClick={() => setActiveIndex(index)}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] will-change-transform cursor-pointer pointer-events-auto card-tier-${card.tier} ${
                  isCenter
                    ? 'w-[clamp(200px,20vw,300px)] z-30'
                    : card.tier === 1
                    ? 'w-[clamp(150px,15vw,220px)] z-20'
                    : card.tier === 2
                    ? 'w-[clamp(130px,13vw,190px)] z-10'
                    : 'w-[clamp(110px,10vw,160px)] z-5'
                } aspect-[3/4]`}
              >
                <div
                  ref={(el) => {
                    if (el) innerCardsRef.current.set(card.id, el);
                    else innerCardsRef.current.delete(card.id);
                  }}
                  className="w-full h-full overflow-hidden border border-white/10 bg-[#1a1a20] will-change-transform"
                >
                  <img
                    src={card.src}
                    alt={card.alt || `Gallery Image ${card.id}`}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleClose}
            className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md cursor-zoom-out select-none"
          >
            {/* Close Control */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors duration-200 cursor-pointer p-2 z-[10000]"
              aria-label="Close Lightbox"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Arrow Left */}
            <button
              onClick={handlePrev}
              className="absolute left-6 text-white/50 hover:text-white transition-colors duration-200 cursor-pointer p-2 z-[10000] bg-black/20 hover:bg-black/40 border border-white/5 rounded-full"
              aria-label="Previous Image"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Main Lightbox Image */}
            <div 
              className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            >
              <motion.img
                key={activeIndex}
                src={cards[activeIndex].src}
                alt={cards[activeIndex].alt || `Lightbox Image ${cards[activeIndex].id}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="max-w-full max-h-[80vh] object-contain border border-white/10 shadow-2xl select-none"
              />
            </div>

            {/* Navigation Arrow Right */}
            <button
              onClick={handleNext}
              className="absolute right-6 text-white/50 hover:text-white transition-colors duration-200 cursor-pointer p-2 z-[10000] bg-black/20 hover:bg-black/40 border border-white/5 rounded-full"
              aria-label="Next Image"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 font-mono text-sm tracking-widest">
              {activeIndex + 1} / {cards.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AntiGravityGallery;

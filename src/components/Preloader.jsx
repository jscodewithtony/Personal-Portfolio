import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import Mascot from "./Mascot";

// Safety cap in case external resources hang indefinitely
const MAX_WAIT_MS = 10000;

// Controlled pacing for the ease-in-out counter animation
const COUNTER_DURATION = 2.4; // 2.4s gives a comfortable, smooth counting pace
const HOLD_AT_100_MS = 250; // brief pause at 100% so the user perceives completion
const EXIT_DURATION = 0.65; // exit fade duration

function waitForRealLoad() {
  const loadPromise =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  const fontsPromise =
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  return Promise.all([loadPromise, fontsPromise]);
}

function Preloader({ onComplete }) {
  const rootRef = useRef(null);
  const counterRef = useRef(null);
  const counterWrapRef = useRef(null);
  const mascotWrapRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    const rootEl = rootRef.current;
    const counterEl = counterRef.current;
    const counterWrapEl = counterWrapRef.current;
    const mascotWrapEl = mascotWrapRef.current;

    // Hide scrollbar and prevent background scroll while preloader is visible
    document.documentElement.classList.add("preloader-active");
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    let unlocked = false;
    const unlockScroll = () => {
      if (unlocked) return;
      unlocked = true;
      document.documentElement.classList.remove("preloader-active");
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };

    // Fast-path for reduced motion preference: skip animations straight to onComplete
    if (shouldReduceMotion) {
      waitForRealLoad().then(() => {
        unlockScroll();
        if (!cancelled) onComplete();
      });
      return () => {
        cancelled = true;
        unlockScroll();
      };
    }

    const counterObj = { value: 0 };
    let isRealLoaded = false;
    let isCounterDone = false;

    // Option (b): Mascot sinks and dissolves into the page as the blue panel reveals the site
    const triggerExit = () => {
      if (cancelled || !rootEl) return;

      const tl = gsap.timeline({
        onComplete: () => {
          unlockScroll();
          if (!cancelled) onComplete();
        },
      });

      // 1. Counter dismisses quickly so focus shifts to the center mascot
      tl.to(
        counterWrapEl,
        {
          opacity: 0,
          y: -12,
          duration: 0.3,
          ease: "power2.in",
        },
        0
      );

      // 2. Mascot sinks downward and dissolves in place
      if (mascotWrapEl) {
        tl.to(
          mascotWrapEl,
          {
            scale: 0.65,
            y: 16,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power2.inOut",
          },
          0.1
        );
      }

      // 3. Blue panel reveal coordinated directly with the mascot's sink/dissolve
      tl.to(
        rootEl,
        {
          autoAlpha: 0,
          duration: 0.7,
          ease: "power2.inOut",
        },
        0.15
      );
    };

    const handleReadyCheck = () => {
      if (isCounterDone && isRealLoaded) {
        setTimeout(triggerExit, HOLD_AT_100_MS);
      }
    };

    // 1. Smooth ease-in-out counter from 0 to 100
    const counterTween = gsap.to(counterObj, {
      value: 100,
      duration: COUNTER_DURATION,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counterEl) {
          counterEl.textContent = `${Math.round(counterObj.value)}`;
        }
      },
      onComplete: () => {
        isCounterDone = true;
        handleReadyCheck();
      },
    });

    // 2. Real page & font load listener (with safety timeout cap)
    const loadPromise = waitForRealLoad();
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));

    Promise.race([loadPromise, timeoutPromise]).then(() => {
      isRealLoaded = true;
      handleReadyCheck();
    });

    return () => {
      cancelled = true;
      unlockScroll();
      counterTween.kill();
    };
  }, [shouldReduceMotion, onComplete]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-primary dark:bg-[#114AFC]"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div ref={mascotWrapRef} className="flex items-center justify-center pointer-events-none">
        <Mascot hideBody blink />
      </div>
      <div
        ref={counterWrapRef}
        className="absolute bottom-4 right-5 flex items-baseline select-none font-display text-[6rem] font-bold leading-none text-white sm:bottom-8 sm:right-10 sm:text-[9rem] md:text-[10rem] lg:text-[11rem] tracking-tighter"
        aria-hidden="true"
      >
        <span ref={counterRef} className="tabular-nums">
          0
        </span>
        <span className="text-[0.4em] ml-1">
          %
        </span>
      </div>
    </div>
  );
}

export default Preloader;

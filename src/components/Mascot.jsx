import { useEffect, useRef } from "react";
import Eye from "./Eye";
import Eyebrow from "./Eyebrow";
import { createSpring, stepSpring } from "../lib/spring";

// How quickly the pupils saturate toward the socket edge as the cursor
// moves away from the mascot. Smaller = eyes snap to the extreme sooner.
const SATURATION_PX = 110;
const TRAVEL_RATIO = 0.92; // fraction of available socket space pupils may use

// Pupil spring: fairly stiff and well-damped so it reads as responsive
// eye contact rather than a floaty toy.
const PUPIL_STIFFNESS = 210;
const PUPIL_DAMPING = 21;

// Catchlight spring: softer and lazier than the pupil it rides inside,
// giving a layered "secondary motion" feel (a highlight drifting a beat
// behind the iris, as if reflecting a fixed light source).
const CATCHLIGHT_STIFFNESS = 90;
const CATCHLIGHT_DAMPING = 15;
const CATCHLIGHT_COUNTER_DRIFT = -0.22;

// Eyebrow spring: softer still, so the brows "settle" a moment after the
// eyes commit to a direction.
const BROW_STIFFNESS = 130;
const BROW_DAMPING = 18;
const BROW_TILT_MAX_DEG = 9;
const BROW_SHIFT_MAX_PX = 4;
const BROW_LIFT_BASE_PX = -1;
const BROW_LIFT_RANGE_PX = 8;
const BROW_EDGE_LIFT_BONUS_PX = 4;

function Mascot({ faceRef }) {
  const containerRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const leftBrowRef = useRef(null);
  const rightBrowRef = useRef(null);

  const mouse = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  const springs = useRef({
    pupil: { left: { x: createSpring(), y: createSpring() }, right: { x: createSpring(), y: createSpring() } },
    catchlight: { left: { x: createSpring(), y: createSpring() }, right: { x: createSpring(), y: createSpring() } },
    browLift: createSpring(BROW_LIFT_BASE_PX),
    browAngle: createSpring(0),
    browShift: createSpring(0),
  });

  useEffect(() => {
    const isA11y = document.documentElement.classList.contains("a11y-mode");
    const reduceMotion =
      isA11y ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      mouse.current.x = touch.clientX;
      mouse.current.y = touch.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const eyes = [
      { socketRef: leftEyeRef, key: "left" },
      { socketRef: rightEyeRef, key: "right" },
    ];

    const { pupil, catchlight, browLift, browAngle, browShift } =
      springs.current;

    // Cache eye metrics to avoid getBoundingClientRect layout thrashing inside 60fps tick
    const eyeMetrics = new Map();
    const updateMetrics = () => {
      eyes.forEach(({ socketRef, key }) => {
        const socket = socketRef.current;
        if (!socket) return;
        const pupilEl = socket.querySelector(".pupil");
        if (!pupilEl) return;
        const socketRect = socket.getBoundingClientRect();
        const pupilRect = pupilEl.getBoundingClientRect();
        const cx = socketRect.left + socketRect.width / 2;
        const cy = socketRect.top + socketRect.height / 2;
        const maxOffset =
          ((socketRect.width - pupilRect.width) / 2) * TRAVEL_RATIO;
        eyeMetrics.set(key, { socket, pupilEl, catchlightEl: socket.querySelector(".catchlight"), cx, cy, maxOffset });
      });
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    window.addEventListener("scroll", updateMetrics, { passive: true });

    let frameId;
    let lastTime = performance.now();
    let isVisible = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !frameId) {
            lastTime = performance.now();
            updateMetrics();
            frameId = requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const tick = (now) => {
      if (!isVisible) {
        frameId = null;
        return;
      }

      const dt = Math.max((now - lastTime) / 1000, 0);
      lastTime = now;

      // Cursor position normalized to the full viewport, -1 (left/top
      // edge) to +1 (right/bottom edge). This is the shared signal that
      // drives the eyebrows and the "how close to the screen border" lock.
      const normX = Math.min(
        1,
        Math.max(-1, (mouse.current.x / window.innerWidth) * 2 - 1)
      );
      const normY = Math.min(
        1,
        Math.max(-1, (mouse.current.y / window.innerHeight) * 2 - 1)
      );
      const edgeIntensity = Math.min(1, Math.max(Math.abs(normX), Math.abs(normY)));

      eyes.forEach(({ key }) => {
        const metrics = eyeMetrics.get(key);
        if (!metrics) return;
        const { pupilEl, catchlightEl, cx, cy, maxOffset } = metrics;

        const dx = mouse.current.x - cx;
        const dy = mouse.current.y - cy;
        const distance = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx);

        // tanh saturates fast: near-center cursor gives organic partial
        // movement, while any cursor near the viewport edges already
        // reads as ~maxOffset, forcing pupils to the socket boundary.
        const pull = maxOffset * Math.tanh(distance / SATURATION_PX);
        const targetX = Math.cos(angle) * pull;
        const targetY = Math.sin(angle) * pull;

        const pSpring = pupil[key];
        pSpring.x.target = targetX;
        pSpring.y.target = targetY;

        if (reduceMotion) {
          pSpring.x.value = targetX;
          pSpring.y.value = targetY;
        } else {
          stepSpring(pSpring.x, dt, PUPIL_STIFFNESS, PUPIL_DAMPING);
          stepSpring(pSpring.y, dt, PUPIL_STIFFNESS, PUPIL_DAMPING);
        }

        pupilEl.style.transform = `translate(${pSpring.x.value}px, ${pSpring.y.value}px)`;

        if (catchlightEl) {
          const cSpring = catchlight[key];
          cSpring.x.target = pSpring.x.value * CATCHLIGHT_COUNTER_DRIFT;
          cSpring.y.target = pSpring.y.value * CATCHLIGHT_COUNTER_DRIFT;

          if (reduceMotion) {
            cSpring.x.value = cSpring.x.target;
            cSpring.y.value = cSpring.y.target;
          } else {
            stepSpring(cSpring.x, dt, CATCHLIGHT_STIFFNESS, CATCHLIGHT_DAMPING);
            stepSpring(cSpring.y, dt, CATCHLIGHT_STIFFNESS, CATCHLIGHT_DAMPING);
          }

          catchlightEl.style.transform = `translate(${cSpring.x.value}px, ${cSpring.y.value}px)`;
        }
      });

      // Eyebrows: shared target driven off the viewport-normalized vector.
      // Lifting toward the top of the screen and toward either extreme
      // edge reads as widened, "locked-in" eye contact; horizontal tilt
      // and shift track the gaze direction.
      browLift.target =
        BROW_LIFT_BASE_PX -
        BROW_LIFT_RANGE_PX * Math.max(0, -normY) -
        BROW_EDGE_LIFT_BONUS_PX * edgeIntensity;
      browAngle.target = BROW_TILT_MAX_DEG * normX;
      browShift.target = BROW_SHIFT_MAX_PX * normX;

      if (reduceMotion) {
        browLift.value = browLift.target;
        browAngle.value = browAngle.target;
        browShift.value = browShift.target;
      } else {
        stepSpring(browLift, dt, BROW_STIFFNESS, BROW_DAMPING);
        stepSpring(browAngle, dt, BROW_STIFFNESS, BROW_DAMPING);
        stepSpring(browShift, dt, BROW_STIFFNESS, BROW_DAMPING);
      }

      const browTransform = `translateX(calc(-50% + ${browShift.value}px)) translateY(${browLift.value}px) rotate(${browAngle.value}deg)`;
      if (leftBrowRef.current) leftBrowRef.current.style.transform = browTransform;
      if (rightBrowRef.current) rightBrowRef.current.style.transform = browTransform;

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", updateMetrics);
      window.removeEventListener("scroll", updateMetrics);
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Tony's mascot, a friendly purple character whose eyes and eyebrows follow your cursor"
      className="animate-mascot-breathe relative flex h-[80vw] w-[80vw] max-h-[28rem] max-w-[28rem] flex-col items-center justify-center rounded-[2.25rem] bg-primary shadow-[0_25px_60px_-18px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] dark:bg-[#5953b0] dark:shadow-[0_25px_60px_-18px_rgba(89,83,176,0.6)] sm:h-[26rem] sm:w-[26rem] sm:max-h-none sm:max-w-none sm:rounded-[2.5rem] md:h-[28rem] md:w-[28rem] md:rounded-[2.75rem] lg:h-[34rem] lg:w-[34rem] xl:h-[40rem] xl:w-[40rem]"
    >
      <div ref={faceRef} className="flex flex-col items-center">
        <div className="mb-7 flex gap-7 sm:gap-10 md:gap-12 lg:gap-14 xl:gap-16">
          <div className="relative">
            <Eyebrow ref={leftBrowRef} />
            <Eye ref={leftEyeRef} />
          </div>
          <div className="relative">
            <Eyebrow ref={rightBrowRef} />
            <Eye ref={rightEyeRef} />
          </div>
        </div>
        <svg
          width="52"
          height="22"
          viewBox="0 0 52 22"
          fill="none"
          aria-hidden="true"
          className="h-7 w-16 sm:h-9 sm:w-20 md:h-11 md:w-24 lg:h-12 lg:w-28 xl:h-14 xl:w-32"
        >
          <path
            d="M4 4C4 4 15 18 26 18C37 18 48 4 48 4"
            stroke="#0D0C14"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default Mascot;

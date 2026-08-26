import { useRef, useState } from "react";

// Adapted from Originkit's "Direction Hover" Framer preset for this
// project's plain React/Tailwind stack. Wraps a small piece of link/
// button text — no box, background, or padding — and slides in a copy of
// the same text from whichever edge (top/bottom) the cursor entered,
// sliding back out on leave. All three stacked copies inherit color/size
// from whatever wraps it (currentColor + em units) — no accent-color
// swap, just the slide — so it drops into existing nav/button/link
// markup without fighting the caller's own Tailwind classes. Line height
// is a full 1.2em (not cap-height-trimmed like the original preset) so
// descenders in real words ("Say Hi", "Sending", "Instagram") don't get
// clipped by the outer overflow:hidden window.
const LINE_HEIGHT = "1.2em";

function DirectionHover({
  children,
  gap = "0.05em",
  duration = 600,
  className = "",
}) {
  const ref = useRef(null);
  const [dir, setDir] = useState("none");

  const handleEnter = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setDir(e.clientY - rect.top < rect.height / 2 ? "top" : "bottom");
  };
  const handleLeave = () => setDir("none");

  const step = `calc(${LINE_HEIGHT} + ${gap})`;
  const yByDir = {
    none: `calc(-1 * ${step})`,
    top: "0px",
    bottom: `calc(-2 * ${step})`,
  };

  const lineStyle = {
    margin: 0,
    whiteSpace: "nowrap",
    lineHeight: LINE_HEIGHT,
    height: LINE_HEIGHT,
  };

  return (
    <span
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`relative inline-block align-middle overflow-hidden ${className}`}
      style={{ height: LINE_HEIGHT }}
    >
      <span
        className="flex flex-col transition-transform motion-reduce:transition-none"
        style={{
          gap,
          transform: `translateY(${yByDir[dir]})`,
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <span style={lineStyle}>{children}</span>
        <span style={lineStyle}>{children}</span>
        <span style={lineStyle}>{children}</span>
      </span>
    </span>
  );
}

export default DirectionHover;

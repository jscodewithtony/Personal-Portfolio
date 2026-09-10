import { Link } from "react-router-dom";

// Circular rotating-text badge button. SVG textPath drives the curved
// text (real curved glyphs, not a CSS letter-spacing trick); a sibling
// SVG carries the static arrow so it never rotates with the ring;
// the hover fill is a plain absolutely-positioned circle scaling in
// from 0, all CSS-driven — no JS/GSAP needed for any of it.
//
// `text` repeats around the full ring, separated by " • ". Internal
// link only for now (react-router <Link>) — swap to a plain <a> here
// if this is ever pointed at an external URL.
function CircularTextButton({
  to = "/about",
  text = "MORE ABOUT ME",
  repeats = 2,
  className = "",
  ariaLabel,
}) {
  const ringText = Array.from({ length: repeats }, () => `${text} • `).join("");

  return (
    <Link
      to={to}
      aria-label={ariaLabel || text}
      className={`group relative inline-flex h-28 w-28 shrink-0 items-center justify-center sm:h-36 sm:w-36 ${className}`}
    >
      {/* Hover fill — expands from the button's own center, pure CSS */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-0 origin-center scale-0 rounded-full bg-primary transition-transform duration-300 ease-in group-hover:scale-100 dark:bg-[#114AFC]"
      />

      {/* Rotating text ring */}
      <svg
        viewBox="0 0 100 100"
        className="animate-spin-slow absolute inset-0 z-10 h-full w-full"
        style={{ transformOrigin: "50% 50%" }}
        aria-hidden="true"
      >
        <defs>
          <path id="circularTextButtonPath" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
        </defs>
        <text
          className="fill-ink font-display text-[11.5px] font-bold uppercase tracking-[0.05em] transition-colors duration-300 group-hover:fill-white dark:fill-white"
        >
          <textPath href="#circularTextButtonPath" startOffset="0%">
            {ringText}
          </textPath>
        </text>
      </svg>

      {/* Static arrow — rotates independently on hover, doesn't spin with the ring */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-20 h-7 w-7 -rotate-45 text-ink transition-[transform,color] duration-300 ease-out group-hover:rotate-0 group-hover:text-white dark:text-white sm:h-9 sm:w-9"
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </Link>
  );
}

export default CircularTextButton;

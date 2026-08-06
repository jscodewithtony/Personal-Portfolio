import { forwardRef } from "react";

// Base transform includes the -50% recentring so the JS-driven spring
// transform (translateY lift + rotate tilt) can safely overwrite the
// whole `transform` property each frame without losing horizontal
// centering (inline style always wins over the Tailwind translate
// utility, so the centering must live inside the same string).
const Eyebrow = forwardRef(function Eyebrow(_props, ref) {
  return (
    <svg
      ref={ref}
      width="30"
      height="14"
      viewBox="0 0 34 16"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute -top-5 left-1/2 aspect-[17/8] w-11 sm:-top-6 sm:w-14 md:-top-7 md:w-16 lg:-top-9 lg:w-20 xl:-top-10 xl:w-24"
      style={{ transform: "translateX(-50%)" }}
    >
      <path
        d="M2 12Q17 3 32 12"
        stroke="#0D0C14"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
});

export default Eyebrow;

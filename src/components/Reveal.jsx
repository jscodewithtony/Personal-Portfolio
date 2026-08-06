import { useEffect, useRef, useState } from "react";

// Simple scroll-in reveal: fades/blurs/lifts an element the first time
// it enters the viewport. Uses IntersectionObserver rather than a
// scroll listener (no per-frame reflow cost), and collapses instantly
// under prefers-reduced-motion.
function Reveal({ children, className = "", delay = 0, as: Tag = "div", ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,filter,transform] duration-700 ease-snap ${
        visible
          ? "translate-y-0 opacity-100 blur-none"
          : "translate-y-6 opacity-0 blur-md"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Reveal;

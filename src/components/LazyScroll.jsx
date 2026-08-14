import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function LazyScroll({ children, placeholderHeight = "200px", className = "" }) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px 0px 300px 0px", // Trigger 300px before entering viewport
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Refresh GSAP ScrollTrigger to recalculate layout offsets once the children render
  useEffect(() => {
    if (isIntersecting) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isIntersecting]);

  return (
    <div
      ref={ref}
      className={className}
      style={!isIntersecting ? { minHeight: placeholderHeight } : undefined}
    >
      {isIntersecting ? children : null}
    </div>
  );
}

export default LazyScroll;

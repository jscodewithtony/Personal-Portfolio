import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export default function NumberCounter({ value }) {
  const match = String(value).match(/^(\D*)([\d,]+)(\D*)$/);
  
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 50,
  });
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!match) return;
    const number = parseFloat(match[2].replace(/,/g, ""));
    if (isInView) {
      motionValue.set(number);
    }
  }, [isInView, match, motionValue]);

  useEffect(() => {
    if (!match) return;
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(Math.floor(latest));
      }
    });
    return unsubscribe;
  }, [springValue, match]);

  if (!match) {
    return <>{value}</>;
  }

  const prefix = match[1];
  const suffix = match[3];

  return (
    <>
      {prefix}
      <span ref={ref}>0</span>
      {suffix}
    </>
  );
}

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
    const number = parseFloat(match[2].replace(/,/g, ""));
    const format = (n) => Intl.NumberFormat("en-US").format(n);

    // Math.round, not Math.floor: the spring settles asymptotically and
    // its final emitted value is ~19.9997, never exactly 20. floor()
    // turned that into 19 and the spring never emitted again, so every
    // counter on the site stuck one short of its target.
    const unsubscribeChange = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = format(Math.round(latest));
      }
    });
    // Belt-and-braces: snap to the exact target when the spring rests,
    // so the final number never depends on the last interpolated frame
    // (or on this spring staying overdamped if its config changes).
    const unsubscribeComplete = springValue.on("animationComplete", () => {
      if (ref.current) {
        ref.current.textContent = format(number);
      }
    });
    return () => {
      unsubscribeChange();
      unsubscribeComplete();
    };
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

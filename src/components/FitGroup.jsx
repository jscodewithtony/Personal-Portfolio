import { useLayoutEffect, useRef, useState } from "react";

// Like FitText, but for several lines that must share ONE font-size
// rather than each independently filling the width. The size is solved
// from whichever line is naturally widest (e.g. the longest word), so
// shorter lines end up organically narrower at that same size — matching
// a hand-set poster layout instead of every line stretching to 100%.
//
// Purely a sizing component: it doesn't animate anything itself. Pass a
// `rowRef` per line if the caller wants to drive its own entrance/scroll
// animation (e.g. a GSAP timeline) against the row elements directly.
const REFERENCE_PX = 100;

function FitGroup({ lines, className = "", maxFontSize = 640, minFontSize = 32 }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [fontSize, setFontSize] = useState(REFERENCE_PX);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const items = itemRefs.current.filter(Boolean);
    if (!container || !items.length) return;

    const recalc = () => {
      const containerWidth = container.clientWidth;
      let maxNatural = 0;
      items.forEach((el) => {
        el.style.fontSize = `${REFERENCE_PX}px`;
        maxNatural = Math.max(maxNatural, el.scrollWidth);
      });
      if (!containerWidth || !maxNatural) return;

      const scale = containerWidth / maxNatural;
      // +10px on top of the fitted value, per request, still respecting
      // the min/max safety clamps.
      const fitted = REFERENCE_PX * scale * 0.99 + 10;
      const next = Math.min(maxFontSize, Math.max(minFontSize, fitted));

      // Write straight to the DOM too — see FitText for why relying on
      // the React re-render alone isn't safe here.
      items.forEach((el) => {
        el.style.fontSize = `${next}px`;
      });
      setFontSize(next);
    };

    recalc();

    const resizeObserver = new ResizeObserver(recalc);
    resizeObserver.observe(container);
    document.fonts?.ready?.then(recalc);

    return () => resizeObserver.disconnect();
  }, [maxFontSize, minFontSize, lines.length]);

  itemRefs.current = [];

  return (
    <div ref={containerRef} className="w-full">
      {lines.map((line, i) => (
        <div key={line.key ?? i} ref={line.rowRef} className={line.rowClassName}>
          {line.before}
          <span
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={className}
            style={{ fontSize: `${fontSize}px`, whiteSpace: "nowrap" }}
          >
            {line.content}
          </span>
          {line.after}
        </div>
      ))}
    </div>
  );
}

export default FitGroup;

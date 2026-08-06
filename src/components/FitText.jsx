import { useLayoutEffect, useRef, useState } from "react";

// Calibration size used purely to measure the text's natural (unwrapped)
// aspect ratio at a known font-size, so we can solve for whatever size
// makes it exactly span the container's width edge to edge.
const REFERENCE_PX = 100;

function FitText({
  children,
  className = "",
  as: Tag = "span",
  maxFontSize = 480,
  minFontSize = 32,
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(REFERENCE_PX);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const recalc = () => {
      const containerWidth = container.clientWidth;
      text.style.fontSize = `${REFERENCE_PX}px`;
      const naturalWidth = text.scrollWidth;
      if (!containerWidth || !naturalWidth) return;

      const scale = containerWidth / naturalWidth;
      // 0.99 safety margin: sub-pixel rounding shouldn't cause overflow.
      const next = Math.min(
        maxFontSize,
        Math.max(minFontSize, REFERENCE_PX * scale * 0.99)
      );

      // Write the result straight to the DOM, not just to React state.
      // If a later recalc (ResizeObserver's mandatory initial callback,
      // the fonts.ready follow-up) lands on the same value, React bails
      // out of re-rendering — and without this, the temporary
      // REFERENCE_PX measurement mutation above would never get
      // reverted, leaving the text stuck at the reference size.
      text.style.fontSize = `${next}px`;
      setFontSize(next);
    };

    recalc();

    const resizeObserver = new ResizeObserver(recalc);
    resizeObserver.observe(container);

    // Bricolage Grotesque loads async; glyph metrics shift once it's
    // ready, so the fit must be recomputed after the swap.
    document.fonts?.ready?.then(recalc);

    return () => resizeObserver.disconnect();
  }, [maxFontSize, minFontSize]);

  return (
    <div ref={containerRef} className="w-full text-center">
      <Tag
        ref={textRef}
        className={className}
        style={{
          fontSize: `${fontSize}px`,
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </Tag>
    </div>
  );
}

export default FitText;

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import './Shuffle.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Lightweight DOM SplitText fallback in case gsap/SplitText is unavailable
class DOMSplitText {
  constructor(el, options) {
    this.el = el;
    this.chars = [];
    const text = el.textContent || '';
    el.innerHTML = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const span = document.createElement('span');
      span.className = options?.charsClass || 'shuffle-char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      el.appendChild(span);
      this.chars.push(span);
    }
  }

  revert() {
    if (this.el && this.chars.length) {
      const text = this.chars.map(c => (c.textContent === '\u00A0' ? ' ' : c.textContent)).join('');
      this.el.textContent = text;
      this.chars = [];
    }
  }
}

const Shuffle = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true,
  fontSize
}) => {
  const ref = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  const splitRef = useRef(null);
  const wrappersRef = useRef([]);
  const tlRef = useRef(null);
  const playingRef = useRef(false);
  const hoverHandlerRef = useRef(null);

  useEffect(() => {
    if ('fonts' in document) {
      if (document.fonts.status === 'loaded') setFontsLoaded(true);
      else document.fonts.ready.then(() => setFontsLoaded(true));
    } else setFontsLoaded(true);
  }, []);

  const scrollTriggerStart = useMemo(() => {
    const startPct = (1 - threshold) * 100;
    const mm = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || '');
    const mv = mm ? parseFloat(mm[1]) : 0;
    const mu = mm ? mm[2] || 'px' : 'px';
    const sign = mv === 0 ? '' : mv < 0 ? `-=${Math.abs(mv)}${mu}` : `+=${mv}${mu}`;
    return `top ${startPct}%${sign}`;
  }, [threshold, rootMargin]);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setReady(true);
        onShuffleComplete?.();
        return;
      }

      const el = ref.current;
      const start = scrollTriggerStart;

      const removeHover = () => {
        if (hoverHandlerRef.current && ref.current) {
          ref.current.removeEventListener('mouseenter', hoverHandlerRef.current);
          hoverHandlerRef.current = null;
        }
        if (wrappersRef.current.length) {
          wrappersRef.current.forEach(wrap => {
            if (wrap._hoverHandler) {
              wrap.removeEventListener('mouseenter', wrap._hoverHandler);
              wrap._hoverHandler = null;
            }
          });
        }
      };

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        if (wrappersRef.current.length) {
          wrappersRef.current.forEach(wrap => {
            const inner = wrap.firstElementChild;
            const orig = inner?.querySelector('[data-orig="1"]');
            if (orig && wrap.parentNode) wrap.parentNode.replaceChild(orig, wrap);
          });
          wrappersRef.current = [];
        }
        try {
          splitRef.current?.revert();
        } catch {
          /* noop */
        }
        splitRef.current = null;
        playingRef.current = false;
      };

      const build = () => {
        teardown();

        splitRef.current = new DOMSplitText(el, {
          charsClass: 'shuffle-char',
          wordsClass: 'shuffle-word',
          linesClass: 'shuffle-line'
        });

        const chars = splitRef.current.chars || [];
        wrappersRef.current = [];

        const rolls = Math.max(1, Math.floor(shuffleTimes));
        const rand = set => set.charAt(Math.floor(Math.random() * set.length)) || '';

        chars.forEach(ch => {
          const parent = ch.parentElement;
          if (!parent) return;

          // A tight (often heavily negative) letter-spacing inherited from
          // the headline's own styling shrinks *this character's own*
          // measured box — but the glyph's actual ink doesn't shrink with
          // it, so a wide letter like "O" or "Y" visually overhangs past
          // that tightened box. Clipping to it (below) is exactly what
          // cut characters off. Neutralize letter-spacing just for this
          // measurement so `w` reflects the glyph's true rendered width;
          // the tight tracking is re-applied further down as spacing
          // *between* wrapper boxes instead of *inside* one.
          //
          // offsetWidth/offsetHeight, not getBoundingClientRect() — this
          // headline sits inside an ancestor Hero scales down/up via GSAP
          // while pinned-scrolling. getBoundingClientRect() reports the
          // post-transform *visual* size, so a rebuild that happens to
          // run mid-transform (e.g. a resize-triggered remeasure while
          // scrolling back up through the pin) would bake in a scaled,
          // wrong pixel width for these wrapper boxes — surviving even
          // after the scale settles back to 1, which is exactly what
          // produced the overlapping/misaligned characters. offset*
          // reflects true layout size and ignores ancestor transforms
          // entirely, so the measurement is correct regardless of
          // whatever scale the headline happens to be at when this runs.
          const originalLetterSpacing = ch.style.letterSpacing;
          ch.style.letterSpacing = 'normal';
          const w = ch.offsetWidth;
          const h = ch.offsetHeight;
          ch.style.letterSpacing = originalLetterSpacing;
          if (!w) return;

          const computedFs = parseFloat(getComputedStyle(ch).fontSize) || 16;
          const wEm = w / computedFs;
          const hEm = h / computedFs;
          const trackingPx = parseFloat(getComputedStyle(ch).letterSpacing) || 0;
          const trackingEm = trackingPx / computedFs;

          const wrap = document.createElement('span');
          Object.assign(wrap.style, {
            display: 'inline-block',
            overflow: 'hidden',
            width: wEm + 'em',
            height: shuffleDirection === 'up' || shuffleDirection === 'down' ? hEm + 'em' : 'auto',
            verticalAlign: 'bottom',
            marginRight: trackingEm ? `${trackingEm}em` : ''
          });

          const inner = document.createElement('span');
          Object.assign(inner.style, {
            display: 'inline-block',
            whiteSpace: shuffleDirection === 'up' || shuffleDirection === 'down' ? 'normal' : 'nowrap',
            willChange: 'transform'
          });

          parent.insertBefore(wrap, ch);
          wrap.appendChild(inner);

          const firstOrig = ch.cloneNode(true);
          Object.assign(firstOrig.style, {
            display: shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block',
            width: wEm + 'em',
            textAlign: 'center',
            letterSpacing: 'normal'
          });

          ch.setAttribute('data-orig', '1');
          Object.assign(ch.style, {
            display: shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block',
            width: wEm + 'em',
            textAlign: 'center',
            letterSpacing: 'normal'
          });

          inner.appendChild(firstOrig);
          for (let k = 0; k < rolls; k++) {
            const c = ch.cloneNode(true);
            if (scrambleCharset) c.textContent = rand(scrambleCharset);
            Object.assign(c.style, {
              display: shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block',
              letterSpacing: 'normal',
              width: wEm + 'em',
              textAlign: 'center'
            });
            inner.appendChild(c);
          }
          inner.appendChild(ch);

          const steps = rolls + 1;

          if (shuffleDirection === 'right' || shuffleDirection === 'down') {
            const firstCopy = inner.firstElementChild;
            const real = inner.lastElementChild;
            if (real) inner.insertBefore(real, inner.firstChild);
            if (firstCopy) inner.appendChild(firstCopy);
          }

          let startPct = 0;
          let finalPct = 0;

          if (shuffleDirection === 'right' || shuffleDirection === 'down') {
            startPct = -steps * 100;
            finalPct = 0;
          } else {
            startPct = 0;
            finalPct = -steps * 100;
          }

          if (shuffleDirection === 'left' || shuffleDirection === 'right') {
            gsap.set(inner, { xPercent: startPct, yPercent: 0, force3D: true });
            inner.setAttribute('data-start-pct', String(startPct));
            inner.setAttribute('data-final-pct', String(finalPct));
          } else {
            gsap.set(inner, { xPercent: 0, yPercent: startPct, force3D: true });
            inner.setAttribute('data-start-pct', String(startPct));
            inner.setAttribute('data-final-pct', String(finalPct));
          }

          if (colorFrom) inner.style.color = colorFrom;
          wrappersRef.current.push(wrap);
        });
      };

      const inners = () => wrappersRef.current.map(w => w.firstElementChild);

      const randomizeScrambles = () => {
        if (!scrambleCharset) return;
        wrappersRef.current.forEach(w => {
          const strip = w.firstElementChild;
          if (!strip) return;
          const kids = Array.from(strip.children);
          for (let i = 1; i < kids.length - 1; i++) {
            kids[i].textContent = scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length));
          }
        });
      };

      const cleanupToStill = () => {
        wrappersRef.current.forEach(w => {
          const strip = w.firstElementChild;
          if (!strip) return;
          const real = strip.querySelector('[data-orig="1"]');
          if (!real) return;
          strip.replaceChildren(real);
          strip.style.transform = 'none';
          strip.style.willChange = 'auto';
        });
      };

      const play = () => {
        const strips = inners();
        if (!strips.length) return;

        playingRef.current = true;
        const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';

        const tl = gsap.timeline({
          smoothChildTiming: true,
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onRepeat: () => {
            if (scrambleCharset) randomizeScrambles();
            if (isVertical) {
              gsap.set(strips, { yPercent: (i, t) => parseFloat(t.getAttribute('data-start-pct') || '0'), y: 0 });
            } else {
              gsap.set(strips, { xPercent: (i, t) => parseFloat(t.getAttribute('data-start-pct') || '0'), x: 0 });
            }
            onShuffleComplete?.();
          },
          onComplete: () => {
            playingRef.current = false;
            if (!loop) {
              cleanupToStill();
              if (colorTo) gsap.set(strips, { color: colorTo });
              onShuffleComplete?.();
              armHover();
              // A font-size change came in while this was mid-flight
              // (remeasure() saw playingRef.current and deferred rather
              // than cutting the animation off) — apply it silently now
              // that the strips have settled.
              if (pendingRemeasure) {
                pendingRemeasure = false;
                remeasure();
              }
            }
          }
        });

        const addTween = (targets, at) => {
          const vars = {
            duration,
            ease,
            force3D: true,
            stagger: animationMode === 'evenodd' ? stagger : 0
          };
          if (isVertical) {
            vars.yPercent = (i, t) => parseFloat(t.getAttribute('data-final-pct') || '0');
            vars.y = 0;
          } else {
            vars.xPercent = (i, t) => parseFloat(t.getAttribute('data-final-pct') || '0');
            vars.x = 0;
          }

          tl.to(targets, vars, at);

          if (colorFrom && colorTo) {
            tl.to(targets, { color: colorTo, duration, ease }, at);
          }
        };

        if (animationMode === 'evenodd') {
          const odd = strips.filter((_, i) => i % 2 === 1);
          const even = strips.filter((_, i) => i % 2 === 0);
          const oddTotal = duration + Math.max(0, odd.length - 1) * stagger;
          const evenStart = odd.length ? oddTotal * 0.7 : 0;
          if (odd.length) addTween(odd, 0);
          if (even.length) addTween(even, evenStart);
        } else {
          strips.forEach(strip => {
            const d = Math.random() * maxDelay;
            const vars = {
              duration,
              ease,
              force3D: true
            };
            if (isVertical) {
              vars.yPercent = parseFloat(strip.getAttribute('data-final-pct') || '0');
              vars.y = 0;
            } else {
              vars.xPercent = parseFloat(strip.getAttribute('data-final-pct') || '0');
              vars.x = 0;
            }
            tl.to(strip, vars, d);
            if (colorFrom && colorTo) tl.fromTo(strip, { color: colorFrom }, { color: colorTo, duration, ease }, d);
          });
        }

        tlRef.current = tl;
      };

      const armHover = () => {
        if (!triggerOnHover || !ref.current) return;
        removeHover();

        // Attach per-character hover listener so ONLY the specific character being hovered animates
        wrappersRef.current.forEach((wrap) => {
          const strip = wrap.firstElementChild;
          if (!strip) return;

          const origChar = strip.querySelector('[data-orig="1"]') || strip.firstElementChild;

          const handler = (e) => {
            // Stop event propagation so parent handlers are not triggered
            e.stopPropagation();

            if (strip.dataset.animating === 'true') return;
            strip.dataset.animating = 'true';

            const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';
            // Same reasoning as the build-time measurement above: offset*
            // instead of getBoundingClientRect() so a hover mid-scroll
            // (while the ancestor is mid-transform) can't bake in a
            // scaled-wrong travel distance for the roll animation.
            const charW = origChar ? origChar.offsetWidth : 0;
            const charH = origChar ? origChar.offsetHeight : 0;
            const rolls = Math.max(1, Math.floor(shuffleTimes));
            const steps = rolls + 1;

            let startVal = 0;
            let finalVal = 0;

            if (isVertical) {
              startVal = shuffleDirection === 'down' ? -steps * 100 : 0;
              finalVal = shuffleDirection === 'down' ? 0 : -steps * 100;
              gsap.set(strip, { yPercent: startVal, y: 0, force3D: true });
            } else {
              startVal = shuffleDirection === 'right' ? -steps * 100 : 0;
              finalVal = shuffleDirection === 'right' ? 0 : -steps * 100;
              gsap.set(strip, { xPercent: startVal, x: 0, force3D: true });
            }

            const vars = {
              duration,
              ease,
              force3D: true,
              onComplete: () => {
                strip.dataset.animating = 'false';
              }
            };

            if (isVertical) {
              vars.yPercent = finalVal;
              vars.y = 0;
            } else {
              vars.xPercent = finalVal;
              vars.x = 0;
            }

            gsap.to(strip, vars);
          };

          wrap.addEventListener('mouseenter', handler);
          wrap._hoverHandler = handler;
        });
      };

      const create = () => {
        build();
        if (scrambleCharset) randomizeScrambles();
        play();
        armHover();
        setReady(true);
      };

      // Each character wrapper is a fixed-pixel-width box measured off the
      // *current* rendered glyph — but the parent (FitText) can change
      // font-size after this first measurement (its own ResizeObserver,
      // and a follow-up recalc once the webfont finishes loading and
      // real glyph metrics replace the fallback font's). If that happens
      // after build() already ran, the wrappers stay sized for the old,
      // wrong font-size while the actual glyphs render at the new one —
      // the mismatch is exactly what clips a character's edge off.
      // Re-measuring (silently, no replayed animation) whenever this
      // element's own box size changes keeps the wrappers honest.
      let pendingRemeasure = false;

      const remeasure = () => {
        if (playingRef.current) {
          // Mid-animation — rebuilding now would cut it off visibly.
          // Let onComplete (below) pick this up once it settles instead.
          pendingRemeasure = true;
          return;
        }
        teardown();
        build();
        if (scrambleCharset) randomizeScrambles();
        cleanupToStill();
        armHover();
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start,
        once: triggerOnce,
        onEnter: create
      });

      let resizeTimer;
      const ro = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(remeasure, 100);
      });
      ro.observe(el);
      document.fonts?.ready?.then(() => remeasure());

      return () => {
        st.kill();
        ro.disconnect();
        clearTimeout(resizeTimer);
        removeHover();
        teardown();
        setReady(false);
      };
    },
    {
      dependencies: [
        text,
        duration,
        maxDelay,
        ease,
        scrollTriggerStart,
        fontsLoaded,
        shuffleDirection,
        shuffleTimes,
        animationMode,
        loop,
        loopDelay,
        stagger,
        scrambleCharset,
        colorFrom,
        colorTo,
        triggerOnce,
        respectReducedMotion,
        triggerOnHover,
        onShuffleComplete,
        fontSize
      ],
      scope: ref
    }
  );

  const commonStyle = useMemo(() => ({ textAlign, ...style }), [textAlign, style]);

  const classes = useMemo(() => `shuffle-parent ${ready ? 'is-ready' : ''} ${className}`, [ready, className]);

  const Tag = tag || 'p';
  return React.createElement(Tag, { ref, className: classes, style: commonStyle }, text);
};

export default Shuffle;

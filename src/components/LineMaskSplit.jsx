"use client";

import React, { useRef, useEffect, useState } from "react";
import { animate } from "framer-motion";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

export default function LineMaskSplit({
  text = "ANIMATION ON REVEAL",
  tag = "p",
  className = "",
  style = {},
  transition = {
    type: "tween",
    duration: 0.8,
    ease: "easeInOut",
    delay: 0,
  },
  reverse = true,
  scrollTriggerPosition = "bottom",
  splitMode = "lines",
  blurEnabled = true,
  blurIntensity = 20,
  translateXInitial = 0,
  translateYInitial = 100,
}) {
  const maskLines = true;
  const opacityInitial = 0;
  const scaleInitial = 1;
  const rotateInitial = 0;
  const blurInitial = blurEnabled ? blurIntensity : 0;
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const animationControlsRef = useRef([]);
  const hasAnimatedRef = useRef(false);
  const currentLineSplitRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const isFirstResizeRef = useRef(true);
  const scrollElementsRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isOutOfView, setIsOutOfView] = useState(false);
  const TAG = tag;

  const buildTransitionConfig = (transitionValue) => {
    const config = {};
    if (transitionValue?.type === "spring") {
      config.type = "spring";
      if (transitionValue.stiffness !== undefined)
        config.stiffness = transitionValue.stiffness;
      if (transitionValue.damping !== undefined)
        config.damping = transitionValue.damping;
      if (transitionValue.mass !== undefined)
        config.mass = transitionValue.mass;
      if (transitionValue.bounce !== undefined)
        config.bounce = transitionValue.bounce;
      if (transitionValue.restDelta !== undefined)
        config.restDelta = transitionValue.restDelta;
      if (transitionValue.restSpeed !== undefined)
        config.restSpeed = transitionValue.restSpeed;
    } else {
      config.type = transitionValue?.type || "tween";
      if (transitionValue?.duration !== undefined)
        config.duration = transitionValue.duration;
      if (transitionValue?.ease) config.ease = transitionValue.ease;
    }
    return config;
  };

  const setupSplit = (shouldRevert = false) => {
    if (!textRef.current) return null;
    if (shouldRevert && currentLineSplitRef.current) {
      currentLineSplitRef.current.revert();
      currentLineSplitRef.current = null;
    }
    const lineSplit = SplitText.create(textRef.current, { type: "lines" });
    const lines = lineSplit.lines;
    currentLineSplitRef.current = lineSplit;
    lines.forEach((line) => {
      const wrapper = document.createElement("div");
      wrapper.style.overflow = maskLines ? "hidden" : "visible";
      wrapper.style.display = "block";
      line.parentNode?.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    });
    let elements = [];
    if (splitMode === "chars") {
      lines.forEach((line) => {
        const charSplit = SplitText.create(line, {
          type: "chars",
          charsClass: "char",
        });
        elements.push(...charSplit.chars);
      });
    } else if (splitMode === "words") {
      lines.forEach((line) => {
        const wordSplit = SplitText.create(line, {
          type: "words",
          wordsClass: "word",
        });
        elements.push(...wordSplit.words);
      });
    } else {
      elements = lines;
    }
    return { lineSplit, elements };
  };

  const animateElements = (elements, forward = true) => {
    animationControlsRef.current.forEach((control) => control.stop());
    animationControlsRef.current = [];
    const transitionConfig = buildTransitionConfig(transition);
    const baseDelay = transition.delay || 0;
    const isTween = transitionConfig.type !== "spring";
    const SPAN = {
      lines: 0.6,
      words: 0.45,
      chars: 0.3,
    };
    const total =
      typeof transition.duration === "number" ? transition.duration : 0.8;
    const span = SPAN[splitMode] ?? 0.5;
    const count = Math.max(1, elements.length);
    const perDuration = Math.max(0.05, Math.min(total, total * span));
    const stagger =
      count > 1 ? Math.max(0, (total - perDuration) / (count - 1)) : 0;

    elements.forEach((element, index) => {
      const elementDelay = baseDelay + index * stagger;
      const onUpdate = (progress) => {
        const x = translateXInitial * (1 - progress);
        const y = translateYInitial * (1 - progress);
        const rotation = rotateInitial * (1 - progress);
        const scale = scaleInitial + (1 - scaleInitial) * progress;
        const opacity = opacityInitial + (1 - opacityInitial) * progress;
        const blur = blurInitial * (1 - progress);
        element.style.opacity = opacity.toString();
        element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
        element.style.filter = `blur(${blur}px)`;
      };
      if (forward) {
        element.style.opacity = opacityInitial.toString();
        element.style.transform = `translate(${translateXInitial}px, ${translateYInitial}px) rotate(${rotateInitial}deg) scale(${scaleInitial})`;
        element.style.filter = `blur(${blurInitial}px)`;
        const control = animate(0, 1, {
          ...transitionConfig,
          ...(isTween ? { duration: perDuration } : {}),
          delay: elementDelay,
          onUpdate,
        });
        animationControlsRef.current.push(control);
      } else {
        const control = animate(1, 0, {
          ...transitionConfig,
          ...(isTween ? { duration: perDuration } : {}),
          delay: elementDelay,
          onUpdate,
        });
        animationControlsRef.current.push(control);
      }
    });
  };

  useEffect(() => {
    if (!textRef.current) return;
    const result = setupSplit();
    if (!result) return;
    const { elements } = result;
    scrollElementsRef.current = elements;
    elements.forEach((el) => {
      el.style.opacity = opacityInitial.toString();
      el.style.transform = `translate(${translateXInitial}px, ${translateYInitial}px) rotate(${rotateInitial}deg) scale(${scaleInitial})`;
      el.style.filter = `blur(${blurInitial}px)`;
    });
    return () => {
      animationControlsRef.current.forEach((control) => control.stop());
      if (currentLineSplitRef.current) {
        currentLineSplitRef.current.revert();
        currentLineSplitRef.current = null;
      }
      scrollElementsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    text,
    splitMode,
    translateXInitial,
    translateYInitial,
    opacityInitial,
    rotateInitial,
    scaleInitial,
    blurInitial,
  ]);

  useEffect(() => {
    let rafId = null;
    const checkAlignment = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 0;
      const viewportBottom = viewportHeight;
      let elementPoint;
      if (scrollTriggerPosition === "top") {
        elementPoint = rect.top;
      } else if (scrollTriggerPosition === "center") {
        elementPoint = rect.top + rect.height / 2;
      } else {
        elementPoint = rect.bottom;
      }
      const isAligned = elementPoint <= viewportBottom && rect.bottom >= 0;
      setIsInView(isAligned);
      const completelyOutOfView = rect.top > viewportHeight;
      setIsOutOfView(completelyOutOfView);
    };
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkAlignment);
    };
    const handleResize = () => checkAlignment();
    checkAlignment();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollTriggerPosition]);

  const areElementsInInitialState = (elements) => {
    if (elements.length === 0) return false;
    const firstEl = elements[0];
    const currentOpacity = parseFloat(firstEl.style.opacity) || opacityInitial;
    const currentTransform = firstEl.style.transform || "";
    const currentFilter = firstEl.style.filter || "";
    const opacityMatches = Math.abs(currentOpacity - opacityInitial) < 0.01;
    const hasInitialOffset =
      currentTransform.includes(`${translateXInitial}px`) ||
      currentTransform.includes(`${translateYInitial}px`) ||
      (rotateInitial !== 0 &&
        currentTransform.includes(`${rotateInitial}deg`));
    const blurMatches =
      blurInitial === 0
        ? !currentFilter || currentFilter.includes("blur(0px)")
        : currentFilter.includes(`blur(${blurInitial}px)`);
    return opacityMatches && hasInitialOffset && blurMatches;
  };

  useEffect(() => {
    if (!scrollElementsRef.current) return;
    const elements = scrollElementsRef.current;
    animationControlsRef.current.forEach((control) => control.stop());
    animationControlsRef.current = [];
    if (isOutOfView) {
      if (reverse) {
        elements.forEach((el) => {
          el.style.opacity = opacityInitial.toString();
          el.style.transform = `translate(${translateXInitial}px, ${translateYInitial}px) rotate(${rotateInitial}deg) scale(${scaleInitial})`;
          el.style.filter = `blur(${blurInitial}px)`;
        });
        hasAnimatedRef.current = false;
      }
      return;
    }
    if (isInView && areElementsInInitialState(elements)) {
      hasAnimatedRef.current = true;
      animateElements(elements, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isInView,
    isOutOfView,
    reverse,
    translateXInitial,
    translateYInitial,
    opacityInitial,
    rotateInitial,
    scaleInitial,
    blurInitial,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (isFirstResizeRef.current) {
        isFirstResizeRef.current = false;
        return;
      }
      if (!hasAnimatedRef.current) return;
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        if (!hasAnimatedRef.current) return;
        const result = setupSplit(true);
        if (result) {
          scrollElementsRef.current = result.elements;
          result.elements.forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "translate(0px, 0px) rotate(0deg) scale(1)";
            el.style.filter = "blur(0px)";
          });
        }
      }, 50);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // I REMOVED `flex` and `w-full` from the wrapper to ensure it acts completely inline-block/block 
  // like a normal text node would. It will just wrap the <TAG> transparently.
  return (
    <div
      ref={containerRef}
      className={`line-mask-split bg-transparent ${className}`}
      style={style}
    >
      {React.createElement(
        TAG,
        {
          ref: textRef,
          className: "m-0 p-0 text-inherit",
        },
        text
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function NightSky({ style, className }) {
  const canvasRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [isIntersecting, setIsIntersecting] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isIntersecting) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = 0;
    let height = 0;

    const stars = [];
    const numStars = 150;
    let shootingStars = [];

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const spawnShootingStar = () => {
      if (shouldReduceMotion) return;
      const length = Math.random() * 80 + 40;
      shootingStars.push({
        x: Math.random() * width,
        y: Math.random() * (height / 2),
        vx: (Math.random() * 3 + 2) * (Math.random() > 0.5 ? 1 : -1),
        vy: Math.random() * 2 + 3,
        length,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.005,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw static stars
      stars.forEach((star) => {
        let opacity = star.opacity;
        if (!shouldReduceMotion) {
          opacity = star.opacity * (0.5 + 0.5 * Math.sin(star.twinklePhase));
          star.twinklePhase += star.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      });

      // Draw shooting stars
      if (!shouldReduceMotion) {
        if (Math.random() < 0.025) {
          spawnShootingStar();
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const ss = shootingStars[i];
          ss.x += ss.vx;
          ss.y += ss.vy;
          ss.life -= ss.decay;

          if (ss.life <= 0 || ss.x < 0 || ss.x > width || ss.y > height) {
            shootingStars.splice(i, 1);
            continue;
          }

          const speed = Math.hypot(ss.vx, ss.vy);
          const tailX = ss.x - ss.vx * (ss.length / speed);
          const tailY = ss.y - ss.vy * (ss.length / speed);

          const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255, 255, 255, ${ss.life})`);
          grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(tailX, tailY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const rect = entry.contentRect;
        width = rect.width;
        height = rect.height;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        initStars();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    draw();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [isIntersecting, shouldReduceMotion]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

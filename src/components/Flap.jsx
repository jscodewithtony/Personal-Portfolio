import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useThemeTokens } from "../theme/ThemeTokensContext";

const GLYPHS = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};
const GW = 5;
const GH = 7;

function drawNumber(ctx, n, x, y, px) {
  const s = String(Math.max(0, Math.round(n)));
  for (let i = 0; i < s.length; i++) {
    const bits = GLYPHS[s[i]];
    if (!bits) continue;
    const ox = x + i * (GW + 1) * px;
    for (let r = 0; r < GH; r++) {
      for (let c = 0; c < GW; c++) {
        if (bits[r][c] === "1") ctx.fillRect(ox + c * px, y + r * px, px, px);
      }
    }
  }
}

function cssColor(v) {
  const s = (v || "").trim();
  const m = /^var\(\s*--[^,)]*,\s*([\s\S]+)\)\s*$/.exec(s);
  return m ? m[1].trim() : s;
}

function resolveFlapColors({ colors, isDark, themeTokens }) {
  const lightDefaults = {
    background: themeTokens?.backgroundColor || "#F9F9F9",
    ink: themeTokens?.textColor || "#0d0c14",
    accent: themeTokens?.primaryAccent || "#0D38BF",
  };

  const darkDefaults = {
    background: "#0c0a14",
    ink: "#ffffff",
    accent: "#57e0a0",
  };

  const activeDefaults = isDark ? darkDefaults : lightDefaults;

  if (!colors) {
    return activeDefaults;
  }

  // If callers provide per-mode color maps: colors.light and/or colors.dark
  if (colors.light || colors.dark) {
    const modeColors = isDark ? colors.dark : colors.light;
    return {
      background: cssColor(modeColors?.background) || activeDefaults.background,
      ink: cssColor(modeColors?.ink) || activeDefaults.ink,
      accent: cssColor(modeColors?.accent) || activeDefaults.accent,
    };
  }

  // Flat colors object passed (e.g. { background, ink, accent })
  return {
    background: cssColor(colors.background) || activeDefaults.background,
    ink: cssColor(colors.ink) || activeDefaults.ink,
    accent: cssColor(colors.accent) || activeDefaults.accent,
  };
}

const SCROLL = 230;
const SPACING = 360;
const PILLAR_W = 92;
const GRAV = 1750;
const FLAP = 560;
const BIRD_X = 0.28;
const BIRD_R = 15;
const IDLE_RESUME = 3;

function newWorld() {
  return {
    pillars: [],
    y: 0,
    vy: 0,
    score: 0,
    best: 0,
    flash: 0,
    played: false,
    idle: 0,
    started: false,
    layoutKey: "",
  };
}

export default function Flap(props) {
  const {
    colors,
    speed = 37,
    gap = 39,
    gravity = 50,
    style,
  } = props || {};

  const themeTokens = useThemeTokens();
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const activeColors = useMemo(
    () => resolveFlapColors({ colors, isDark, themeTokens }),
    [colors, isDark, themeTokens]
  );

  const ink = activeColors.ink;
  const accent = activeColors.accent;
  const background = activeColors.background;

  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const paintRef = useRef(null);
  const isVisibleRef = useRef(false);

  const worldRef = useRef(newWorld());
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const flapRef = useRef(() => undefined);

  const cfg = useRef({ ink, accent, background, speed, gap, gravity });
  useLayoutEffect(() => {
    cfg.current = { ink, accent, background, speed, gap, gravity };
    paintRef.current?.();
  }, [ink, accent, background, speed, gap, gravity]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const measure = () => {
      const cw = Math.max(1, canvas.clientWidth || host.offsetWidth);
      const ch = Math.max(1, canvas.clientHeight || host.offsetHeight);
      if (cw === w && ch === h) return false;
      w = cw;
      h = ch;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const playH = () => Math.max(120, h);

    const spawn = (x) => ({
      x,
      gap: 0.28 + Math.random() * 0.44,
      scored: false,
    });

    const reset = (world) => {
      world.pillars = [];
      for (let i = 0; i < 6; i++) world.pillars.push(spawn(w + 220 + i * SPACING));
      world.y = playH() / 2;
      world.vy = 0;
      world.best = Math.max(world.best, world.score);
      world.score = 0;
      world.started = false;
    };

    const flap = () => {
      const world = worldRef.current;
      if (!world.started) {
        world.started = true;
        setIsPlaying(true);
      }
      world.vy = -FLAP * Math.sqrt(Math.max(0.1, cfg.current.gravity / 50));
    };
    flapRef.current = flap;

    const step = (dt) => {
      const world = worldRef.current;
      const mul = cfg.current.speed / 50;
      const g = GRAV * (cfg.current.gravity / 50);
      const ph = playH();
      const gapPx = (ph * cfg.current.gap) / 100;
      const bx = w * BIRD_X;

      if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 3);

      // --- IDLE STATE ---
      // Before first Space press (or after collision reset):
      // Bird hovers in place via gentle sine-wave. No pillar movement, no collisions, no scoring.
      if (!world.started) {
        world.y = ph / 2 + Math.sin(performance.now() / 520) * 14;
        world.vy = 0;
        return;
      }

      if (mul <= 0) return;

      world.vy += g * dt;
      world.y += world.vy * dt;

      for (const p of world.pillars) {
        p.x -= SCROLL * mul * dt;
        if (!p.scored && p.x + PILLAR_W < bx) {
          p.scored = true;
          world.score++;
        }
      }

      for (const p of world.pillars) {
        if (p.x + PILLAR_W < -40) {
          let far = 0;
          for (const q of world.pillars) far = Math.max(far, q.x);
          p.x = far + SPACING;
          p.gap = 0.28 + Math.random() * 0.44;
          p.scored = false;
        }
      }

      let dead = world.y < BIRD_R || world.y > ph - BIRD_R;
      if (!dead) {
        for (const p of world.pillars) {
          if (bx + BIRD_R < p.x || bx - BIRD_R > p.x + PILLAR_W) continue;
          const gy = p.gap * ph;
          if (world.y - BIRD_R < gy - gapPx / 2 || world.y + BIRD_R > gy + gapPx / 2) {
            dead = true;
            break;
          }
        }
      }
      if (dead) {
        world.flash = 1;
        reset(world);
        setIsPlaying(false);
        setBestScore(world.best);
      }
    };

    const paint = () => {
      const world = worldRef.current;
      const c = cfg.current;
      const ph = playH();
      const gapPx = (ph * c.gap) / 100;
      const bx = w * BIRD_X;

      ctx.globalAlpha = 1;
      ctx.fillStyle = c.background;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 1;
      ctx.fillStyle = c.ink;
      for (const p of world.pillars) {
        if (p.x > w || p.x + PILLAR_W < 0) continue;
        const gy = p.gap * ph;
        const topH = gy - gapPx / 2;
        const botY = gy + gapPx / 2;
        if (topH > 0) ctx.fillRect(p.x + 1, 0, PILLAR_W - 2, topH);
        if (botY < ph) ctx.fillRect(p.x + 1, botY, PILLAR_W - 2, ph - botY);
      }

      const tilt = Math.max(-0.5, Math.min(1.1, world.vy / 900));
      ctx.save();
      ctx.translate(bx, world.y);
      ctx.rotate(tilt);
      ctx.fillStyle = c.accent;
      ctx.fillRect(-BIRD_R, -BIRD_R, BIRD_R * 2, BIRD_R * 2);
      ctx.fillStyle = c.background;
      ctx.fillRect(BIRD_R * 0.1, -BIRD_R * 0.5, BIRD_R * 0.5, BIRD_R * 0.5);
      ctx.restore();

      if (world.started || world.score > 0) {
        ctx.fillStyle = c.ink;
        ctx.globalAlpha = 0.45;
        drawNumber(ctx, world.score, 28, 28, 3);
        ctx.globalAlpha = 1;
      }

      if (world.flash > 0) {
        ctx.globalAlpha = world.flash * 0.35;
        ctx.fillStyle = c.accent;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    };

    paintRef.current = paint;

    measure();
    reset(worldRef.current);
    paint();

    const ro = new ResizeObserver(() => {
      if (measure()) {
        reset(worldRef.current);
        paint();
      }
    });
    ro.observe(host);

    lastRef.current = 0;
    const frame = (now) => {
      const prev = lastRef.current || now;
      lastRef.current = now;
      const dt = Math.min(0.05, (now - prev) / 1000);
      if (dt > 0) step(dt);
      paint();
      rafRef.current = requestAnimationFrame(frame);
    };

    // --- VISIBILITY GATING (IntersectionObserver pause/resume pattern) ---
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting) {
            if (rafRef.current === null) {
              lastRef.current = 0;
              rafRef.current = requestAnimationFrame(frame);
            }
          } else {
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(host);

    return () => {
      paintRef.current = null;
      ro.disconnect();
      observer.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const onDown = (e) => {
      e.preventDefault();
      flapRef.current();
    };

    const isElementInViewport = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      return rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
    };

    const onKey = (e) => {
      // Space/ArrowUp should ONLY trigger flap/start when section is actually in view.
      // Everywhere else on the page, Space retains normal browser scroll behavior.
      const inView = isVisibleRef.current || isElementInViewport(hostRef.current);
      if (!inView) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        flapRef.current();
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      tabIndex={0}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background,
        touchAction: "none",
        outline: "none",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", cursor: "pointer" }}
      />

      {/* Inactive / Idle Prompt Overlay */}
      <div
        onClick={() => flapRef.current()}
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-300 ${isPlaying
          ? "opacity-0 pointer-events-none scale-95"
          : "opacity-100 pointer-events-auto scale-100 cursor-pointer"
          }`}
      >
        <div className="flex flex-col items-center gap-2.5 px-6 py-4 bg-bg/85 dark:bg-[#0c0a14]/85 backdrop-blur-md border border-ink/10 dark:border-white/15 shadow-2xl select-none text-center">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <kbd className="px-2.5 py-1 text-xs sm:text-sm font-display font-black tracking-widest uppercase bg-ink/10 text-ink dark:bg-white/10 dark:text-white border border-ink/15 dark:border-white/20 shadow-sm animate-pulse">
              SPACE
            </kbd>
            <span className="font-display text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-ink dark:text-white">
              Press Space to Play
            </span>
          </div>

          <div className="flex items-center gap-3">
            {bestScore > 0 && (
              <span className="font-display text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#5F87FF] dark:text-[#8ba7ff]">
                Best: {bestScore}
              </span>
            )}
            <span className="font-display text-[10px] sm:text-[11px] font-medium tracking-wide text-ink/50 dark:text-white/50">
              (or click / tap to flap)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

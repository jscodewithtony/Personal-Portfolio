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
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "11001", "10101", "10011", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
  ":": ["00000", "00100", "00000", "00000", "00000", "00100", "00000"],
};

const GW = 5;
const GH = 7;

function chars(title, fallback) {
  const src = (title || "")
    .toUpperCase()
    .split("")
    .filter((c) => GLYPHS[c]);
  return src.length ? src : fallback.split("");
}

function drawGlyph(ctx, ch, cx, cy, px) {
  const bits = GLYPHS[ch];
  if (!bits) return;
  const x0 = cx - (GW * px) / 2;
  const y0 = cy - (GH * px) / 2;
  for (let r = 0; r < GH; r++)
    for (let c = 0; c < GW; c++)
      if (bits[r][c] === "1") ctx.fillRect(x0 + c * px, y0 + r * px, px + 0.4, px + 0.4);
}

function drawText(ctx, s, x, y, px) {
  const t = String(s).toUpperCase();
  let ox = x;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === " ") {
      ox += 4 * px;
      continue;
    }
    const bits = GLYPHS[ch];
    if (!bits) {
      ox += (GW + 1) * px;
      continue;
    }
    for (let r = 0; r < GH; r++)
      for (let c = 0; c < GW; c++)
        if (bits[r][c] === "1") ctx.fillRect(ox + c * px, y + r * px, px, px);
    ox += (GW + 1) * px;
  }
  return ox - x;
}

function textWidth(s, px) {
  const t = String(s).toUpperCase();
  let w = 0;
  for (const ch of t) w += (ch === " " ? 4 : GW + 1) * px;
  return Math.max(0, w - px);
}

function cssColor(v) {
  const s = (v || "").trim();
  const m = /^var\(\s*--[^,)]*,\s*([\s\S]+)\)\s*$/.exec(s);
  return m ? m[1].trim() : s;
}

function segDist(ax, ay, bx, by, px, py) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function resolveSliceColors({ colors, isDark, themeTokens }) {
  const lightDefaults = {
    background: themeTokens?.backgroundColor || "#F9F9F9",
    ink: themeTokens?.textColor || "#0d0c14",
    accent: "#ff4d5e",
  };

  const darkDefaults = {
    background: "#0c0a14",
    ink: "#ffffff",
    accent: "#ff4d5e",
  };

  const activeDefaults = isDark ? darkDefaults : lightDefaults;

  if (!colors) return activeDefaults;

  if (colors.light || colors.dark) {
    const modeColors = isDark ? colors.dark : colors.light;
    return {
      background: cssColor(modeColors?.background) || activeDefaults.background,
      ink: cssColor(modeColors?.ink) || activeDefaults.ink,
      accent: cssColor(modeColors?.accent) || activeDefaults.accent,
    };
  }

  return {
    background: cssColor(colors.background) || activeDefaults.background,
    ink: cssColor(colors.ink) || activeDefaults.ink,
    accent: cssColor(colors.accent) || activeDefaults.accent,
  };
}

const GRAVITY = 900;
const SPAWN_EVERY = 0.95;
const RAMP = 0.012;
const MAX_RAMP = 2.2;
const TRAIL_LIFE = 0.22;
const COMBO_WINDOW = 0.45;

function newWorld(lives = 3) {
  return {
    pieces: [],
    halves: [],
    trail: [],
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    lives,
    livesSet: lives,
    over: false,
    overT: 0,
    spawnIn: 0,
    started: false,
    flash: 0,
    prevX: 0,
    prevY: 0,
    layoutKey: "",
  };
}

export default function SliceBlade(props) {
  const {
    title = "SLICE",
    colors,
    speed = 50,
    bombs = 14,
    lives = 3,
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
    () => resolveSliceColors({ colors, isDark, themeTokens }),
    [colors, isDark, themeTokens]
  );

  const ink = activeColors.ink;
  const accent = activeColors.accent;
  const background = activeColors.background;

  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const paintRef = useRef(null);
  const isVisibleRef = useRef(false);

  const worldRef = useRef(newWorld(lives));
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const strokeRef = useRef([]);
  const startGameRef = useRef(() => undefined);

  const cfg = useRef({ title, ink, accent, background, speed, bombs, lives });
  useLayoutEffect(() => {
    cfg.current = { title, ink, accent, background, speed, bombs, lives };
    paintRef.current?.();
  }, [title, ink, accent, background, speed, bombs, lives]);

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

    const gpx = () => Math.max(2, Math.min(w, h) * 0.017);
    const radius = () => (gpx() * GH) / 2 + 4;
    const ramp = (world) => Math.min(MAX_RAMP, 1 + RAMP * world.score);

    const throwOne = (world, apex) => {
      const g = GRAVITY;
      const rise = h * apex;
      const vy = -Math.sqrt(2 * g * rise);
      const cs = chars(cfg.current.title, "SLICE");
      const x = w * (0.14 + Math.random() * 0.72);
      world.pieces.push({
        x,
        y: h + radius(),
        vx: (w / 2 - x) * 0.28 + (Math.random() - 0.5) * 90,
        vy,
        rot: Math.random() * 6.283,
        vr: (Math.random() - 0.5) * 3.4,
        ch: cs[Math.floor(Math.random() * cs.length)],
        bomb: Math.random() < Math.max(0, Math.min(60, Math.round(cfg.current.bombs))) / 100,
      });
    };

    const wave = (world) => {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) throwOne(world, 0.5 + Math.random() * 0.24);
    };

    const restart = (world) => {
      world.best = Math.max(world.best, world.score);
      world.score = 0;
      world.combo = 0;
      world.comboT = 0;
      world.lives = Math.max(1, Math.round(cfg.current.lives));
      world.livesSet = world.lives;
      world.over = false;
      world.overT = 0;
      world.pieces = [];
      world.halves = [];
      world.trail = [];
      world.spawnIn = SPAWN_EVERY;

      wave(world);
      for (const p of world.pieces) {
        const t = 0.35 + Math.random() * 0.3;
        p.x += p.vx * t;
        p.y += p.vy * t + 0.5 * GRAVITY * t * t;
        p.vy += GRAVITY * t;
        p.rot += p.vr * t;
      }
    };

    const layout = (world, force) => {
      const key = cfg.current.title + "|" + Math.round(w) + "x" + Math.round(h);
      if (!force && key === world.layoutKey) return;
      world.layoutKey = key;
      if (world.started) {
        restart(world);
      }
    };

    const cut = (world, i, ang) => {
      const p = world.pieces[i];
      world.pieces.splice(i, 1);

      if (p.bomb) {
        world.lives--;
        world.flash = 1;
        world.combo = 0;
        if (world.lives <= 0) {
          world.over = true;
          world.overT = 0;
          world.best = Math.max(world.best, world.score);
        }
        return;
      }

      world.comboT = COMBO_WINDOW;
      world.combo++;
      world.score += world.combo;

      const nx = Math.cos(ang + Math.PI / 2);
      const ny = Math.sin(ang + Math.PI / 2);
      const kick = 150 + Math.random() * 90;
      for (let s = 0; s <= 1; s++) {
        const sign = s === 0 ? -1 : 1;
        world.halves.push({
          x: p.x,
          y: p.y,
          vx: p.vx + nx * kick * sign,
          vy: p.vy + ny * kick * sign,
          rot: p.rot,
          vr: p.vr + sign * 2.2,
          ch: p.ch,
          cutA: ang - p.rot,
          side: s,
          life: 1.4,
        });
      }
    };

    const sweep = (world, ax, ay, bx, by) => {
      const r = radius();
      for (let i = world.pieces.length - 1; i >= 0; i--) {
        const p = world.pieces[i];
        if (segDist(ax, ay, bx, by, p.x, p.y) > r) continue;
        cut(world, i, Math.atan2(by - ay, bx - ax));
      }
    };

    const startGame = () => {
      const world = worldRef.current;
      world.started = true;
      world.over = false;
      restart(world);
      setIsPlaying(true);
    };
    startGameRef.current = startGame;

    const step = (dt) => {
      const world = worldRef.current;
      const mul = cfg.current.speed / 50;

      // --- IDLE STATE ---
      // When not started, frozen in idle. No piece spawning or autonomous motion.
      if (!world.started) {
        return;
      }

      const stroke = strokeRef.current;

      if (mul <= 0) {
        stroke.length = 0;
        return;
      }

      if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 3);
      if (world.comboT > 0) {
        world.comboT -= dt;
        if (world.comboT <= 0) world.combo = 0;
      }

      const wantLives = Math.max(1, Math.round(cfg.current.lives));
      if (wantLives !== world.livesSet) {
        world.livesSet = wantLives;
        if (world.lives > 0) world.lives = wantLives;
      }

      for (let i = 2; i < world.trail.length; i += 3) world.trail[i] += dt;
      while (world.trail.length && world.trail[2] > TRAIL_LIFE) world.trail.splice(0, 3);

      if (world.over) {
        stroke.length = 0;
        world.overT += dt;

        for (const q of world.halves) {
          q.vy += GRAVITY * mul * dt;
          q.x += q.vx * mul * dt;
          q.y += q.vy * mul * dt;
          q.rot += q.vr * mul * dt;
          q.life -= dt;
        }

        // After 1.4s of GAME OVER, transition cleanly back to idle
        if (world.overT > 1.4) {
          world.started = false;
          world.over = false;
          setIsPlaying(false);
          setBestScore(world.best);
        }
        return;
      }

      const g = GRAVITY * mul;
      for (const p of world.pieces) {
        p.vy += g * dt;
        p.x += p.vx * mul * dt;
        p.y += p.vy * mul * dt;
        p.rot += p.vr * mul * dt;
      }
      for (const q of world.halves) {
        q.vy += g * dt;
        q.x += q.vx * mul * dt;
        q.y += q.vy * mul * dt;
        q.rot += q.vr * mul * dt;
        q.life -= dt;
      }

      const r = radius();
      for (let i = world.pieces.length - 1; i >= 0; i--)
        if (world.pieces[i].y - r > h + 40) world.pieces.splice(i, 1);
      for (let i = world.halves.length - 1; i >= 0; i--)
        if (world.halves[i].life <= 0 || world.halves[i].y - r > h + 60) world.halves.splice(i, 1);

      world.spawnIn -= dt * mul * ramp(world);
      if (world.spawnIn <= 0) {
        world.spawnIn = SPAWN_EVERY;
        wave(world);
      }

      // Process user strokes
      for (let i = 0; i + 1 < stroke.length; i += 2) {
        const ax = i === 0 ? world.prevX : stroke[i - 2];
        const ay = i === 0 ? world.prevY : stroke[i - 1];
        const bx = stroke[i];
        const by = stroke[i + 1];
        world.trail.push(bx, by, 0);
        if (ax || ay) sweep(world, ax, ay, bx, by);
        world.prevX = bx;
        world.prevY = by;
      }
      stroke.length = 0;
    };

    const paintHalf = (q, px, col) => {
      const R = px * GH * 1.2;
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.beginPath();
      ctx.save();
      ctx.rotate(q.cutA);
      ctx.rect(-R, q.side === 0 ? -R : 0, 2 * R, R);
      ctx.restore();
      ctx.clip();
      ctx.fillStyle = col;
      drawGlyph(ctx, q.ch, 0, 0, px);
      ctx.restore();
    };

    const paint = () => {
      const world = worldRef.current;
      const c = cfg.current;
      const px = gpx();
      const u = Math.min(w, h);

      ctx.globalAlpha = 1;
      ctx.fillStyle = c.background;
      ctx.fillRect(0, 0, w, h);

      for (const q of world.halves) {
        ctx.globalAlpha = Math.max(0, Math.min(1, q.life / 0.6));
        paintHalf(q, px, c.ink);
      }
      ctx.globalAlpha = 1;

      for (const p of world.pieces) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.bomb) {
          ctx.fillStyle = c.accent;
          ctx.beginPath();
          ctx.arc(0, 0, px * GH * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = c.background;
          drawGlyph(ctx, "X", 0, 0, px * 0.62);
          ctx.strokeStyle = c.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -px * GH * 0.42);
          ctx.lineTo(px * 1.6, -px * GH * 0.72);
          ctx.stroke();
        } else {
          ctx.fillStyle = c.ink;
          drawGlyph(ctx, p.ch, 0, 0, px);
        }
        ctx.restore();
      }

      const tr = world.trail;
      if (tr.length >= 6) {
        ctx.strokeStyle = c.accent;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 3; i < tr.length; i += 3) {
          const age = tr[i + 2];
          const k = Math.max(0, 1 - age / TRAIL_LIFE);
          ctx.globalAlpha = k * 0.9;
          ctx.lineWidth = Math.max(1, u * 0.014 * k);
          ctx.beginPath();
          ctx.moveTo(tr[i - 3], tr[i - 2]);
          ctx.lineTo(tr[i], tr[i + 1]);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
      }

      // HUD: Score & Lives during active gameplay
      if (world.started && !world.over) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = c.ink;
        const scoreStr = String(world.score);
        drawText(ctx, scoreStr, 28, 28, 3);

        if (world.lives > 0) {
          const livesStr = "LIVES " + world.lives;
          const livesW = textWidth(livesStr, 2);
          drawText(ctx, livesStr, w - livesW - 28, 28, 2);
        }

        if (world.combo > 1) {
          const comboStr = world.combo + "X COMBO";
          ctx.fillStyle = c.accent;
          ctx.globalAlpha = 0.8;
          drawText(ctx, comboStr, 28, 56, 2);
        }
        ctx.globalAlpha = 1;
      }

      if (world.over) {
        const bp = Math.max(4, Math.min(10, Math.round(w / 150)));
        const s = "GAME OVER";
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.accent;
        drawText(ctx, s, (w - textWidth(s, bp)) / 2, h / 2 - GH * bp, bp);
        const sub = "SCORE " + world.score;
        const spx = Math.max(2, Math.round(bp / 2));
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = c.ink;
        drawText(ctx, sub, (w - textWidth(sub, spx)) / 2, h / 2 + GH * bp * 0.6, spx);
        ctx.globalAlpha = 1;
      }

      if (world.flash > 0) {
        ctx.globalAlpha = world.flash * 0.32;
        ctx.fillStyle = c.accent;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    };

    paintRef.current = paint;

    measure();
    paint();

    const ro = new ResizeObserver(() => {
      if (measure()) {
        layout(worldRef.current, true);
        paint();
      }
    });
    ro.observe(host);

    lastRef.current = 0;
    const frame = (now) => {
      const prev = lastRef.current || now;
      lastRef.current = now;
      const dt = Math.min(0.05, (now - prev) / 1000);
      layout(worldRef.current, false);
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

    const onMove = (e) => {
      if (!worldRef.current.started || worldRef.current.over) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * canvas.clientWidth;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.clientHeight;
      const q = strokeRef.current;
      q.push(x, y);

      if (q.length > 64) q.splice(0, q.length - 64);
    };

    const onDown = (e) => {
      if (!worldRef.current.started || worldRef.current.over) {
        startGameRef.current();
      }
      onMove(e);
    };

    const onUp = () => {
      worldRef.current.prevX = 0;
      worldRef.current.prevY = 0;
    };

    const isElementInViewport = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      return rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
    };

    const onKey = (e) => {
      const inView = isVisibleRef.current || isElementInViewport(hostRef.current);
      if (!inView) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target?.isContentEditable
      ) {
        return;
      }
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (!worldRef.current.started || worldRef.current.over) {
          startGameRef.current();
        }
      }
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    host.addEventListener("pointerleave", onUp);
    window.addEventListener("keydown", onKey, { passive: false });

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointerleave", onUp);
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
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: isPlaying ? "crosshair" : "pointer",
        }}
      />

      {/* Inactive / Idle Prompt Overlay */}
      <div
        onClick={() => startGameRef.current()}
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
              <span className="font-display text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#ff4d5e] dark:text-[#ff6b7a]">
                Best: {bestScore}
              </span>
            )}
            <span className="font-display text-[10px] sm:text-[11px] font-medium tracking-wide text-ink/50 dark:text-white/50">
              (or click / drag to slice)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function resolveStackColors({ colors, isDark, themeTokens }) {
  const brandLight = themeTokens?.primaryAccent || "#0D38BF";
  const brandDark =
    themeTokens?.primaryAccent && themeTokens.primaryAccent !== "#0D38BF"
      ? themeTokens.primaryAccent
      : "#5F87FF";

  const lightDefaults = {
    background: themeTokens?.backgroundColor || "#F9F9F9",
    ink: themeTokens?.textColor || "#0d0c14",
    accent: brandLight,
  };

  const darkDefaults = {
    background: "#0c0a14",
    ink: "#ffffff",
    accent: brandDark,
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

const BASE_SLIDE = 260;
const SLIDE_RAMP = 0.035;
const MAX_SLIDE_RAMP = 2.6;
const PERFECT_GIVE = 0.05;
const DROP_COOL = 0.16;
const CAM_K = 7;
const CHIP_LIFE = 2.2;

function newWorld() {
  return {
    blocks: [],
    chips: [],
    sliderX: 0,
    sliderW: 0,
    dir: 1,
    cool: 0,
    score: 0,
    best: 0,
    combo: 0,
    over: false,
    overT: 0,
    camY: 0,
    started: false,
    flash: 0,
    layoutKey: "",
  };
}

export default function StackTower(props) {
  const {
    title = "HELLOIMTONY",
    colors,
    speed = 50,
    blockHeight = 34,
    perfect = 6,
    showHud = true,
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
    () => resolveStackColors({ colors, isDark, themeTokens }),
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
  const dropRef = useRef(false);
  const onActionRef = useRef(() => undefined);

  const cfg = useRef({ title, ink, accent, background, speed, blockHeight, perfect, showHud });
  useLayoutEffect(() => {
    cfg.current = { title, ink, accent, background, speed, blockHeight, perfect, showHud };
    paintRef.current?.();
  }, [title, ink, accent, background, speed, blockHeight, perfect, showHud]);

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

    const blockH = () => Math.max(8, Math.round(cfg.current.blockHeight));
    const baseW = () => w * 0.42;
    const groundY = () => h;

    const camTarget = (world) =>
      Math.max(0, world.blocks.length * blockH() - h * 0.45);

    const slideRate = (world) =>
      BASE_SLIDE *
      (cfg.current.speed / 50) *
      Math.min(MAX_SLIDE_RAMP, 1 + SLIDE_RAMP * world.blocks.length);

    const blockTop = (world, i) =>
      groundY() - (i + 1) * blockH() + world.camY;

    const spawnSlider = (world) => {
      const top = world.blocks[world.blocks.length - 1];
      world.sliderW = top.w;

      const fromLeft = world.blocks.length % 2 === 0;
      world.sliderX = fromLeft ? 0 : w - world.sliderW;
      world.dir = fromLeft ? 1 : -1;
    };

    const reset = (world) => {
      const cs = chars(cfg.current.title, "HELLOIMTONY");
      world.blocks = [{ x: (w - baseW()) / 2, w: baseW(), ch: cs[0] }];
      world.chips = [];
      world.combo = 0;
      world.over = false;
      world.overT = 0;
      world.cool = 0;
      world.camY = camTarget(world);
      spawnSlider(world);
    };

    const restart = (world) => {
      world.best = Math.max(world.best, world.score);
      world.score = 0;
      reset(world);
    };

    const layout = (world, force) => {
      const key =
        cfg.current.title + "|" + Math.round(w) + "x" + Math.round(h) + "|" + blockH();
      if (!force && key === world.layoutKey) return;
      world.layoutKey = key;
      if (world.started) {
        restart(world);
      } else {
        reset(world);
      }
    };

    const drop = (world) => {
      const top = world.blocks[world.blocks.length - 1];
      const bh = blockH();
      const left = Math.max(top.x, world.sliderX);
      const right = Math.min(top.x + top.w, world.sliderX + world.sliderW);
      const overlap = right - left;

      if (overlap <= 0) {
        world.chips.push({
          x: world.sliderX,
          y: blockTop(world, world.blocks.length),
          w: world.sliderW,
          vx: world.dir * 90,
          vy: -40,
          rot: 0,
          vr: world.dir * 3,
          gdx: 0,
          ch: world.blocks[world.blocks.length - 1].ch,
          life: CHIP_LIFE,
        });
        world.over = true;
        world.overT = 0;
        world.flash = 1;
        world.best = Math.max(world.best, world.score);
        return;
      }

      const off = world.sliderX - top.x;
      const winPx = (Math.max(1, Math.round(cfg.current.perfect)) / 100) * top.w;
      const isPerfect = Math.abs(off) <= winPx;

      let nx = left;
      let nw = overlap;
      if (isPerfect) {
        nx = top.x;
        nw = Math.min(baseW(), top.w + baseW() * PERFECT_GIVE);
        world.combo++;
        world.score += 1 + world.combo;
      } else {
        world.combo = 0;
        world.score += 1;

        const cutLeft = world.sliderX < top.x;
        const cx = cutLeft ? world.sliderX : right;
        const cw = cutLeft ? top.x - world.sliderX : world.sliderX + world.sliderW - right;
        if (cw > 0.5)
          world.chips.push({
            x: cx,
            y: blockTop(world, world.blocks.length),
            w: cw,
            vx: (cutLeft ? -1 : 1) * (60 + Math.random() * 60),
            vy: -30,
            rot: 0,
            vr: (cutLeft ? -1 : 1) * (2 + Math.random() * 2),
            gdx: world.sliderX + world.sliderW / 2 - (cx + cw / 2),
            ch: world.blocks[world.blocks.length - 1].ch,
            life: CHIP_LIFE,
          });
      }

      const cs = chars(cfg.current.title, "HELLOIMTONY");
      world.blocks.push({ x: nx, w: nw, ch: cs[world.blocks.length % cs.length] });
      void bh;
      spawnSlider(world);
      world.cool = DROP_COOL;
    };

    const onAction = () => {
      const world = worldRef.current;
      if (!world.started || world.over) {
        restart(world);
        world.started = true;
        world.over = false;
        setIsPlaying(true);
        return;
      }

      if (world.cool <= 0) {
        drop(world);
      }
    };
    onActionRef.current = onAction;

    const step = (dt) => {
      const world = worldRef.current;
      const mul = cfg.current.speed / 50;

      // --- IDLE STATE ---
      if (!world.started) {
        return;
      }

      if (mul <= 0) return;

      if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 3);
      if (world.cool > 0) world.cool = Math.max(0, world.cool - dt);

      for (const c of world.chips) {
        c.vy += 1500 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.vr * dt;
        c.life -= dt;
      }
      for (let i = world.chips.length - 1; i >= 0; i--)
        if (world.chips[i].life <= 0 || world.chips[i].y > h + 200) world.chips.splice(i, 1);

      if (world.over) {
        world.overT += dt;
        if (world.overT > 1.4) {
          world.started = false;
          world.over = false;
          setIsPlaying(false);
          setBestScore(world.best);
        }
        return;
      }

      const rate = slideRate(world);
      world.sliderX += world.dir * rate * dt;
      if (world.sliderX <= 0) {
        world.sliderX = 0;
        world.dir = 1;
      } else if (world.sliderX + world.sliderW >= w) {
        world.sliderX = w - world.sliderW;
        world.dir = -1;
      }

      const ct = camTarget(world);
      world.camY += (ct - world.camY) * Math.min(1, CAM_K * dt);

      if (dropRef.current && world.cool <= 0) {
        dropRef.current = false;
        drop(world);
      }
    };

    const paint = () => {
      const world = worldRef.current;
      const c = cfg.current;
      const bh = blockH();
      const gpx = Math.max(1, (bh * 0.62) / GH);

      ctx.globalAlpha = 1;
      ctx.fillStyle = c.background;
      ctx.fillRect(0, 0, w, h);

      const plate = (x, y, bw, ch, fill) => {
        if (y > h || y + bh < 0 || bw <= 0.5) return;
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, bw, bh - 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, bw, bh - 1);
        ctx.clip();
        ctx.fillStyle = c.background;
        drawGlyph(ctx, ch, x + bw / 2, y + bh / 2, gpx);
        ctx.restore();
      };

      for (let i = 0; i < world.blocks.length; i++) {
        const b = world.blocks[i];
        const depth = world.blocks.length - 1 - i;
        ctx.globalAlpha = Math.max(0.28, 1 - depth * 0.06);
        plate(b.x, blockTop(world, i), b.w, b.ch, c.ink);
      }
      ctx.globalAlpha = 1;

      for (const ch of world.chips) {
        const a = Math.max(0, Math.min(1, ch.life / 0.6));
        ctx.globalAlpha = a * 0.85;
        ctx.save();
        ctx.translate(ch.x + ch.w / 2, ch.y + bh / 2);
        ctx.rotate(ch.rot);
        ctx.fillStyle = c.ink;
        ctx.fillRect(-ch.w / 2, -bh / 2, ch.w, bh - 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(-ch.w / 2, -bh / 2, ch.w, bh - 1);
        ctx.clip();
        ctx.fillStyle = c.background;
        drawGlyph(ctx, ch.ch, ch.gdx, 0, gpx);
        ctx.restore();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Draw active sliding block only when game has started and not over
      if (world.started && !world.over) {
        const cs = chars(c.title, "HELLOIMTONY");
        plate(
          world.sliderX,
          blockTop(world, world.blocks.length),
          world.sliderW,
          cs[world.blocks.length % cs.length],
          c.accent
        );
      }

      if (c.showHud && world.started && !world.over) {
        const px = 3;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = c.ink;
        drawText(ctx, String(world.score), 28, 28, px);
        const bestStr = "BEST " + Math.max(world.best, world.score);
        drawText(ctx, bestStr, w - 28 - textWidth(bestStr, px), 28, px);
        ctx.globalAlpha = 1;
        if (world.combo > 1) {
          ctx.fillStyle = c.accent;
          drawText(ctx, "X" + world.combo, 28, 28 + GH * px + 10, px);
        }
      }

      if (world.over) {
        const px = Math.max(4, Math.min(10, Math.round(w / 150)));
        const s = "GAME OVER";
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.accent;
        drawText(ctx, s, (w - textWidth(s, px)) / 2, h / 2 - GH * px, px);
        const sub = "HEIGHT " + world.score;
        const spx = Math.max(2, Math.round(px / 2));
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = c.ink;
        drawText(ctx, sub, (w - textWidth(sub, spx)) / 2, h / 2 + GH * px * 0.6, spx);
        ctx.globalAlpha = 1;
      }

      if (world.flash > 0) {
        ctx.globalAlpha = world.flash * 0.3;
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

    const onDown = (e) => {
      e.preventDefault();
      onActionRef.current();
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
      if (
        e.code === "Space" ||
        e.key === " " ||
        e.code === "Enter" ||
        e.key === "Enter" ||
        e.code === "ArrowDown" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
        onActionRef.current();
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
        onClick={() => onActionRef.current()}
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
              <span className="font-display text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-primary dark:text-[#5F87FF]">
                Best: {bestScore}
              </span>
            )}
            <span className="font-display text-[10px] sm:text-[11px] font-medium tracking-wide text-ink/50 dark:text-white/50">
              (or click / tap to drop)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

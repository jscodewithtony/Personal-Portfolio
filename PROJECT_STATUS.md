# Portfolio Project Status & Agent Handoff Guide

## 🚨 Standing Rules & Protection Directives
1. **Hero & Mascot Section Protection**: `src/components/Hero.jsx` and `src/components/Mascot.jsx` are flagged as **sensitive**. Do not modify their layout or GSAP scale-merge timeline without explicit user instructions.
2. **Hero Headline Shuffle Animation**: The headline text `"I'M TONY"` in `Hero.jsx` uses the `<Shuffle />` component ([Shuffle.jsx](file:///g:/Portfolio%20build/src/components/Shuffle.jsx)) with **per-character hover isolation** (hovering letter 'T' only shuffles 'T').
3. **Featured Projects Hover Rule**: Hover-to-expand card logic was explicitly removed per user preference; scroll scrub drives 3D depth tunnel card motion.

---

## 🎨 Completed Architecture & Component Overview

### 1. Header ([Header.jsx](file:///g:/Portfolio%20build/src/components/Header.jsx))
- Minimalist fixed header with `I'M TONY` brand logo and `MENU +` button anchoring the overlay navigation.

### 2. Hero ([Hero.jsx](file:///g:/Portfolio%20build/src/components/Hero.jsx))
- Background: `bg-bg` (`#f1f0fa`) with subtle 72px grid line overlay.
- Features `<Shuffle text="I'M TONY" tag="h1" />` headline animation.
- GSAP ScrollTrigger timeline pins hero while mascot expands to merge into Statement section.

### 3. Statement ([Statement.jsx](file:///g:/Portfolio%20build/src/components/Statement.jsx))
- Background: `bg-primary` (`#5953b0`) with subtle 72px grid line overlay.
- Features responsive text fit (`FitGroup`) and sliding asides ("I care about / 2px More than is / Reasonable...").

### 4. Featured Projects ([FeaturedProjects.jsx](file:///g:/Portfolio%20build/src/components/FeaturedProjects.jsx))
- Background: Sleek dark canvas (`bg-[#0c0a14]`) with subtle 72px grid line overlay.
- **3D Z-Depth Tunnel Scroll Animation**: GSAP ScrollTrigger scrub timeline moves project cards along the Z-axis (`z: -800px` → `z: 0px` → `z: +450px`).
- **Frameless Transparent Card Design**: `bg-transparent` with rounded mockup image (`rounded-xl`), project title bottom-left, subtext bottom-right. Zero card container fills or outer borders.
- Floating trailing custom cursor (`VIEW PROJECT ↗`).

### 5. Stats ([Stats.jsx](file:///g:/Portfolio%20build/src/components/Stats.jsx))
- Background: Dark canvas (`#0c0a14`) with subtle 72px grid line overlay.
- Real WebGL **Three.js** canvas with antialiased renderer, soft shadows (`PCFSoftShadowMap`), ambient light, directional shadow light, and hot-pink point light.
- 6x4 matrix of 3D box meshes extruding in Z-space, 4 sweeping stat cards, centerpiece card, and revealing lime-green CTA button ("EXPLORE CASE STUDIES →").

### 6. Shuffle Component ([Shuffle.jsx](file:///g:/Portfolio%20build/src/components/Shuffle.jsx) & [Shuffle.css](file:///g:/Portfolio%20build/src/components/Shuffle.css))
- React Bits open-source component with built-in DOM Splitter fallback.
- Per-character mouseenter event listeners for isolated single-letter shuffle.

---

## 🐛 Known Issues (logged, not fixed)

- **Small layout shift on `/about`, source `<main>`, cause unidentified — logged 2026-08-31, not worth fixing now.** `PerformanceObserver` (`layout-shift`, buffered) measures **CLS ≈ 0.0024** on `/about` under throttled network — well under Google's "good" (<0.1) threshold, low priority. The shifting element is `<main>` (the hero headline + marquee area), a 4px top-edge move. **Originally misattributed to `GlobalFontLoader` swapping `--font-display` to a broken "Albert Sans" CMS font URL** (a real bug independently worth fixing — the stored `customFontUrl` is a Google Fonts specimen page, not a stylesheet, so it silently never loads real Albert Sans) — that attribution is **corrected/retracted**: re-tested once with the font swap unable to apply (CORS-blocked, confirmed via `--font-display` reading the old value) and once with it genuinely applied (CORS bypassed, confirmed via `--font-display: 'Albert Sans', ...`), and both runs produced the **identical shift value to 15 decimal places** (`0.002438271604938272`). Identical to that precision across a run where the blamed cause couldn't have fired proves it isn't the cause. The true trigger is still unidentified — not re-diagnosed, since it's cosmetically negligible (4px, "good" CLS) and wasn't the ask. The Albert Sans / broken font URL issue itself is still real and still worth fixing on its own, just not as a fix for this shift.

- **`WorkIndex.jsx` custom cursor follower never animates, and its IntersectionObserver gating never attaches — pre-existing, root cause found 2026-08-31.** The `/work` page's circular cursor-follower (`followerRef`, mirrors the same pattern in `FeaturedProjects.jsx`) never updates its `style.transform`/`style.opacity` at all, on first load, before any scrolling, confirmed with a `MutationObserver` during a real 3-second mouse sweep across a hovered project row with real Sanity data loaded. **Root cause, confirmed via direct instrumentation (temporary, reverted `console`-style log inside the effect):** the effect that owns this loop (and, as of the same day, its IntersectionObserver visibility-gating) has an empty `[]` dependency array, so it runs exactly once, immediately after the component's very first commit. `useSanityQuery` always initializes to `status: "loading"` synchronously, and `WorkIndex`'s own render has `if (status === "loading" || status === "empty") return null;` — so that very first commit never has a `<section ref={sectionRef}>` in the tree at all. The effect captures `sectionRef.current` as `null`, bails immediately (`if (!section) return`), and — because it never re-runs — stays permanently inert even once the section renders for real on the next commit (whether data ends up "ready" or "error", both are commits *after* the always-null first one). Nothing downstream of that guard — the mousemove listener, the rAF loop, the IntersectionObserver — ever executes. `FeaturedProjects.jsx` and `AntiGravityGallery.jsx` don't share this hazard: neither has a "loading/empty → return `null`" early return before their own effect's target ref renders, so their equivalent loops (including the same-day IntersectionObserver gating) mount correctly on the first commit. Not fixed here (out of scope) — the fix is standard: swap the `[]` deps for something that flips once real content mounts (e.g. `[status]`, guarded to only (re)attach once), or move the section-presence check to run per-render via a callback ref instead of a one-shot effect.

## 🛠️ Verification & Development Commands

- **Linter**: `npx oxlint` (0 errors, 0 warnings)
- **Production Build**: `npm run build` (Clean Vite build in ~400ms)
- **Dev Server**: `npm run dev` (`http://localhost:5173`)

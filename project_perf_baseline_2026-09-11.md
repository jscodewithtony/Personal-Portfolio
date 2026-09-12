# Performance Baseline & Audit Log

**Reference Date:** 2026-09-11 (Initial Phase 11.7/11.8 Optimization)  
**Latest Update & Audit Date:** 2026-09-12 (Phase 11.10 Theme-Swap & Preloader Verification)  
**Environment:** Windows 10/11 x64, Chromium Headless 1440x900, 4x CPU Throttling, Vite 6 Production Build (`npm run build`).

---

## 1. Executive Summary & Comparison

| Metric / Area | Baseline (2026-09-11 / Phase 11.8) | Current Trace (2026-09-12 / Phase 11.10) | Delta / Status |
| :--- | :--- | :--- | :--- |
| **Stats Renderer MSAA** | `antialias: false` (~18% frame-time boost) | `antialias: false` (confirmed via CDP context hook) | **Holding** (0 regressions) |
| **Homepage Scroll FPS (4x CPU)** | ~35–38 fps average | **36.6 fps** (avg frame: 27.35 ms) | **Stable** |
| **Homepage p95 Frame Time** | ~52–56 ms | **53.40 ms** (p99: 66.70 ms) | **Stable** |
| **About Page Scroll FPS (4x CPU)** | ~58–60 fps average | **59.7 fps** (avg frame: 16.74 ms) | **Stable** (~60fps locked) |
| **About Page p95 Frame Time** | ~25–28 ms | **26.70 ms** (p99: 40.10 ms) | **Stable** |
| **About Page CLS** | 0.0024 (idle at rest) | **0.0987** (full scroll scrub) | **Good** (< 0.1 threshold) |
| **Initial Bundle (Entry JS+CSS)** | ~490 KB JS / 82 KB CSS | **499.22 KB JS / 82.80 KB CSS** (187.94 KB gzip) | **+9.2 KB JS** (Preloader + Mascot) |
| **Homepage Image Upfront Payload** | ~140 KB | **321.31 KB** | **+181 KB** (Light+Dark portrait preloaded) |
| **About Page Image Upfront Payload** | ~400 KB | **904.60 KB** | **+504 KB** (4 hidden preloaded images) |

---

## 2. Bundle Analysis by Route & Chunk

### 2.1 Entry Bundle (Preloaded on all routes via `index.html`)
- **Total Entry Payload:** 582.02 KB uncompressed (187.94 KB gzip)
  - `index-CWI573Xt.js`: 380.91 KB (127.08 KB gzip) — Includes core React, Sanity client queries, and `Preloader.jsx` with `Mascot.jsx`.
  - `gsap-DWxn8li7.js`: 67.96 KB (26.41 KB gzip) — Core GSAP and ScrollTrigger engine.
  - `index-Cv1_HOid.css`: 82.80 KB (14.77 KB gzip) — Tailwind and typography styles.
  - `request-*.js`, `Observable-*.js`, `Subject-*.js`: ~40 KB (RxJS and Sanity client transport).

### 2.2 Route Chunks
- **Homepage (`/`)**:
  - `HomePage-*.js`: 25.58 KB (7.13 KB gzip).
  - Deferred sections: `Stats` (521.9 KB), `FeaturedProjects` (18.2 KB), `Statement` (12.4 KB), `MentorshipTestimonials` (10.5 KB).
- **About Page (`/about`)**:
  - `AboutPage-DDglxGWQ.js`: 52.48 KB (18.65 KB gzip). Contains both `CloudSky.jsx` (14.2 KB) and `NightSky.jsx` (4.5 KB).
  - Deferred galleries: `CircularGallery-B6Nzw-nF.js` (7.49 KB) or `AntiGravityGallery-CHvsai6s.js` (9.50 KB).
- **Admin Studio (`/admin`)**:
  - Code-split cleanly (`AdminStudio-*.js` 388 KB, `WorkspaceLoader` 1.12 MB, `sanity` 617 KB). Zero Studio leakage into public routes.

---

## 3. Image Sizing & Preload Audit

### 3.1 Upfront Hidden Preloads on `/about` (Lines 840–845)
- Hidden DOM wrapper `<div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden">` preloads:
  1. `Resume-background.webp`: **333.07 KB**
  2. `Resume-background-darkv1.webp`: **161.33 KB**
  3. Light portrait (`portraitLightUrl`): **76.71 KB** (Sanity CDN)
  4. Dark portrait (`portraitDarkUrl`): **105.08 KB** (Sanity CDN)
  5. Static fallback portrait (`portrait.webp`): **139.52 KB**
  6. Narrative image (`narrativeImageOne`): **88.88 KB**
- **Total Initial Image Payload on `/about`:** **904.60 KB** across 6 requests on initial render, regardless of active theme.

### 3.2 Upfront Hidden Preloads on Homepage (Lines 326–330 of `About.jsx`)
- Hidden DOM wrapper `<div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden">` preloads:
  1. Light portrait (`lightPortraitUrl`): **76.71 KB** (Sanity CDN)
  2. Dark portrait (`darkPortraitUrl`): **105.08 KB** (Sanity CDN)
  3. Static fallback (`about-portrait.webp`): **139.52 KB**
- **Total Initial Image Payload for About Section on `/`:** **321.31 KB** downloaded on initial page load, before the user scrolls past Hero.

### 3.3 Sanity Asset Sizing
- Both `About.jsx` and `AboutPage.jsx` request `.width(1200).auto("format")` for portrait assets.
- Rendered box size: `max-w-[26rem]` (416px width). On a 2x retina display, maximum required width is 832px. Requesting 1200px represents ~2.1x over-fetching in raw pixel area.

---

## 4. Runtime Lifecycle & Observer Verification Matrix

| Component | Loop / Mechanism | Off-Screen Pause Gated? | Unmount Cleanup Verified? | Empirical Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **`Stats.jsx`** | Three.js WebGL rAF | **Yes** (`IntersectionObserver` threshold: 0.01 pauses `animationFrameId`) | **Yes** (Disposes geometries, materials, renderer, reverts `mm`, removes canvas) | CDP context hook confirmed `antialias: false`; observer disconnect verified. |
| **`CircularGallery.jsx`** | Card lerp / wheel rAF | **Yes** (`IntersectionObserver` threshold: 0.01 cancels rAF) | **Yes** (Disconnects observer, cancels rAF, removes wheel/touch listeners) | Verified in lines 324–344 and 387–399. |
| **`CloudSky.jsx`** | WebGL shader rAF | **Yes** (`IntersectionObserver` threshold: 0.01 sets `isVisible = false`, bails rAF) | **Yes** (Disconnects observer, cancels rAF, removes pointer listeners) | Verified in lines 378–400. Context created with `{ antialias: false, depth: false }`. |
| **`NightSky.jsx`** | 2D Canvas star rAF | **Yes** (`IntersectionObserver` threshold: 0 sets `isIntersecting = false`, cancels rAF) | **Yes** (Disconnects observer, cancels rAF, disconnects `ResizeObserver`) | Verified in lines 10–21 and 138–142. |
| **`AboutPortraitReveal` (/about)** | CSS clip-path transition | **N/A** (No continuous rAF; pure CSS transition) | **Yes** (Disconnects `IntersectionObserver` immediately on reveal or unmount, clears timer) | Verified in lines 541–559. |
| **Homepage About Portrait (`About.jsx`)** | GSAP ScrollTrigger clip wipe | **Yes** (Scrubbed strictly with scroll position, no idle rAF loop) | **Yes** (`mm.revert()` tears down ScrollTrigger, timeline, and inline styles) | Verified in lines 160–231. |
| **`Preloader.jsx`** | GSAP 0-100 counter tween | **N/A** (One-time sequence, duration 2.4s) | **Yes** (`counterTween.kill()`, `unlockScroll()` restores body overflow) | Verified in lines 151–156. Unmounts completely on completion. |
| **`Mascot.jsx`** | Spring physics rAF | **Yes** (`IntersectionObserver` threshold: 0.05 cancels rAF) | **Yes** (Disconnects observer, cancels rAF, removes mouse/touch/scroll/resize listeners) | Verified in lines 108–125 and 225–233. |

---

## 5. Trace Data Logs (Chromium Headless, 4x CPU Slowdown)

### Homepage (`/`)
- **Scroll Distance:** 19,967 px
- **Total Frames:** 377 frames
- **Average FPS:** 36.6 fps
- **Average Frame Time:** 27.35 ms
- **p95 Frame Time:** 53.40 ms
- **p99 Frame Time:** 66.70 ms
- **Max Frame Time:** 426.70 ms (initial script compile / GSAP timeline initialization)
- **Jank Distribution:**
  - Frames > 16.7 ms: 167 (44.3%)
  - Frames > 33.3 ms: 147 (39.0%)
  - Frames > 50.0 ms: 45 (11.9%)
- **Long Tasks (>50ms):** 28 tasks during initial load/hydration; 0 long tasks during idle at rest.

### About Page (`/about`)
- **Scroll Distance:** 13,689 px
- **Total Frames:** 467 frames
- **Average FPS:** 59.7 fps
- **Average Frame Time:** 16.74 ms
- **p95 Frame Time:** 26.70 ms
- **p99 Frame Time:** 40.10 ms
- **Max Frame Time:** 93.40 ms
- **Jank Distribution:**
  - Frames > 16.7 ms: 103 (22.1%)
  - Frames > 33.3 ms: 6 (1.3%)
  - Frames > 50.0 ms: 4 (0.9%)
- **Cumulative Layout Shift (CLS):** 0.0987 (passes Core Web Vitals threshold).
- **Long Tasks (>50ms):** 12 tasks during initial load/parse.

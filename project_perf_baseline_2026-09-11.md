# Performance Baseline & Audit Log

**Reference Date:** 2026-09-11 (Initial Phase 11.7/11.8 Optimization)
**Prior Update:** 2026-09-12 (Phase 11.10 Theme-Swap & Preloader Verification)
**Latest Update & Audit Date:** 2026-09-17 (Phase 12.11 — Footer 4-Way Widget Switch Audit + Global Re-Baseline)
**Environment:** Windows 10/11 x64, Chromium Headless 1440x900/900, 4x CPU Throttling, Vite 6 Production Build (`npm run build` + `npm run preview`).

---

## 0. Footer 4-Way Widget Switch Audit (2026-09-17)

`siteSettings.footerInteractive` selects one of `{piano, flap, slice, stack}`, rendering `PianoLidContact` + one of `{Piano keys, Flap, SliceBlade, StackTower}` in `Footer.jsx`. Verified live in the browser (not just read from source) by toggling the real Sanity field through all four values and re-loading.

### 0.1 Exclusive Mount Verification — CONFIRMED (via CDP, not static analysis)

For each state, confirmed via `DOMDebugger.getEventListeners` on `window` (real listener introspection, not code reading) plus DOM structure checks:

| `footerInteractive` | Canvases in footer | Piano key buttons | Game-host divs (Flap/Slice/Stack) | `window` `keydown` listeners |
| :--- | :--- | :--- | :--- | :--- |
| `piano` | 1 (particle layer) | 37 (22 white + 15 black) | **0** | **1** (piano's own) |
| `flap` | 1 (Flap's own) | **0** | 1 | **1** (Flap's own) |
| `slice` | 1 (SliceBlade's own) | **0** | 1 | **1** (SliceBlade's own) |
| `stack` | 1 (StackTower's own) | **0** | 1 | **1** (StackTower's own) |

Exactly one `keydown` listener exists on `window` in every state — never zero, never stacked. This is the decisive result: it proves the non-selected widgets are not just CSS-hidden or paused, their listeners are genuinely never registered, because `Footer.jsx` renders them via `{isFlap && <Flap/>}` / `{isSlice && ...}` / `{isStack && ...}` / `{isPiano && ...}` — plain conditional JSX, so React's reconciler unmounts the previous widget's whole subtree (and its effects) before mounting the next one.

Static read of `Flap.jsx`, `SliceBlade.jsx`, `StackTower.jsx` confirms all three share one clean, identical lifecycle pattern: an `IntersectionObserver`-gated rAF loop, a `ResizeObserver`, a `MutationObserver` (dark-mode class watch), and a `window` `keydown` listener, all torn down in the effect's cleanup on unmount. None of the three use GSAP `ScrollTrigger` pinning, so none carry the DOM-ownership-conflict risk class found and fixed in `WorkIndex.jsx` during Phase 4 (see PROJECT_STATUS.md / git history) — plain React unmount is sufficient here.

### 0.2 IntersectionObserver Gating Re-Verification — CONFIRMED (currently selected: `stack`)

Verified by monkey-patching `fillRect` on the footer canvas's own 2D context (tagged at `getContext()` time) to count real draw calls — immune to noise from other page-wide rAF loops (CanvasCursor, etc.), and forced the game into an actively-animating "started" state first so idle (visually static) frames wouldn't produce a false pass:

| State | Draw calls / 1s |
| :--- | :--- |
| Mounted, off-screen, before interaction | 19 (one-time initial paint only, not a loop) |
| Scrolled into view + actively playing | 8,540 |
| Scrolled back out of view | **0** (exact zero — loop fully cancelled) |
| Scrolled back into view | 8,540 (resumes at the same rate — proves pause/resume, not a crash) |

Same `IntersectionObserver` pause/resume pattern as every other component in this project (`Stats.jsx`, `CircularGallery.jsx`, `CloudSky.jsx`, `NightSky.jsx`, `Mascot.jsx`) — holding.

### 0.3 Static-Analysis Finding (not trace-confirmed, flagged for awareness only)

`Footer.jsx`, `WorkPage.jsx` (added in Phase 4), and `GlobalFontLoader.jsx` each independently call `useSanityQuery(siteSettingsQuery, ...)` — three separate components fetching the same singleton document with no shared cache, so a page rendering more than one of them fires redundant CDN requests for identical data. Not confirmed as the cause of anything in this audit; noted because it's real and easy to fix later (e.g. lift into a context/provider) if it's ever worth doing.

---

## 1. Executive Summary & Comparison (2026-09-12 → 2026-09-17)

| Metric / Area | 2026-09-12 (recorded) | 2026-09-17 (current code) | Delta / Status |
| :--- | :--- | :--- | :--- |
| **Homepage Scroll FPS (4x CPU)** | 36.6 fps | **29.7 fps** | Apparent regression -19% — **mostly environment drift, see §1.1** |
| **About Page Scroll FPS (4x CPU)** | 59.7 fps | **36.1 fps** | Apparent regression -40% — **mostly environment drift, see §1.1** |
| **Homepage Image Payload** | 321.31 KB | **325.8 KB** | Flat |
| **About Image Payload** | 904.60 KB | **1,208 KB** | **+303 KB** (+34%) — ruled out as fps cause, see §1.1 |
| **Work (classic) scroll** | *(not measured)* | 57.8 fps, 0.5% jank>33ms | New this pass — solid |
| **Work (gallery) scroll** | *(not measured)* | **60 fps locked**, 0% jank>33ms | New this pass — excellent |
| **Footer scroll, piano/flap/slice/stack** | *(not measured)* | 59.6–60 fps, 0% jank>33ms all four | New this pass — excellent, ruled out as fps cause |
| **Footer widget exclusivity** | *(not audited)* | **Confirmed via CDP** | 1 canvas, 1 keydown listener, always |

### 1.1 Homepage/About regression — properly isolated, not left as "flagged candidates" (2026-09-17 follow-up)

The raw before/after numbers above overstate the real regression. **Re-built and re-traced the actual 2026-09-12 commit (`b213e50`) today, on this same machine, under the identical script** — the only way to separate "the code got slower" from "the machine is under more load than it was five days ago":

| Page | 09-12 commit, traced 09-17 (env-normalized baseline) | Current code, traced 09-17 | Real code-level delta |
| :--- | :--- | :--- | :--- |
| Homepage | **32.3 fps** (not the originally-recorded 36.6fps) | 29.7 fps | **~8% real regression** |
| About | **40.1 fps** (not the originally-recorded 59.7fps) | 36.1 fps | **~9–10% real regression** |

The gap between the *original* 09-12 figures (36.6fps / 59.7fps) and *today's re-measurement of that same unchanged code* (32.3fps / 40.1fps) is bigger than the gap between old and current code. That difference is environment load (this session ran dozens of concurrent Playwright/CDP background processes for hours; whatever the machine's state was on 09-12 is not reproducible from here) — not a code change, since the code on both sides of that first comparison is identical. **A real regression does exist, but it's roughly 8-10%, not the 19-40% the raw before/after suggested.**

**Both named candidates were tested in controlled isolation (same environment, same run, only one variable changed) and ruled out:**

- **Mascot blink animation** (Phase 12.4–12.8): not used on the About page at all (`grep` confirms zero `Mascot` references in `AboutPage.jsx`) — cannot be its cause. On Homepage, where it *is* used (`Hero.jsx`, both desktop and mobile `<Mascot blink />`), disabling the `blink` prop entirely and re-tracing gave **27.8 fps — slightly worse than the 29.7fps control**, i.e. no measurable improvement, consistent with it being pure run-to-run noise rather than a real cost. **Ruled out.**
- **About's +303 KB image growth**: removed the two grown assets from the DOM entirely (the narrative-image `<img>` and both the mobile/desktop experience-background `<img>`/`<motion.img>`) and re-traced. Result: **37.5 fps vs. 36.5fps control** — a ~1fps recovery, not the ~4fps (40.1→36.1) gap that needs explaining. **Ruled out as the primary cause** (real but marginal contributor at most).
- **Footer's heavier canvas widget now sitting at the tail of the full-page scroll** (a hypothesis raised during this follow-up, not one of the two originally named): re-traced About's scroll excluding the footer segment entirely. Result: **39.1 fps vs. 36.5fps control** — a ~2.6fps recovery. **Also ruled out as the primary cause**, though the largest single contributor found.

None of the three fully closes the gap. **Conclusion: the residual ~8-10% regression is diffuse — the cumulative effect of everything added since 09-12 (3 new footer-widget chunks, the gallery template + Archive infra, extra `siteSettings` queries, slightly heavier images, blink's small per-frame cost) rather than one dominant bug.** No single fix will restore the original numbers; closing this gap would mean trimming several small things at once, not finding "the" culprit. Not attempted here — this was a diagnostic pass, not a fix pass, per the request.

**Methodology note:** payload figures this pass were captured via live CDP `Network.responseReceived`/`loadingFinished` (`encodedDataLength`, i.e. actual bytes transferred, compression included) rather than static `dist/` file inspection — a more accurate but differently-scoped measurement than some of the 2026-09-11 entries, so page-level JS totals are not directly comparable to that baseline's "Initial Bundle" figures. Image payload figures use the same methodology both times and are directly comparable. All A/B isolation tests in §1.1 used temporary local edits (`git checkout --` reverted immediately after each trace) — no isolation-test code remains in the working tree.

---

## 2. Bundle Analysis by Route & Chunk (2026-09-17, `dist/` raw sizes)

### 2.1 New chunks since 2026-09-12
- `Footer-rrvLqVlr.js`: **50.08 KB raw** — the 4-widget footer (Piano + Flap + SliceBlade + StackTower + PianoLidContact), previously bundled differently before the 3 new games existed.
- `WorkPage-ZzBc8ECw.js`: 23.27 KB — now includes the `workPageTemplate` toggle logic, `WorkGallery.jsx`, and `ArchiveSection.jsx` alongside classic `WorkIndex.jsx`.

### 2.2 Network-measured payload per route (live capture, `encodedDataLength`)

| Route | JS transferred | JS requests | CSS transferred | Image transferred | Image requests |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Homepage (`/`) | 476.9 KB | 33 | 17.1 KB | 325.8 KB | 4 |
| About (`/about`) | 383.0 KB | 31 | 17.1 KB | **1,208 KB** | 9 |
| Work — classic | 365.7 KB | 29 | 17.2 KB | 226.9 KB | 20 |
| Work — gallery | 365.7 KB | 29 | 17.1 KB | 180.6 KB | 19 |

Work (classic) and Work (gallery) transfer **identical JS** (365.7 KB) — confirms `WorkGallery.jsx`/`ArchiveSection.jsx` piggyback on the same shared route chunk and infra as classic rather than duplicating it, and the gallery template actually ships *less* image weight than classic (180.6 KB vs 226.9 KB), since it doesn't preload the same pinned-media-panel assets classic's scroll-sync view does.

### 2.3 Largest images by route (top-5 sampled)
- **About** is the single biggest image page by far: `Resume-background` (341 KB) + `Resume-background-darkv1` (165 KB) alone account for over half its 1.2 MB payload, both hidden preloads regardless of active theme (same pattern flagged in the 2026-09-11 baseline, §3.1 — unchanged, now joined by an additional ~2560×1440 hero asset at 161 KB and a `tony-blue-strong-full.jpg` at 153 KB not present in the earlier pass).
- **Homepage**: dominated by `portrait.webp` (143 KB) plus two low-quality-placeholder (`?w=12`) portrait previews (108 KB + 79 KB combined) — these tiny-width blur-up placeholders are surprisingly heavy for their pixel dimensions, worth a follow-up look (not diagnosed further here, report-only).

---

## 3. Runtime Lifecycle & Observer Verification Matrix (updated 2026-09-17)

| Component | Loop / Mechanism | Off-Screen Pause Gated? | Unmount Cleanup Verified? | Empirical Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| `Stats.jsx` | Three.js WebGL rAF | Yes | Yes | Carried from 2026-09-12 pass, not re-verified this pass |
| `CircularGallery.jsx` | Card lerp / wheel rAF | Yes | Yes | Carried from 2026-09-12 pass |
| `CloudSky.jsx` | WebGL shader rAF | Yes | Yes | Carried from 2026-09-12 pass |
| `NightSky.jsx` | 2D Canvas star rAF | Yes | Yes | Carried from 2026-09-12 pass |
| `Mascot.jsx` | Spring physics rAF + blink | Yes | Yes | Carried from 2026-09-12 pass; blink (Phase 12.4–12.8) piggybacks the same rAF tick per code comment, not a separate loop |
| **`Piano` (Footer.jsx)** | Canvas particle rAF (only while particles exist) | **Yes** (`IntersectionObserver` threshold 0.05 gates spawn; loop self-terminates when `particles.length === 0`) | **Yes** (unmount removes the `<canvas>` entirely, no orphaned listeners — 1 `keydown` listener confirmed via CDP) | **CDP `DOMDebugger.getEventListeners` + draw-call instrumentation, 2026-09-17** |
| **`Flap.jsx`** | Canvas rAF | **Yes** (`IntersectionObserver` threshold 0.05 cancels rAF) | **Yes** (`ResizeObserver` + `IntersectionObserver` + `keydown` all disconnected/removed in cleanup) | **CDP + DOM checks, 2026-09-17** |
| **`SliceBlade.jsx`** | Canvas rAF | **Yes** (identical pattern to Flap) | **Yes** (identical pattern to Flap) | **CDP + DOM checks, 2026-09-17** |
| **`StackTower.jsx`** | Canvas rAF | **Yes** (identical pattern to Flap; re-verified with forced-active-state draw-call counting: 8,540/s in view → 0/s out of view → 8,540/s resumed) | **Yes** (identical pattern to Flap) | **CDP + draw-call instrumentation, 2026-09-17 (most rigorous check in this pass)** |
| `WorkIndex.jsx` (classic Work template) | GSAP ScrollTrigger pin (scrub) | N/A (pin, not visibility-gated) | **Yes, fixed 2026-09-17** — was a `useEffect` whose `st.kill()` cleanup ran *after* React's own DOM removal on unmount, causing a `removeChild` crash the first time the `workPageTemplate` toggle unmounted it mid-session. Moved to `useLayoutEffect` + `st.kill(true)` so the pin reverts before React removes the DOM. | Playwright, console/pageerror capture across all `workPageTemplate` states + normal nav-away/nav-back, 2026-09-17 |

---

## 4. Trace Data Logs (Chromium Headless, 4x CPU Slowdown, 2026-09-17)

### Homepage (`/`)
- Scroll Distance: 7,006 px (page height shorter than the 20,000px cap requested)
- Total Frames: 194
- Average FPS: **29.7 fps**
- Average Frame Time: 33.68 ms
- p95 Frame Time: 116.7 ms
- p99 Frame Time: 416.7 ms
- Max Frame Time: 1383.2 ms
- Jank: >16.7ms 28.9% · >33.3ms 6.7% · >50ms 5.7%

### About Page (`/about`)
- Scroll Distance: 12,805 px
- Total Frames: 250
- Average FPS: **36.1 fps**
- Average Frame Time: 27.73 ms
- p95 Frame Time: 50.0 ms
- p99 Frame Time: 233.4 ms
- Max Frame Time: 250.0 ms
- Jank: >16.7ms 50.8% · >33.3ms 9.6% · >50ms 4.4%

### Work — Classic (`/work`, `workPageTemplate` unset)
- Scroll Distance: 3,598 px
- Total Frames: 187
- Average FPS: 57.8 fps
- p95 Frame Time: 16.8 ms · Max: 133.3 ms
- Jank: >16.7ms 18.7% · >33.3ms 0.5% · >50ms 0.5%

### Work — Gallery (`workPageTemplate = "gallery"`)
- Scroll Distance: 3,598 px
- Total Frames: 186
- Average FPS: **60 fps** (locked)
- p95 Frame Time: 16.8 ms · Max: 16.8 ms
- Jank: >16.7ms 16.1% · >33.3ms **0%** · >50ms **0%**

### Footer Scroll, Per Widget (Homepage, scroll from 400px above the footer through 200px past it, widget forced into an actively-animating state first)
| Widget | Avg FPS | p95 Frame Time | Max Frame Time | Jank >33.3ms |
| :--- | :--- | :--- | :--- | :--- |
| Piano | 59.6 | 16.8 ms | 33.2 ms | 0% |
| Flap | 60 (locked) | 16.7 ms | 16.8 ms | 0% |
| Slice | 60 (locked) | 16.7 ms | 16.8 ms | 0% |
| Stack | 60 (locked) | 16.8 ms | 16.8 ms | 0% |

---

## 5. Ranked Findings (2026-09-17 pass, updated after the follow-up isolation work)

1. **CONFIRMED (trace, environment-normalized) — a real but modest ~8-10% scroll-performance regression exists** on Homepage and About since 2026-09-12, isolated by re-building and re-tracing the actual 09-12 commit today under identical conditions (see §1.1) rather than trusting the raw before/after numbers, which were inflated by machine-load drift between measurement sessions (~40% of the apparent About "regression" and more than half of Homepage's was environment, not code).
2. **CONFIRMED (trace, controlled A/B) — none of the tested candidates is the dominant cause.** Mascot blink is absent from About entirely and, when disabled on Homepage, measured no better (27.8fps vs 29.7fps control — within noise). About's grown images recovered only ~1fps when removed. The footer widget now sitting at the scroll tail recovered ~2.6fps when excluded. The regression is diffuse across many small additions, not one bug — see §1.1 for the full method and numbers.
3. **CONFIRMED (trace) — footer widget switch is exonerated as a cause of anything.** All 4 widgets trace at 59.6–60fps in isolation and mount/unmount exclusively (CDP-verified).
4. **CONFIRMED (trace) — Work gallery template is the best-performing page in the project** (60fps locked, 0% jank>33ms), and ships less image weight than classic on the same route.
5. **Correction to an earlier version of this report:** the `WorkIndex.jsx` `useLayoutEffect`/`removeChild` fix referenced in §3 was **not** made during this audit — it was already committed (`f6ec0f2`) before this audit session began, as part of the earlier Work-gallery-template work. This audit only re-described it while verifying §3's lifecycle matrix; no WorkIndex.jsx code was touched in this session. The only file this audit changed is this baseline document itself, plus temporary, fully-reverted local edits used for the A/B tests in §1.1 (`git status` confirms a clean tree apart from this file).
6. **PLAUSIBLE (static only, not perf-confirmed) — 3 components independently query the `siteSettings` singleton** (`Footer.jsx`, `WorkPage.jsx`, `GlobalFontLoader.jsx`) with no shared cache — minor redundant-network-request inefficiency, unrelated to the fps findings above.

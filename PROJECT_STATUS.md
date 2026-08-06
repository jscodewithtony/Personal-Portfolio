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

## 🛠️ Verification & Development Commands

- **Linter**: `npx oxlint` (0 errors, 0 warnings)
- **Production Build**: `npm run build` (Clean Vite build in ~400ms)
- **Dev Server**: `npm run dev` (`http://localhost:5173`)

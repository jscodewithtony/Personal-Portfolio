import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { statCardsQuery } from "../sanity/queries";
import { useThemeTokens } from "../theme/ThemeTokensContext";
import { hexToThreeColor } from "../theme/themeTokens";
import { useSignalSectionMounted } from "../hooks/useSectionMountRefresh";

gsap.registerPlugin(ScrollTrigger);

const PIN_DISTANCE_VH = 2.5;

// Fewer cubes on smaller viewports (perf), and — critically — the
// col:row RATIO now tracks the actual device aspect ratio instead of
// defaulting to roughly square. A square grid mapped onto a tall phone
// screen can't both avoid overflow AND fill every edge: fitting its
// width leaves gaps top/bottom, fitting its height overflows left/right.
// Shaping the grid itself to match the viewport (more rows than cols on
// a tall portrait phone) is what lets a "cover" camera fit (below) reach
// every edge without huge empty margins.
function getResponsiveGridDims(width, height) {
  if (width >= 1024) return { cols: 12, rows: 8 }; // desktop: unchanged

  const aspect = width / height;
  const tileBudget = width < 640 ? 42 : 72;
  let cols = Math.round(Math.sqrt(tileBudget * aspect));
  let rows = Math.round(tileBudget / cols);
  cols = Math.max(3, cols);
  rows = Math.max(3, rows);
  return { cols, rows };
}

const STAT_ITEMS = [
  {
    id: "exp",
    eyebrow: "Experience",
    value: "5+ Years",
    title: "Crafting UX & Systems",
    copy: "Building design engines & scalable UI components for high-growth tech products.",
    initialPos: { x: -7, y: -4, z: 2 },
    targetPos: { x: -3.8, y: 1.8, z: 1.2 },
    exitPos: { x: -9, y: 3, z: 3 },
    rot: { x: 0.2, y: -0.3, z: -0.1 },
  },
  {
    id: "systems",
    eyebrow: "Design Systems",
    value: "10+ Systems",
    title: "Tokens & Component Specs",
    copy: "Precision token architectures engineered for speed, themeability, and accessibility.",
    initialPos: { x: 7, y: 4, z: 1.5 },
    targetPos: { x: 3.9, y: 1.9, z: 1.0 },
    exitPos: { x: 9, y: 4, z: 2 },
    rot: { x: 0.15, y: 0.25, z: 0.08 },
  },
  {
    id: "shipped",
    eyebrow: "Products Shipped",
    value: "15+ Apps",
    title: "Mobile, Web & Desktop",
    copy: "End-to-end user interfaces delivered from early concept to production code.",
    initialPos: { x: 7, y: -4, z: 1.8 },
    targetPos: { x: 3.8, y: -1.8, z: 0.9 },
    exitPos: { x: 9, y: -3, z: 2.5 },
    rot: { x: -0.2, y: 0.2, z: -0.05 },
  },
  {
    id: "impact",
    eyebrow: "Impact",
    value: "100k+ Users",
    title: "Global Audience",
    copy: "Creating intuitive interfaces trusted daily by thousands of active users.",
    initialPos: { x: -7, y: 4, z: 2.2 },
    targetPos: { x: -3.9, y: -1.9, z: 1.1 },
    exitPos: { x: -9, y: -4, z: 3 },
    rot: { x: -0.25, y: -0.2, z: 0.1 },
  },
];

// Fallback for the pinned centerpiece card (a 5th, differently-laid-out
// stat slot outside the STAT_ITEMS array) — sourced from the 5th
// statCard document (by displayOrder) when present.
const FALLBACK_CENTERPIECE = {
  label: "Projects Shipped",
  value: "20+",
  description:
    "NudgeFile renames and sorts your files with a local AI — but it asks first, and it always has an undo button, because trusting an AI with your file system sight-unseen is how horror movies start.",
};

function Stats({ theme }) {
  useSignalSectionMounted("stats");

  const { data: statCards, status: statCardsStatus } = useSanityQuery(
    statCardsQuery,
    {},
    []
  );
  const cmsReady = statCardsStatus === "ready" && statCards?.length;
  // The 4 overlay cards keep STAT_ITEMS' own position/rotation config
  // (pure presentation, index-keyed) and only swap in CMS text by index.
  const displayItems = STAT_ITEMS.map((item, i) => {
    const cms = cmsReady ? statCards[i] : null;
    if (!cms) return item;
    return {
      ...item,
      eyebrow: cms.label || item.eyebrow,
      value: cms.value || item.value,
      title: cms.title || item.title,
      copy: cms.description || item.copy,
    };
  });
  const centerpiece =
    (cmsReady && statCards[4]) || FALLBACK_CENTERPIECE;

  const themeTokens = useThemeTokens();

  const sectionRef = useRef(null);
  const mountRef = useRef(null);
  const mainCardRef = useRef(null);
  const bgNumbersRef = useRef([]);
  const overlayCardRefs = useRef([]);

  // Refs for Three.js materials & lights to support real-time dynamic theme updating
  const greyFrontMatRef = useRef(null);
  const sideGreyMatRef = useRef(null);
  const greyLineMatRef = useRef(null);
  const lightCardMatRef = useRef(null);
  const ambientLightRef = useRef(null);

  // Helper to dynamically update Three.js material colors and lighting
  // when theme toggles. Dark-mode hex values stay hardcoded exactly as
  // before — only the light-mode branch now reads the active theme's
  // (Sanity-selected) cube colors instead of a fixed purple.
  const applyThemeToMaterials = (isDark) => {
    if (greyFrontMatRef.current) {
      greyFrontMatRef.current.color.setHex(
        isDark ? 0x1a1a1f : hexToThreeColor(themeTokens.statsCubeFrontColor)
      );
    }
    if (sideGreyMatRef.current) {
      sideGreyMatRef.current.color.setHex(
        isDark ? 0x242429 : hexToThreeColor(themeTokens.statsCubeSideColor)
      );
    }
    if (greyLineMatRef.current) {
      greyLineMatRef.current.color.setHex(
        isDark ? 0x3d3950 : hexToThreeColor(themeTokens.statsCubeLineColor)
      );
    }
    if (lightCardMatRef.current) {
      lightCardMatRef.current.color.setHex(
        isDark ? 0x120f24 : hexToThreeColor(themeTokens.statsCubeFrontColor)
      );
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isDark ? 0.8 : 1.6;
    }
  };

  // React to theme prop updates & document.documentElement class mutations in real time
  useEffect(() => {
    const checkDark = () =>
      theme ? theme === "dark" : document.documentElement.classList.contains("dark");
    applyThemeToMaterials(checkDark());

    const observer = new MutationObserver(() => {
      applyThemeToMaterials(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme, themeTokens]);

  useEffect(() => {
    const section = sectionRef.current;
    const mount = mountRef.current;
    if (!section || !mount) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // --- THREE.JS SCENE SETUP ---
    const width = Math.max(mount.clientWidth || window.innerWidth, 300);
    const height = Math.max(mount.clientHeight || window.innerHeight, 300);

    const scene = new THREE.Scene();
    scene.background = null; // transparent to show section background beneath

    const CAMERA_FOV = 42;
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 100);
    camera.lookAt(0, 0, 0);

    // "Cover" distance (like CSS background-size: cover), not "contain":
    // takes the SMALLER of the two candidate distances so the grid is
    // guaranteed to fill both the frustum's width and height, allowing a
    // small, deliberate overflow/crop in whichever dimension has room to
    // spare — rather than the MAX, which guarantees no overflow in
    // either dimension but, for a grid whose aspect ratio doesn't
    // exactly match the viewport's, guarantees a visible gap in the
    // other. Paired with getResponsiveGridDims shaping the grid's own
    // col:row ratio to roughly track the device aspect, the resulting
    // overflow stays small instead of needing this at all.
    const computeCameraZ = (aspect, worldWidth, worldHeight) => {
      const vFovRad = (CAMERA_FOV * Math.PI) / 180;
      const distanceForHeight = worldHeight / (2 * Math.tan(vFovRad / 2));
      const distanceForWidth =
        worldWidth / (2 * Math.tan(vFovRad / 2) * aspect);
      return Math.min(distanceForHeight, distanceForWidth) * 0.96;
    };

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    const isInitialDark = document.documentElement.classList.contains("dark");

    // --- LIGHTING RIG ---
    const ambientLight = new THREE.AmbientLight(0xffffff, isInitialDark ? 0.8 : 1.6);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(6, 9, 7);
    dirLight.castShadow = false;
    scene.add(dirLight);

    // Soft rim light for edge highlights
    const rimLight = new THREE.PointLight(0xf2effa, 1.5, 25);
    rimLight.position.set(-6, -4, 5);
    scene.add(rimLight);

    // --- GEOMETRIES & MATERIALS ---
    const tileSize = 1.6;
    const cubeGeo = new THREE.BoxGeometry(tileSize, tileSize, tileSize);
    const edgesGeo = new THREE.EdgesGeometry(cubeGeo);

    // Front face material (Light: theme accent | Dark: #1a1a1f, frozen).
    // MeshLambertMaterial, not MeshStandardMaterial: the grid's ~100
    // cube meshes were already tuned to roughness:0.98/metalness:0 —
    // i.e. specular/metallic response suppressed to near-zero — so
    // dropping PBR (Cook-Torrance) shading for cheaper Lambertian
    // (diffuse-only) shading costs no visible difference here, since
    // there was barely any specular contribution to lose. Still
    // responds to the same ambient/directional/point light rig.
    // Measured impact (CPU-throttled 5x, 3 trials each): ~9ms off the
    // one-time first-render shader compile, but the real win is
    // per-frame — during the scrub-driven scroll (every frame
    // re-renders ~100 GSAP-tweened meshes), mean frame time roughly
    // halved (~70ms -> ~40ms) and frames over 50ms (visible stutter)
    // dropped from ~97% to ~3-6%. PBR's per-fragment cost, paid every
    // frame, was the larger cost — not just the first-frame compile.

    const greyFrontMat = new THREE.MeshLambertMaterial({
      color: isInitialDark ? 0x1a1a1f : hexToThreeColor(themeTokens.statsCubeFrontColor),
      transparent: true,
      opacity: 1,
    });
    greyFrontMatRef.current = greyFrontMat;

    // Side face material for depth shading (Light: theme accent | Dark: #242429, frozen)
    const sideGreyMat = new THREE.MeshLambertMaterial({
      color: isInitialDark ? 0x242429 : hexToThreeColor(themeTokens.statsCubeSideColor),
      transparent: true,
      opacity: 0,
    });
    sideGreyMatRef.current = sideGreyMat;

    const cubeMaterials = [
      sideGreyMat,  // right
      sideGreyMat,  // left
      sideGreyMat,  // top
      sideGreyMat,  // bottom
      greyFrontMat, // front
      sideGreyMat,  // back
    ];

    // Wireframe edge lines (Light: theme accent | Dark: #3d3950, frozen)
    const greyLineMat = new THREE.LineBasicMaterial({
      color: isInitialDark ? 0x3d3950 : hexToThreeColor(themeTokens.statsCubeLineColor),
      linewidth: 1.5,
      transparent: true,
      opacity: isInitialDark ? 0.35 : 0.45,
    });
    greyLineMatRef.current = greyLineMat;

    // --- 3D GRID OF CUBES (col/row count scales down on smaller
    // viewports — see getResponsiveGridDims — gap = 0 for a seamless
    // continuous grid at every size) ---
    const gridCubes = [];
    const { cols, rows } = getResponsiveGridDims(width, height);
    const spacingX = tileSize;
    const spacingY = tileSize;
    const startX = -((cols - 1) * spacingX) / 2;
    const startY = ((rows - 1) * spacingY) / 2;

    // Desktop keeps the exact original z: 11, tuned specifically for
    // that aspect ratio — left untouched per instruction. Mobile/tablet
    // use the aspect-aware cover distance instead.
    const cameraZ =
      width < 1024
        ? computeCameraZ(width / height, cols * spacingX, rows * spacingY)
        : 11;
    camera.position.set(0, 0, cameraZ);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const mesh = new THREE.Mesh(cubeGeo, cubeMaterials);
        mesh.position.set(startX + c * spacingX, startY - r * spacingY, 0);

        // TRUE FLAT DEFAULT STATE (AT REST): Fully flattened 2D square tile
        mesh.scale.set(1, 1, 0.001);
        mesh.rotation.set(0, 0, 0);

        // Soft wireframe edges / grid lines
        const line = new THREE.LineSegments(edgesGeo, greyLineMat);
        mesh.add(line);

        scene.add(mesh);
        gridCubes.push({
          mesh,
          baseX: mesh.position.x,
          baseY: mesh.position.y,
          col: c,
          row: r,
        });
      }
    }

    // --- 4 STAT CUBES (HIDDEN AT REST to eliminate stray corner 3D shapes) ---
    const statMeshes = STAT_ITEMS.map((item) => {
      const geo = new THREE.BoxGeometry(3.0, 2.2, 0.6);
      const lightCardMat = new THREE.MeshStandardMaterial({
        color: isInitialDark ? 0x120f24 : hexToThreeColor(themeTokens.statsCubeFrontColor),
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 1,
      });
      lightCardMatRef.current = lightCardMat;

      const mesh = new THREE.Mesh(geo, lightCardMat);
      mesh.position.set(item.initialPos.x, item.initialPos.y, item.initialPos.z);
      mesh.rotation.set(item.rot.x, item.rot.y, item.rot.z);
      mesh.visible = false; // HIDDEN AT REST

      const cardLine = new THREE.LineSegments(new THREE.EdgesGeometry(geo), greyLineMat);
      mesh.add(cardLine);
      scene.add(mesh);
      return mesh;
    });

    // --- RENDER LOOP WITH OFF-SCREEN PAUSE OPTIMIZATION ---
    let animationFrameId;
    let isVisible = true;

    const render = () => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            render();
          }
        });
      },
      { threshold: 0.01 }
    );
    sectionObserver.observe(section);

    render();

    // --- GSAP SCROLLTRIGGER TIMELINE ---
    let ctx;
    if (!reduceMotion) {
      ctx = gsap.context(() => {
        // Touch swipes cover roughly the same physical distance as a
        // desktop wheel-scroll tick, but this pin's distance is
        // computed from window.innerHeight — smaller on mobile — so
        // the same gesture consumed a bigger share of it there, making
        // the scrub feel like it's rushing by faster on phones. A
        // larger mobile multiplier restores a native-feeling pace,
        // animation unchanged.
        const isMobile = window.innerWidth < 768;
        const totalPinHeight = window.innerHeight * (isMobile ? 4 : PIN_DISTANCE_VH);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${totalPinHeight}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        // 1. ON-SCROLL TRANSITION: Fade in side face depth & wireframes
        tl.to(
          sideGreyMat,
          {
            opacity: 1,
            duration: 0.25,
            ease: "power1.out",
          },
          0.05
        ).to(
          greyLineMat,
          {
            opacity: 0.85,
            duration: 0.25,
            ease: "power1.out",
          },
          0.05
        );

        // Extrude flat 2D grid tiles into 3D isometric cubes then fly far off-screen & scale down to 0
        gridCubes.forEach(({ mesh, baseX, baseY, col, row }) => {
          const diffX = col - (cols - 1) / 2;
          const diffY = row - (rows - 1) / 2;
          const moveX = diffX * 2.2;
          const moveY = -diffY * 2.0;
          const liftZ = 1.8 + Math.abs(diffX + diffY) * 0.4;

          tl.to(
            mesh.scale,
            {
              z: 1.0,
              duration: 0.35,
              ease: "power2.out",
            },
            0.05 + (col + row) * 0.01
          )
            .to(
              mesh.position,
              {
                z: liftZ,
                x: baseX + moveX * 0.4,
                y: baseY + moveY * 0.4,
                duration: 0.35,
                ease: "power2.out",
              },
              0.05 + (col + row) * 0.01
            )
            .to(
              mesh.rotation,
              {
                x: -diffY * 0.3,
                y: diffX * 0.3,
                duration: 0.35,
                ease: "power2.out",
              },
              0.05 + (col + row) * 0.01
            )
            .to(
              mesh.position,
              {
                x: baseX + moveX * 4.0,
                y: baseY + moveY * 4.0,
                z: liftZ + 10,
                duration: 0.35,
                ease: "power2.in",
              },
              0.35
            )
            .to(
              mesh.scale,
              {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.35,
                ease: "power2.in",
              },
              0.35
            );
        });

        // Fade all 3D mesh materials out to opacity 0 so all background 3D elements completely disappear
        tl.to(
          [greyFrontMat, sideGreyMat, greyLineMat],
          {
            opacity: 0,
            duration: 0.25,
            ease: "power1.inOut",
          },
          0.35
        );

        // 2. Ambient Giant Numbers Shift
        bgNumbersRef.current.forEach((num, idx) => {
          if (!num) return;
          tl.to(
            num,
            {
              y: idx % 2 === 0 ? -50 : 50,
              opacity: 0.14,
              duration: 0.8,
              ease: "none",
            },
            0.1
          );
        });

        // 3. 3D Stat Meshes Sweep in & Fly Off-Screen to Disappear
        statMeshes.forEach((mesh, idx) => {
          const item = STAT_ITEMS[idx];
          const startTime = 0.1 + idx * 0.04;

          tl.set(mesh, { visible: true }, startTime);

          tl.to(
            mesh.position,
            {
              x: item.targetPos.x,
              y: item.targetPos.y,
              z: item.targetPos.z,
              duration: 0.25,
              ease: "power2.out",
            },
            startTime
          )
            .to(
              mesh.rotation,
              {
                x: item.rot.x * 0.5,
                y: item.rot.y * 0.5,
                z: item.rot.z * 0.5,
                duration: 0.25,
                ease: "power2.out",
              },
              startTime
            )
            .to(
              mesh.position,
              {
                x: item.exitPos.x,
                y: item.exitPos.y,
                z: item.exitPos.z,
                duration: 0.25,
                ease: "power2.in",
              },
              startTime + 0.25
            )
            .set(mesh, { visible: false }, startTime + 0.5);
        });

        // 4. HTML Stat Cards Sweep smoothly into place and STAY visible on clean background
        overlayCardRefs.current.forEach((htmlCard, idx) => {
          if (!htmlCard) return;
          const startTime = 0.2 + idx * 0.05;
          tl.fromTo(
            htmlCard,
            { opacity: 0, scale: 0.7, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
            startTime
          );
        });

        // 5. Centerpiece 3D Tilt
        if (mainCardRef.current) {
          tl.to(
            mainCardRef.current,
            { scale: 1.05, rotateX: -3, rotateY: 3, duration: 0.4, ease: "power1.out" },
            0.1
          ).to(
            mainCardRef.current,
            { scale: 1, rotateX: 0, rotateY: 0, duration: 0.4, ease: "power1.inOut" },
            0.6
          );
        }
      }, section);
    } else {
      // Reduced motion fallback: hide all 3D meshes and keep stat cards visible on clean background
      statMeshes.forEach((mesh) => {
        mesh.visible = false;
      });
      gridCubes.forEach(({ mesh }) => {
        mesh.visible = false;
      });
      overlayCardRefs.current.forEach((htmlCard) => {
        if (htmlCard) {
          gsap.set(htmlCard, { opacity: 1, scale: 1, y: 0 });
        }
      });
    }

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!mount) return;
      const w = Math.max(mount.clientWidth || window.innerWidth, 300);
      const h = Math.max(mount.clientHeight || window.innerHeight, 300);
      camera.aspect = w / h;
      // Same desktop-preserving rule as the initial setup: only
      // mobile/tablet widths get the recalculated cover distance, so a
      // resize/orientation change can't regress the desktop framing back
      // to the "contain" math that caused the white margins.
      camera.position.z =
        w < 1024
          ? computeCameraZ(w / h, cols * spacingX, rows * spacingY)
          : 11;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // The timeout-based re-measure wasn't reliable enough on mobile — a
    // guessed delay can still land before `min-h-[100dvh]` has actually
    // settled (webfont swap reflow, the address bar hiding and changing
    // the dvh unit, etc.), and unlike CSS the canvas's actual pixel size
    // is fixed at whatever `mount.clientWidth/clientHeight` happened to
    // read at that exact moment. A ResizeObserver instead reacts to the
    // mount element's REAL size the instant it changes, however many
    // times that takes, rather than guessing at a fixed delay — this is
    // what actually keeps the canvas matched to the section's true
    // rendered box, without touching the camera-distance/motion logic.
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mount);
    document.fonts?.ready?.then(handleResize);

    // --- CLEANUP ---
    return () => {
      sectionObserver.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      ctx?.revert();

      // Dispose WebGL Geometries, Materials & Renderer
      cubeGeo.dispose();
      edgesGeo.dispose();
      greyFrontMat.dispose();
      sideGreyMat.dispose();
      greyLineMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 min-h-[100dvh] w-full overflow-hidden bg-bg text-ink transition-colors duration-300 select-none dark:bg-[#0c0a14] dark:text-white"
    >
      {/* Ambient Watermark Giant Numbers */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 sm:px-12 overflow-hidden">
        <span
          ref={(el) => (bgNumbersRef.current[0] = el)}
          className="font-display font-black text-[22vw] leading-none text-ink/10 opacity-5 dark:text-white/5 transform -translate-x-1/4"
        >
          17
        </span>
        <span
          ref={(el) => (bgNumbersRef.current[1] = el)}
          className="font-display font-black text-[26vw] leading-none text-ink/10 opacity-5 dark:text-white/5"
        >
          24/7
        </span>
        <span
          ref={(el) => (bgNumbersRef.current[2] = el)}
          className="font-display font-black text-[22vw] leading-none text-ink/10 opacity-5 dark:text-white/5 transform translate-x-1/4"
        >
          13
        </span>
      </div>

      {/* THREE.JS WEBGL CANVAS CONTAINER */}
      <div ref={mountRef} className="absolute inset-0 z-10 h-full w-full pointer-events-none" />

      {/* HTML OVERLAY STAGE FOR TEXT & CARDS */}
      <div className="relative mx-auto flex h-[100dvh] w-full items-center justify-center pointer-events-auto">
        {/* 4 Sweeping HTML Stat Cards (Synced with 3D Mesh Animation) */}
        {displayItems.map((item, i) => (
          <div
            key={item.id}
            ref={(el) => (overlayCardRefs.current[i] = el)}
            className={`absolute z-20 w-[38vw] max-w-[160px] p-3 sm:w-[52vw] sm:max-w-[240px] sm:p-4 md:max-w-[270px] md:p-5 lg:max-w-[290px] rounded-none border border-ink/15 bg-white text-ink shadow-xl shadow-ink/10 opacity-0 transition-colors duration-300 dark:border-white/15 dark:bg-[#141416] dark:text-white dark:shadow-2xl ${i === 0
              ? "left-[3%] top-[8%] sm:left-[6%] sm:top-[14%]"
              : i === 1
                ? "right-[3%] top-[8%] sm:right-[6%] sm:top-[14%]"
                : i === 2
                  ? "right-[3%] bottom-[8%] sm:right-[6%] sm:bottom-[14%]"
                  : "left-[3%] bottom-[8%] sm:left-[6%] sm:bottom-[14%]"
              }`}
          >
            <div className="inline-block rounded-none border border-ink/20 bg-[#f1f0fa] px-2 py-0.5 font-display text-[8px] sm:text-[10px] font-bold tracking-widest text-ink/90 uppercase dark:border-white/30 dark:bg-white/10 dark:text-white/90">
              {item.eyebrow}
            </div>
            <div className="mt-2 font-display text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-none tracking-tight text-stat-value dark:text-white">
              {item.value}
            </div>
            <div className="mt-2 font-display text-[10px] sm:text-xs md:text-sm font-bold text-ink dark:text-white">
              {item.title}
            </div>
            {/* Copy line drops out below sm — at 38vw/160px wide it's too
                narrow to keep this third line legible alongside the
                eyebrow/value/title, so it's cut rather than shrunk to
                unreadable size. */}
            <p className="mt-2 hidden font-display text-[11px] font-normal normal-case leading-relaxed text-ink/80 sm:block sm:text-xs dark:text-white/80">
              {item.copy}
            </p>
          </div>
        ))}

        {/* Main Pinned Centerpiece Theme-Adapted Card */}
        <div
          ref={mainCardRef}
          className="relative z-30 w-[82vw] max-w-[300px] rounded-none border border-ink/15 bg-white p-5 text-ink shadow-2xl transition-colors duration-300 sm:max-w-[400px] sm:p-8 md:max-w-[440px] dark:border-white/15 dark:bg-[#141416] dark:text-white"
        >
          {/* Bordered pill/badge with thin outline */}
          <div className="inline-block rounded-none border border-ink/20 bg-[#f1f0fa] px-3.5 py-1 font-display text-xs font-bold uppercase tracking-wider text-ink/90 dark:border-white/30 dark:bg-white/10 dark:text-white/90">
            {centerpiece.label}
          </div>

          {/* Big Stat Text Color #0D0C14 for 20+ */}
          <h2 className="mt-3 font-display text-5xl font-black leading-none tracking-tight text-stat-value sm:text-7xl md:text-8xl dark:text-white">
            {centerpiece.value}
          </h2>

          {/* High contrast body text */}
          <p className="mt-4 font-display text-[11px] font-normal normal-case leading-relaxed text-ink/80 sm:text-sm md:text-base dark:text-white/80">
            {centerpiece.description}
          </p>
        </div>
      </div>
    </section>
  );
}

export default Stats;

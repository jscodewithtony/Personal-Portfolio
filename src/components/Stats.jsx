import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PIN_DISTANCE_VH = 2.5;

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

function Stats({ theme }) {
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

  // Helper to dynamically update Three.js material colors and lighting when theme toggles
  const applyThemeToMaterials = (isDark) => {
    if (greyFrontMatRef.current) {
      // Light theme: #5953B0 | Dark theme: #1a1a1f
      greyFrontMatRef.current.color.setHex(isDark ? 0x1a1a1f : 0x5953b0);
    }
    if (sideGreyMatRef.current) {
      // Light theme: #49439F | Dark theme: #242429
      sideGreyMatRef.current.color.setHex(isDark ? 0x242429 : 0x49439f);
    }
    if (greyLineMatRef.current) {
      // Light theme: #534DA4 | Dark theme: #3d3950
      greyLineMatRef.current.color.setHex(isDark ? 0x3d3950 : 0x534da4);
    }
    if (lightCardMatRef.current) {
      lightCardMatRef.current.color.setHex(isDark ? 0x120f24 : 0x5953b0);
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
  }, [theme]);

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

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);
    camera.lookAt(0, 0, 0);

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

    // Front face material (Light: #5953B0 | Dark: #1a1a1f)
    const greyFrontMat = new THREE.MeshStandardMaterial({
      color: isInitialDark ? 0x1a1a1f : 0x5953b0,
      roughness: 0.98,
      metalness: 0.0,
    });
    greyFrontMatRef.current = greyFrontMat;

    // Side face material for depth shading (Light: #49439F | Dark: #242429)
    const sideGreyMat = new THREE.MeshStandardMaterial({
      color: isInitialDark ? 0x242429 : 0x49439f,
      roughness: 0.98,
      metalness: 0.0,
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

    // Wireframe edge lines (Light: #534DA4 | Dark: #3d3950)
    const greyLineMat = new THREE.LineBasicMaterial({
      color: isInitialDark ? 0x3d3950 : 0x534da4,
      linewidth: 1.5,
      transparent: true,
      opacity: isInitialDark ? 0.35 : 0.45,
    });
    greyLineMatRef.current = greyLineMat;

    // --- 3D GRID OF CUBES (12 cols x 8 rows, gap = 0 for seamless continuous grid) ---
    const gridCubes = [];
    const cols = 12;
    const rows = 8;
    const spacingX = tileSize;
    const spacingY = tileSize;
    const startX = -((cols - 1) * spacingX) / 2;
    const startY = ((rows - 1) * spacingY) / 2;

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
        color: isInitialDark ? 0x120f24 : 0x5953b0,
        roughness: 0.5,
        metalness: 0.1,
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

    // --- RENDER LOOP ---
    let animationFrameId;
    const render = () => {
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // --- GSAP SCROLLTRIGGER TIMELINE ---
    let ctx;
    if (!reduceMotion) {
      ctx = gsap.context(() => {
        const totalPinHeight = window.innerHeight * PIN_DISTANCE_VH;

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
            duration: 0.3,
            ease: "power1.out",
          },
          0.05
        ).to(
          greyLineMat,
          {
            opacity: 0.85,
            duration: 0.3,
            ease: "power1.out",
          },
          0.05
        );

        // Extrude flat 2D grid tiles into 3D isometric cubes on scroll
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
              duration: 0.4,
              ease: "power2.out",
            },
            0.05 + (col + row) * 0.015
          )
            .to(
              mesh.position,
              {
                z: liftZ,
                x: baseX + moveX * 0.4,
                y: baseY + moveY * 0.4,
                duration: 0.4,
                ease: "power2.out",
              },
              0.05 + (col + row) * 0.015
            )
            .to(
              mesh.rotation,
              {
                x: -diffY * 0.3,
                y: diffX * 0.3,
                duration: 0.4,
                ease: "power2.out",
              },
              0.05 + (col + row) * 0.015
            )
            .to(
              mesh.position,
              {
                x: baseX + moveX * 2.2,
                y: baseY + moveY * 2.2,
                z: liftZ + 4,
                duration: 0.5,
                ease: "power2.in",
              },
              0.45
            );
        });

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

        // 3. Stat Meshes Sweep & HTML Overlay Position Binding
        statMeshes.forEach((mesh, idx) => {
          const item = STAT_ITEMS[idx];
          const htmlCard = overlayCardRefs.current[idx];

          tl.set(mesh, { visible: true }, 0.2 + idx * 0.05);

          tl.to(
            mesh.position,
            {
              x: item.targetPos.x,
              y: item.targetPos.y,
              z: item.targetPos.z,
              duration: 0.35,
              ease: "power2.out",
            },
            0.2 + idx * 0.05
          )
            .to(
              mesh.rotation,
              {
                x: item.rot.x * 0.5,
                y: item.rot.y * 0.5,
                z: item.rot.z * 0.5,
                duration: 0.35,
                ease: "power2.out",
              },
              0.2 + idx * 0.05
            )
            .to(
              mesh.position,
              {
                x: item.exitPos.x,
                y: item.exitPos.y,
                z: item.exitPos.z,
                duration: 0.35,
                ease: "power2.in",
              },
              0.65 + idx * 0.04
            )
            .set(mesh, { visible: false }, 0.98);

          // Sync HTML overlay opacity with 3D mesh movement
          if (htmlCard) {
            tl.fromTo(
              htmlCard,
              { opacity: 0, scale: 0.6 },
              { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" },
              0.2 + idx * 0.05
            ).to(
              htmlCard,
              { opacity: 0, scale: 0.6, duration: 0.35, ease: "power2.in" },
              0.65 + idx * 0.04
            );
          }
        });

        // 4. Centerpiece 3D Tilt
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
    }

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!mount) return;
      const w = Math.max(mount.clientWidth || window.innerWidth, 300);
      const h = Math.max(mount.clientHeight || window.innerHeight, 300);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(animationFrameId);
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
      {/* Subtle Grid Background Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
        }}
      />

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
        {STAT_ITEMS.map((item, i) => (
          <div
            key={item.id}
            ref={(el) => (overlayCardRefs.current[i] = el)}
            className={`absolute z-20 w-[72vw] max-w-[260px] sm:max-w-[290px] border border-black/15 bg-white/95 p-5 text-ink shadow-2xl backdrop-blur-md opacity-0 transition-colors duration-300 dark:border-white/20 dark:bg-[#161422]/95 dark:text-white ${i === 0
              ? "left-[6%] top-[14%]"
              : i === 1
                ? "right-[6%] top-[14%]"
                : i === 2
                  ? "right-[6%] bottom-[14%]"
                  : "left-[6%] bottom-[14%]"
              }`}
          >
            <div className="inline-block rounded-full border border-black/20 bg-[#f4f2fa] px-2.5 py-0.5 font-display text-[10px] font-bold tracking-widest text-ink/90 uppercase dark:border-white/30 dark:bg-white/10 dark:text-white/90">
              {item.eyebrow}
            </div>
            <div className="mt-2 font-display text-4xl font-black leading-none tracking-tight text-[#8055fe] sm:text-5xl dark:text-[#9875ff]">
              {item.value}
            </div>
            <div className="mt-2 font-display text-xs font-bold text-ink sm:text-sm dark:text-white">
              {item.title}
            </div>
            <p className="mt-2 font-display text-[11px] font-normal leading-relaxed text-ink/80 sm:text-xs dark:text-white/80">
              {item.copy}
            </p>
          </div>
        ))}

        {/* Main Pinned Centerpiece Light-Theme Card */}
        <div
          ref={mainCardRef}
          className="relative z-30 w-[88vw] max-w-[340px] rounded-xl border border-black/15 bg-white p-6 text-ink shadow-2xl transition-colors duration-300 sm:max-w-[400px] sm:p-8 md:max-w-[440px] dark:border-white/20 dark:bg-[#161422] dark:text-white"
        >
          {/* Bordered pill/badge with thin outline */}
          <div className="inline-block rounded-full border border-black/20 bg-[#f4f2fa] px-3.5 py-1 font-display text-xs font-bold uppercase tracking-wider text-ink/90 dark:border-white/30 dark:bg-white/10 dark:text-white/90">
            Projects Shipped
          </div>

          {/* Purple/Plum Accent Color for 20+ */}
          <h2 className="mt-3 font-display text-6xl font-black leading-none tracking-tight text-[#8055fe] sm:text-7xl md:text-8xl dark:text-[#9875ff]">
            20+
          </h2>

          {/* High contrast dark body text */}
          <p className="mt-4 font-display text-xs font-normal leading-relaxed text-ink/80 sm:text-sm md:text-base dark:text-white/80">
            NudgeFile renames and sorts your files with a local AI — but it asks
            first, and it always has an undo button, because trusting an AI
            with your file system sight-unseen is how horror movies start.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Stats;

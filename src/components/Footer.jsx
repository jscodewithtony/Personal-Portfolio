import { useEffect, useRef, useState, useCallback } from "react";
import PianoLidContact from "./PianoLidContact";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { footerContactQuery } from "../sanity/queries";

// --- 3 OCTAVES PIANO NOTES (C3 to C6: 22 White Keys, 15 Black Keys) ---
const PIANO_NOTES = [
  // Octave 3
  { id: "C3", name: "C3", midi: 48, type: "white", whiteIndex: 0, key: null },
  { id: "C#3", name: "C#3", midi: 49, type: "black", blackAfter: 0, key: null },
  { id: "D3", name: "D3", midi: 50, type: "white", whiteIndex: 1, key: null },
  { id: "D#3", name: "D#3", midi: 51, type: "black", blackAfter: 1, key: null },
  { id: "E3", name: "E3", midi: 52, type: "white", whiteIndex: 2, key: null },
  { id: "F3", name: "F3", midi: 53, type: "white", whiteIndex: 3, key: null },
  { id: "F#3", name: "F#3", midi: 54, type: "black", blackAfter: 3, key: null },
  { id: "G3", name: "G3", midi: 55, type: "white", whiteIndex: 4, key: null },
  { id: "G#3", name: "G#3", midi: 56, type: "black", blackAfter: 4, key: null },
  { id: "A3", name: "A3", midi: 57, type: "white", whiteIndex: 5, key: null },
  { id: "A#3", name: "A#3", midi: 58, type: "black", blackAfter: 5, key: null },
  { id: "B3", name: "B3", midi: 59, type: "white", whiteIndex: 6, key: null },

  // Octave 4 (Mapped to QWERTY A..J & W..U)
  { id: "C4", name: "C4", midi: 60, type: "white", whiteIndex: 7, key: "a" },
  { id: "C#4", name: "C#4", midi: 61, type: "black", blackAfter: 7, key: "w" },
  { id: "D4", name: "D4", midi: 62, type: "white", whiteIndex: 8, key: "s" },
  { id: "D#4", name: "D#4", midi: 63, type: "black", blackAfter: 8, key: "e" },
  { id: "E4", name: "E4", midi: 64, type: "white", whiteIndex: 9, key: "d" },
  { id: "F4", name: "F4", midi: 65, type: "white", whiteIndex: 10, key: "f" },
  { id: "F#4", name: "F#4", midi: 66, type: "black", blackAfter: 10, key: "t" },
  { id: "G4", name: "G4", midi: 67, type: "white", whiteIndex: 11, key: "g" },
  { id: "G#4", name: "G#4", midi: 68, type: "black", blackAfter: 11, key: "y" },
  { id: "A4", name: "A4", midi: 69, type: "white", whiteIndex: 12, key: "h" },
  { id: "A#4", name: "A#4", midi: 70, type: "black", blackAfter: 12, key: "u" },
  { id: "B4", name: "B4", midi: 71, type: "white", whiteIndex: 13, key: "j" },

  // Octave 5 (Mapped to QWERTY K..' & O..\)
  { id: "C5", name: "C5", midi: 72, type: "white", whiteIndex: 14, key: "k" },
  { id: "C#5", name: "C#5", midi: 73, type: "black", blackAfter: 14, key: "o" },
  { id: "D5", name: "D5", midi: 74, type: "white", whiteIndex: 15, key: "l" },
  { id: "D#5", name: "D#5", midi: 75, type: "black", blackAfter: 15, key: "p" },
  { id: "E5", name: "E5", midi: 76, type: "white", whiteIndex: 16, key: ";" },
  { id: "F5", name: "F5", midi: 77, type: "white", whiteIndex: 17, key: "'" },
  { id: "F#5", name: "F#5", midi: 78, type: "black", blackAfter: 17, key: "[" },
  { id: "G5", name: "G5", midi: 79, type: "white", whiteIndex: 18, key: "z" },
  { id: "G#5", name: "G#5", midi: 80, type: "black", blackAfter: 18, key: "]" },
  { id: "A5", name: "A5", midi: 81, type: "white", whiteIndex: 19, key: "x" },
  { id: "A#5", name: "A#5", midi: 82, type: "black", blackAfter: 19, key: "\\" },
  { id: "B5", name: "B5", midi: 83, type: "white", whiteIndex: 20, key: "c" },

  // Octave 6 start
  { id: "C6", name: "C6", midi: 84, type: "white", whiteIndex: 21, key: "v" },
];

const ANCHOR_SAMPLES = [
  { midi: 48, url: "https://tonejs.github.io/audio/salamander/C3.mp3" },
  { midi: 54, url: "https://tonejs.github.io/audio/salamander/Fs3.mp3" },
  { midi: 60, url: "https://tonejs.github.io/audio/salamander/C4.mp3" },
  { midi: 66, url: "https://tonejs.github.io/audio/salamander/Fs4.mp3" },
  { midi: 72, url: "https://tonejs.github.io/audio/salamander/C5.mp3" },
  { midi: 78, url: "https://tonejs.github.io/audio/salamander/Fs5.mp3" },
  { midi: 84, url: "https://tonejs.github.io/audio/salamander/C6.mp3" },
];

const MELODY_SYMBOLS = ["🎵", "🎶", "🎼", "♩", "♪", "♫"];
const MELODY_COLORS = [
  "#8055fe",
  "#ff007f",
  "#7be500",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#a855f7",
];

function getMidiFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// `variant="about"` and `contactContent` are opt-in — only AboutPage.jsx
// passes them, so Home and CaseStudy keep rendering exactly as before.
function Footer({ variant = "site", contactContent }) {
  const isAbout = variant === "about";

  // Footer Contact singleton — the default "site" variant's content
  // source. AboutPage's own explicit `contactContent` override (sourced
  // from its own aboutPage document) still wins per-field below, since
  // spreading `undefined` for a key that isn't in the singleton doc
  // just falls through to PianoLidContact's own default parameter.
  const { data: footerDoc } = useSanityQuery(footerContactQuery, {}, null);
  const sanityContactContent = footerDoc
    ? {
        eyebrow: footerDoc.eyebrow,
        headlineLines: footerDoc.heading ? footerDoc.heading.split("\n") : undefined,
        email: footerDoc.email,
        socialLinks: footerDoc.socialLinks?.length
          ? footerDoc.socialLinks.map(({ label, url }) => ({ label, href: url }))
          : undefined,
        location: footerDoc.location,
        timezone: footerDoc.timezone,
        copyrightSuffix: footerDoc.copyrightSuffix,
      }
    : undefined;
  const mergedContactContent = { ...sanityContactContent, ...contactContent };
  const [activeKeys, setActiveKeys] = useState(new Set());

  const footerRef = useRef(null);
  const canvasRef = useRef(null);
  const keyContainerRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const bufferCacheRef = useRef(new Map());

  // Initialize AudioContext lazily
  const getAudioContext = useCallback(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-10, ctx.currentTime);
      compressor.knee.setValueAtTime(24, ctx.currentTime);
      compressor.ratio.setValueAtTime(8, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      masterGain.connect(compressor);
      compressor.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;

      // Preload real piano audio samples
      ANCHOR_SAMPLES.forEach((sample) => {
        fetch(sample.url)
          .then((res) => res.arrayBuffer())
          .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
          .then((decodedBuffer) => {
            bufferCacheRef.current.set(sample.midi, decodedBuffer);
          })
          .catch(() => { });
      });
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => { });
    }

    return { ctx: audioCtxRef.current, masterGain: masterGainRef.current };
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Acoustic piano sound synthesis fallback
  const playSynthFallback = useCallback((midi, ctx, masterGain) => {
    const freq = getMidiFrequency(midi);
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq, now);

    const osc3 = ctx.createOscillator();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(freq * 2, now);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq * 5, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 120), now + 1.8);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.75, now + 0.005);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 2.3);
    osc2.stop(now + 2.3);
    osc3.stop(now + 2.3);
  }, []);

  // Play Note Audio
  const playNoteAudio = useCallback(
    (note) => {
      const audio = getAudioContext();
      if (!audio) return;
      const { ctx, masterGain } = audio;
      if (!ctx || !masterGain) return;

      const targetMidi = note.midi;
      let closestAnchor = null;
      let minDiff = Infinity;

      bufferCacheRef.current.forEach((buffer, anchorMidi) => {
        const diff = Math.abs(anchorMidi - targetMidi);
        if (diff < minDiff) {
          minDiff = diff;
          closestAnchor = { buffer, midi: anchorMidi };
        }
      });

      if (closestAnchor) {
        try {
          const source = ctx.createBufferSource();
          source.buffer = closestAnchor.buffer;
          const semitones = targetMidi - closestAnchor.midi;
          source.playbackRate.value = Math.pow(2, semitones / 12);

          const noteGain = ctx.createGain();
          const now = ctx.currentTime;

          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.85, now + 0.004);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

          source.connect(noteGain);
          noteGain.connect(masterGain);

          source.start(now);
        } catch {
          playSynthFallback(targetMidi, ctx, masterGain);
        }
      } else {
        playSynthFallback(targetMidi, ctx, masterGain);
      }
    },
    [getAudioContext, playSynthFallback]
  );

  const whiteKeys = PIANO_NOTES.filter((n) => n.type === "white");
  const blackKeys = PIANO_NOTES.filter((n) => n.type === "black");
  const TOTAL_WHITE_KEYS = whiteKeys.length;

  // --- HIGH-PERFORMANCE CANVAS PARTICLE SYSTEM ---
  const animateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle resolution scaling
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity; // Buoyancy floating upward
      p.vx *= 0.98; // Drag/friction
      p.rot += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.isSparkle) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.font = `bold ${p.size}px sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.symbol, 0, 0);
      }
      ctx.restore();
    }

    if (particles.length > 0) {
      animFrameRef.current = requestAnimationFrame(animateParticles);
    } else {
      animFrameRef.current = null;
    }
  }, []);

  // Spawn particle burst from exact key position floating up through contact section
  const spawnParticleBurst = useCallback(
    (note) => {
      const canvas = canvasRef.current;
      const keyContainer = keyContainerRef.current;
      if (!canvas || !keyContainer) return;
      const canvasRect = canvas.getBoundingClientRect();
      const keyRect = keyContainer.getBoundingClientRect();

      const leftPercent =
        note.type === "white"
          ? (note.whiteIndex + 0.5) / TOTAL_WHITE_KEYS
          : (note.blackAfter + 1) / TOTAL_WHITE_KEYS;

      const keyOffsetX = keyRect.left - canvasRect.left;
      const keyOffsetY = keyRect.top - canvasRect.top;

      const startX = keyOffsetX + leftPercent * keyRect.width;
      const startY =
        keyOffsetY +
        (note.type === "black" ? keyRect.height * 0.35 : keyRect.height * 0.65);

      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const isSparkle = i >= 1;
        const color = MELODY_COLORS[Math.floor(Math.random() * MELODY_COLORS.length)];
        const symbol = MELODY_SYMBOLS[Math.floor(Math.random() * MELODY_SYMBOLS.length)];

        particlesRef.current.push({
          x: startX + (Math.random() - 0.5) * 16,
          y: startY,
          vx: (Math.random() - 0.5) * 3,
          vy: -2.5 - Math.random() * 2.5,
          gravity: -0.03,
          rot: (Math.random() - 0.5) * 0.4,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          size: isSparkle ? 5 + Math.random() * 5 : 18 + Math.random() * 10,
          color,
          symbol,
          isSparkle,
          alpha: 1.0,
          decay: 0.01 + Math.random() * 0.008,
        });
      }

      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(animateParticles);
      }
    },
    [TOTAL_WHITE_KEYS, animateParticles]
  );

  // --- FLOATING MUSICAL NOTES SPAWNER (FLOATS UP THROUGH PianoLidContact) ---
  useEffect(() => {
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    const SPAWN_INTERVAL_MS = 1800;

    const interval = setInterval(() => {
      if (!isVisible) return;
      if (particlesRef.current.length >= 10) return;

      const canvas = canvasRef.current;
      const keyContainer = keyContainerRef.current;
      if (canvas && keyContainer) {
        const canvasRect = canvas.getBoundingClientRect();
        const keyRect = keyContainer.getBoundingClientRect();

        const keyOffsetX = keyRect.left - canvasRect.left;
        const keyOffsetY = keyRect.top - canvasRect.top;

        const startX = keyOffsetX + (0.1 + Math.random() * 0.8) * keyRect.width;
        const startY = keyOffsetY + keyRect.height * (0.3 + Math.random() * 0.5);

        const noteSymbols = ["♪", "♫", "🎵", "🎶"];
        const symbol = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
        const color = MELODY_COLORS[Math.floor(Math.random() * MELODY_COLORS.length)];

        particlesRef.current.push({
          x: startX,
          y: startY,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -1.8 - Math.random() * 1.8,
          gravity: -0.025,
          rot: (Math.random() - 0.5) * 0.3,
          rotSpeed: (Math.random() - 0.5) * 0.015,
          size: 20 + Math.random() * 10,
          color,
          symbol,
          isSparkle: false,
          alpha: 0.9,
          decay: 0.008 + Math.random() * 0.006,
        });

        if (!animFrameRef.current) {
          animFrameRef.current = requestAnimationFrame(animateParticles);
        }
      }
    }, SPAWN_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [animateParticles]);

  const triggerNoteOn = useCallback(
    (note) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(note.id);
        return next;
      });
      spawnParticleBurst(note);
      playNoteAudio(note);
    },
    [playNoteAudio, spawnParticleBurst]
  );

  const triggerNoteOff = useCallback((note) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(note.id);
      return next;
    });
  }, []);

  const isPointerDownRef = useRef(false);
  const lastPlayedNoteIdRef = useRef(null);

  const getKeyFromPoint = useCallback((clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY);
    const keyBtn = element?.closest("[data-note-id]");
    if (!keyBtn) return null;
    const noteId = keyBtn.getAttribute("data-note-id");
    return PIANO_NOTES.find((n) => n.id === noteId) || null;
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      isPointerDownRef.current = true;
      const note = getKeyFromPoint(e.clientX, e.clientY);
      if (note) {
        lastPlayedNoteIdRef.current = note.id;
        triggerNoteOn(note);
      }
    },
    [getKeyFromPoint, triggerNoteOn]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isPointerDownRef.current) return;
      const note = getKeyFromPoint(e.clientX, e.clientY);
      if (note && note.id !== lastPlayedNoteIdRef.current) {
        if (lastPlayedNoteIdRef.current) {
          const prevNote = PIANO_NOTES.find(
            (n) => n.id === lastPlayedNoteIdRef.current
          );
          if (prevNote) triggerNoteOff(prevNote);
        }
        lastPlayedNoteIdRef.current = note.id;
        triggerNoteOn(note);
      } else if (!note && lastPlayedNoteIdRef.current) {
        const prevNote = PIANO_NOTES.find(
          (n) => n.id === lastPlayedNoteIdRef.current
        );
        if (prevNote) triggerNoteOff(prevNote);
        lastPlayedNoteIdRef.current = null;
      }
    },
    [getKeyFromPoint, triggerNoteOn, triggerNoteOff]
  );

  const handlePointerUp = useCallback(() => {
    if (isPointerDownRef.current) {
      if (lastPlayedNoteIdRef.current) {
        const prevNote = PIANO_NOTES.find(
          (n) => n.id === lastPlayedNoteIdRef.current
        );
        if (prevNote) triggerNoteOff(prevNote);
      }
      isPointerDownRef.current = false;
      lastPlayedNoteIdRef.current = null;
    }
  }, [triggerNoteOff]);

  // Global pointer up / move listener for seamless glissando swipe across keys
  useEffect(() => {
    const onWindowPointerMove = (e) => {
      if (isPointerDownRef.current) {
        handlePointerMove(e);
      }
    };
    const onWindowPointerUp = () => {
      handlePointerUp();
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // QWERTY keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target.isContentEditable
      ) {
        return;
      }
      if (e.repeat) return;

      const keyChar = e.key.toLowerCase();
      const note = PIANO_NOTES.find((n) => n.key === keyChar);
      if (note) {
        e.preventDefault();
        triggerNoteOn(note);
      }
    };

    const handleKeyUp = (e) => {
      const keyChar = e.key.toLowerCase();
      const note = PIANO_NOTES.find((n) => n.key === keyChar);
      if (note) {
        triggerNoteOff(note);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [triggerNoteOn, triggerNoteOff]);

  return (
    <footer
      ref={footerRef}
      className={
        "relative z-30 w-full overflow-hidden transition-colors duration-300 select-none py-6 " +
        (isAbout
          ? "bg-primary text-white dark:bg-[#161616] dark:text-[#fafafa]"
          : "bg-bg text-ink dark:bg-[#0c0a14] dark:text-white")
      }
    >
      {/* REAL-TIME CANVAS PARTICLE LAYER (FLOATS UP ACROSS FULL FOOTER & PianoLidContact) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      />

      {/* Contact / outro panel */}
      <PianoLidContact variant={variant} {...mergedContactContent} />

      {/* --- 100% FULL WIDTH EDGE-TO-EDGE TALL PIANO KEYBOARD --- */}
      <div
        className={
          "relative w-full overflow-hidden border-t border-b shadow-2xl " +
          (isAbout
            ? "border-black/40 bg-[#161616] dark:border-white/20 dark:bg-[#12101b]"
            : "border-[#0013B2] bg-[#114AFC] dark:border-white/20 dark:bg-[#12101b]")
        }
      >
        <div className="overflow-x-auto overflow-y-hidden no-scrollbar w-full">
          <div
            ref={keyContainerRef}
            onPointerDown={handlePointerDown}
            className="relative h-64 sm:h-80 md:h-[24rem] lg:h-[28rem] xl:h-[32rem] min-w-[760px] w-full flex touch-none overflow-hidden"
          >
            {/* NATURAL NOTES LAYER */}
            {whiteKeys.map((note) => {
              const isActive = activeKeys.has(note.id);
              return (
                <button
                  key={note.id}
                  type="button"
                  data-note-id={note.id}
                  aria-label={`Piano key ${note.name}`}
                  className={
                    isAbout
                      ? `relative flex-1 h-full border-r border-black/40 dark:border-black/20 rounded-b-[6px] transition-colors duration-75 outline-none ${isActive
                        ? "bg-[#e3f900] dark:bg-[#cbd5e1] shadow-inner translate-y-[3px]"
                        : "bg-white hover:bg-[#e3f900] dark:bg-white dark:hover:bg-[#f1f5f9]"
                      }`
                      : `relative flex-1 h-full border-r border-[#0013B2] dark:border-black/20 rounded-b-[6px] transition-colors duration-75 outline-none ${isActive
                        ? "bg-[#0013B2] dark:bg-[#cbd5e1] shadow-inner translate-y-[3px]"
                        : "bg-[#114AFC] hover:bg-[#022CDB] dark:bg-white dark:hover:bg-[#f1f5f9]"
                      }`
                  }
                />
              );
            })}

            {/* SHARP NOTES LAYER */}
            {blackKeys.map((note) => {
              const isActive = activeKeys.has(note.id);
              // Position black key over the boundary line of its corresponding white key index
              const leftPercent = ((note.blackAfter + 1) / TOTAL_WHITE_KEYS) * 100;

              return (
                <button
                  key={note.id}
                  type="button"
                  data-note-id={note.id}
                  aria-label={`Piano black key ${note.name}`}
                  style={{
                    left: `calc(${leftPercent}% - 1.15rem)`,
                  }}
                  className={
                    isAbout
                      ? `absolute top-0 z-20 h-[60%] w-8 sm:w-10 md:w-12 lg:w-14 rounded-b-[6px] shadow-xl transition-colors duration-75 outline-none ${isActive
                        ? "bg-[#3a3a3a] dark:bg-[#332f48] translate-y-[3px]"
                        : "bg-black hover:bg-[#262626] dark:bg-black dark:hover:bg-[#1a1a1a]"
                      }`
                      : `absolute top-0 z-20 h-[60%] w-8 sm:w-10 md:w-12 lg:w-14 rounded-b-[6px] shadow-xl transition-colors duration-75 outline-none ${isActive
                        ? "bg-[#2a2640] dark:bg-[#332f48] translate-y-[3px]"
                        : "bg-[#12101b] dark:bg-black hover:bg-[#1f1c2d] dark:hover:bg-[#1a1a1a]"
                      }`
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

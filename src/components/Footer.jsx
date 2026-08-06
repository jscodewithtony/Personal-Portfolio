import { useEffect, useRef, useState, useCallback } from "react";

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

function Footer() {
  const [activeKeys, setActiveKeys] = useState(new Set());

  const canvasRef = useRef(null);
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
          .catch(() => {});
      });
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
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
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.font = `bold ${p.size}px sans-serif`;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
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

  // Spawn particle burst from the exact key position
  const spawnParticleBurst = useCallback(
    (note) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || canvas.width;
      const height = rect.height || canvas.height;

      const leftPercent =
        note.type === "white"
          ? (note.whiteIndex + 0.5) / TOTAL_WHITE_KEYS
          : (note.blackAfter + 1) / TOTAL_WHITE_KEYS;

      const startX = leftPercent * width;
      const startY = note.type === "black" ? height * 0.45 : height * 0.7;

      // Burst of 4 to 6 particles (notes + sparkling dots)
      const count = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const isSparkle = i >= 2;
        const color = MELODY_COLORS[Math.floor(Math.random() * MELODY_COLORS.length)];
        const symbol = MELODY_SYMBOLS[Math.floor(Math.random() * MELODY_SYMBOLS.length)];

        particlesRef.current.push({
          x: startX + (Math.random() - 0.5) * 16,
          y: startY,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -3.5 - Math.random() * 4.5,
          gravity: -0.06, // floating buoyancy
          rot: (Math.random() - 0.5) * 0.6,
          rotSpeed: (Math.random() - 0.5) * 0.1,
          size: isSparkle ? 6 + Math.random() * 8 : 22 + Math.random() * 14,
          color,
          symbol,
          isSparkle,
          alpha: 1.0,
          decay: 0.016 + Math.random() * 0.014,
        });
      }

      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(animateParticles);
      }
    },
    [TOTAL_WHITE_KEYS, animateParticles]
  );

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
    <footer id="contact" className="relative z-10 w-full overflow-hidden bg-bg text-ink transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white select-none">
      {/* --- GRAND PIANO BODY SILHOUETTE WITH CONTACT INFO --- */}
      <div className="relative w-full bg-bg dark:bg-[#0c0a14] pt-8">
        <div className="relative w-full overflow-hidden min-h-[360px] sm:min-h-[420px] md:min-h-[480px] flex flex-col justify-end pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-14 md:pb-16">
          {/* Authentic Grand Piano Lid Silhouette Curve SVG */}
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full fill-black dark:fill-[#08070e] pointer-events-none"
          >
            <path d="M 0,140 C 0,40 120,0 320,0 C 480,0 580,100 760,200 C 880,260 950,275 1000,280 L 1000,600 L 0,600 Z" />
          </svg>

          {/* Content inside Grand Piano Body */}
          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-12 md:px-16 flex flex-col justify-between gap-10 md:flex-row md:items-end my-auto">
            {/* Left side: Contact header, email, phone, social links */}
            <div className="flex flex-col gap-4 text-white max-w-xl">
              <h2 className="font-display text-5xl font-black uppercase tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-none text-white select-none">
                CONTACT
              </h2>

              <div className="flex flex-col gap-1.5 font-display text-sm sm:text-base md:text-lg font-medium text-white/90">
                <a
                  href="mailto:Tony2742000@gmail.com"
                  className="transition-colors hover:text-[#8055fe] w-fit"
                >
                  Tony2742000@gmail.com
                </a>
                <a
                  href="tel:+916283860380"
                  className="transition-colors hover:text-[#8055fe] w-fit"
                >
                  +916283860380
                </a>
              </div>

              <div className="flex items-center gap-6 font-display text-sm sm:text-base font-semibold text-white mt-1">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-opacity hover:opacity-80"
                >
                  LinkedIn
                </a>
                <a
                  href="https://behance.net"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-opacity hover:opacity-80"
                >
                  Behance
                </a>
              </div>
            </div>

            {/* Right side: Nav links safely positioned inside the black piano body */}
            <div className="flex flex-col gap-3 font-display text-sm sm:text-base md:text-lg font-bold uppercase tracking-widest text-white/90 md:pb-4 md:text-right">
              <a
                href="#about"
                className="transition-colors hover:text-[#8055fe]"
              >
                ABOUT
              </a>
              <a
                href="#projects"
                className="transition-colors hover:text-[#8055fe]"
              >
                PROJECTS
              </a>
              <a
                href="#hero"
                className="transition-colors hover:text-[#8055fe]"
              >
                CONTACT
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* --- THIN ACCENT SEPARATOR LINE --- */}
      <div className="w-full border-t border-[#8b0000]/70 dark:border-white/20" />

      {/* --- 100% FULL WIDTH EDGE-TO-EDGE TALL PIANO KEYBOARD --- */}
      <div className="relative w-full overflow-hidden border-b border-[#a0aab8] bg-[#f8f9fa] shadow-2xl dark:border-white/20 dark:bg-[#12101b]">
        <div className="overflow-x-auto overflow-y-hidden no-scrollbar w-full">
          <div
            onPointerDown={handlePointerDown}
            className="relative h-64 sm:h-80 md:h-[24rem] lg:h-[28rem] xl:h-[32rem] min-w-[760px] w-full flex touch-none overflow-hidden"
          >
            {/* REAL-TIME CANVAS PARTICLE LAYER */}
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 z-30 h-full w-full"
            />

            {/* WHITE KEYS LAYER */}
            {whiteKeys.map((note) => {
              const isActive = activeKeys.has(note.id);
              return (
                <button
                  key={note.id}
                  type="button"
                  data-note-id={note.id}
                  aria-label={`Piano key ${note.name}`}
                  className={`relative flex-1 h-full border-r border-[#bac4d0] dark:border-white/20 rounded-b-[6px] transition-colors duration-75 outline-none ${
                    isActive
                      ? "bg-[#e2e8f0] dark:bg-[#342b58] shadow-inner translate-y-[3px]"
                      : "bg-white dark:bg-[#1a1728] hover:bg-[#f1f5f9] dark:hover:bg-[#25203a]"
                  }`}
                />
              );
            })}

            {/* BLACK KEYS LAYER */}
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
                  className={`absolute top-0 z-20 h-[60%] w-8 sm:w-10 md:w-12 lg:w-14 rounded-b-[6px] shadow-xl transition-colors duration-75 outline-none ${
                    isActive
                      ? "bg-[#2c2c2c] dark:bg-[#524484] translate-y-[3px]"
                      : "bg-black dark:bg-[#05040a] hover:bg-[#1a1a1a]"
                  }`}
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

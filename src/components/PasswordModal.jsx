import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { unlockProject } from "../utils/unlockedProjects";

function PasswordModalDialog({ project, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);
  const isSuccessRef = useRef(false);

  useEffect(() => {
    // Preserve scroll position (iOS Safari & desktop) and pause Lenis smooth scroll
    // Reuses exact mechanism from MenuOverlay.jsx
    if (document.body.style.position !== "fixed") {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      if (window.lenis) window.lenis.stop();
    }

    inputRef.current?.focus({ preventScroll: true });

    return () => {
      // Unmount cleanup for scroll lock: restore scroll position and restart Lenis
      if (document.body.style.position === "fixed") {
        const topStr = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        if (!isSuccessRef.current) {
          window.scrollTo(0, parseInt(topStr || "0") * -1);
        }
        if (window.lenis) window.lenis.start();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project) return;

    const expected = (project.caseStudyPassword || "").trim();
    const entered = password.trim();

    if (expected && entered === expected) {
      isSuccessRef.current = true;
      setErrorMessage("");
      unlockProject(project.slug);
      if (onSuccess) {
        onSuccess(project.slug);
      }
    } else {
      setErrorMessage("Incorrect password. Please try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.select();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
    >
      {/* Ambient Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-colors"
      />

      {/* Modal Container — exact Figma node 1041:434 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0,
        }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1],
          x: { duration: 0.4, ease: "easeInOut" },
        }}
        className="relative w-full max-w-[496px] border border-ink/10 bg-[#fbfbf9] p-8 text-[#0d0c14] shadow-[0_24px_64px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-[#12111a] dark:text-white dark:shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)]"
      >
        {/* Header: Protected Tag + Close Icon */}
        <div className="flex w-full items-center justify-between">
          <div className="flex h-[34px] items-center gap-[6px] border border-[rgba(13,12,20,0.15)] px-3 py-1 dark:border-white/15">
            <span className="h-[6px] w-[6px] rounded-full bg-[#0d38bf] dark:bg-[#114AFC]" />
            <span className="font-display text-[10px] font-bold uppercase tracking-[2px] text-[rgba(13,12,20,0.8)] dark:text-white/80">
              Protected Case Study
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {/* Title & Description */}
        <div className="mt-5 flex flex-col items-start w-full">
          <h2
            id="password-modal-title"
            className="font-display text-[30px] font-bold uppercase leading-[36px] tracking-[-0.75px] text-[#0d0c14] dark:text-white"
          >
            {project.title}
          </h2>
          <p className="mt-2 font-display text-[14px] font-normal leading-[22.75px] normal-case text-[rgba(13,12,20,0.6)] dark:text-white/60">
            This case study is under a confidential NDA. Please enter the password provided to access the full work.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col w-full">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="ENTER PASSWORD…"
              className="h-[50px] w-full border border-[rgba(13,12,20,0.15)] bg-white/70 px-4 font-display text-[14px] uppercase tracking-[0.35px] text-ink placeholder:text-[rgba(13,12,20,0.4)] focus:border-[#0d38bf] focus:outline-none focus:ring-1 focus:ring-[#0d38bf]/20 dark:border-white/15 dark:bg-black/40 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#114AFC] dark:focus:ring-[#114AFC]/30"
            />

            {errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 font-display text-xs font-semibold normal-case text-red-500 dark:text-red-400"
              >
                {errorMessage}
              </motion.p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col gap-3 items-center w-full">
            <button
              type="submit"
              className="flex h-[48px] w-full items-center justify-center bg-[#0d38bf] font-display text-[16px] font-bold uppercase tracking-[-0.6px] text-white shadow-[0px_10px_7.5px_rgba(13,56,191,0.25),0px_4px_3px_rgba(13,56,191,0.25)] transition-all hover:bg-[#0b2fa3] active:scale-[0.99] dark:bg-[#114AFC] dark:shadow-[0px_10px_15px_rgba(17,74,252,0.3)] dark:hover:bg-[#0d3ecf]"
            >
              Unlock Case Study
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-[40px] w-full items-center justify-center font-display text-[12px] font-bold uppercase tracking-[0.6px] text-[rgba(13,12,20,0.6)] transition-colors hover:text-[#0d0c14] dark:text-white/60 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * Case Study Password Modal (Soft NDA Gate)
 * Exact Figma Implementation (Node 1041:434)
 */
export default function PasswordModal({ isOpen, onClose, project, onSuccess }) {
  useEffect(() => {
    return () => {
      // Unmount cleanup for scroll lock safety
      if (document.body.style.position === "fixed") {
        const topStr = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, parseInt(topStr || "0") * -1);
        if (window.lenis) window.lenis.start();
      }
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && project && (
        <PasswordModalDialog
          key={project.slug}
          project={project}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}

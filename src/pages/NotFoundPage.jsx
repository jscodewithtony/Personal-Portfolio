import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useSeo } from "../hooks/useSeo";
import CanvasCursor from "../components/CanvasCursor";
import Reveal from "../components/Reveal";
import DirectionHover from "../components/DirectionHover";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

// Catch-all for any path no route matches. Same shell, header, footer,
// and primary-button treatment as the other pages so an unknown URL
// still reads as part of the site rather than a blank app shell.
//
// Note: the server still returns HTTP 200 for these (the .htaccess
// rewrite serves index.html for every path — a client-side router can't
// change the status code). A real 404 status, plus a noindex meta here,
// needs SSR/prerendering.
function NotFoundPage({ theme, onToggleTheme }) {
  useSeo({
    title: "Page not found",
    description: "That page doesn't exist. Head back to the homepage or browse selected work.",
  });

  const menuButtonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-shell relative min-h-[100dvh] bg-bg font-display text-ink uppercase transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
      <CanvasCursor />
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <section className="flex w-full flex-col items-start px-6 pb-24 pt-14 sm:px-10 sm:pt-16 md:px-14 md:pb-32 md:pt-20 lg:px-16">
        <Reveal as="p" className="font-display text-sm font-normal tracking-wide text-ink/70 dark:text-white/70 sm:text-base">
          [ 404 ]
        </Reveal>
        <Reveal
          as="h1"
          delay={100}
          className="mt-6 max-w-7xl font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl lg:text-[7rem]"
        >
          This page wandered off.
        </Reveal>
        <Reveal
          as="p"
          delay={200}
          className="mt-8 max-w-xl font-display text-base font-normal normal-case leading-relaxed text-ink/80 dark:text-white/80 sm:text-lg"
        >
          The link might be old, or the address has a typo. Either way, there&rsquo;s nothing here.
        </Reveal>
        {/* Primary button + plain DirectionHover text link — both are
            existing patterns (SayHiPage); the site has no secondary/
            outlined button variant, so none is invented here. */}
        <Reveal delay={300} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            to="/"
            className="select-none bg-primary px-9 py-4 font-display text-base font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-85 active:scale-[0.98]"
          >
            <DirectionHover>Back home</DirectionHover>
          </Link>
          <Link
            to="/work"
            className="select-none font-display text-xl font-medium uppercase"
          >
            <DirectionHover>See the work</DirectionHover>
          </Link>
        </Reveal>
      </section>

      <Suspense fallback={null}>
        <Footer />
        <MenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
        />
      </Suspense>
    </div>
  );
}

export default NotFoundPage;

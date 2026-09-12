import { lazy, Suspense, useRef, useState } from "react";
import Header from "../components/Header";
import { useSeo } from "../hooks/useSeo";
import WorkIndex from "../components/WorkIndex";
import CanvasCursor from "../components/CanvasCursor";
import ProjectContactForm from "../components/ProjectContactForm";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

function WorkPage({ theme, onToggleTheme }) {
  useSeo({
    title: "Work",
    description:
      "Selected product design case studies — design systems, AI-powered tools, and end-to-end product work from research through shipped UI.",
    path: "/work",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  return (
    <div className="site-shell relative min-h-[100dvh] bg-bg font-display text-ink uppercase transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <WorkIndex />

      <ProjectContactForm />

      <Suspense fallback={null}>
        <Footer />
        <MenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
        />
      </Suspense>
      <CanvasCursor />
    </div>
  );
}

export default WorkPage;

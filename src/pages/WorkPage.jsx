import { lazy, Suspense, useRef, useState } from "react";
import Header from "../components/Header";
import { useSeo } from "../hooks/useSeo";
import WorkIndex from "../components/WorkIndex";
import WorkGallery from "../components/WorkGallery";
import CanvasCursor from "../components/CanvasCursor";
import ProjectContactForm from "../components/ProjectContactForm";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { siteSettingsQuery } from "../sanity/queries";

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

  // "classic" is the safe default: it renders unless the field is
  // confidently read as "gallery". Loading, empty (doc/field unset),
  // and error states all fall through to classic rather than flashing
  // or guessing.
  const { data: siteSettings, status: siteSettingsStatus } = useSanityQuery(
    siteSettingsQuery,
    {},
    null,
  );
  const useGalleryTemplate =
    siteSettingsStatus === "ready" && siteSettings?.workPageTemplate === "gallery";

  return (
    <div className="site-shell relative min-h-[100dvh] bg-bg font-display text-ink uppercase transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {useGalleryTemplate ? <WorkGallery /> : <WorkIndex />}

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

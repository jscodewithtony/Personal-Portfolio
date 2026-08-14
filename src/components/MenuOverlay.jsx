import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { navigationQuery } from "../sanity/queries";

// Original hardcoded nav, kept as the fallback for the "empty"/"error"
// Sanity states so the menu is never left with nothing to show. "About"
// now points at the dedicated /about route instead of a same-page anchor.
const FALLBACK_LINKS = [
  { label: "Work", link: "#" },
  { label: "About", link: "/about" },
  { label: "Contact", link: "#" },
  { label: "Resume", link: "#" },
];

function MenuOverlay({ open, onClose, anchorRef }) {
  const overlayRef = useRef(null);
  const linksRef = useRef(null);
  const firstLinkRef = useRef(null);

  const { data: navigation, status } = useSanityQuery(
    navigationQuery,
    {},
    null
  );
  const links =
    status === "ready" && navigation?.items?.length
      ? navigation.items
      : FALLBACK_LINKS;

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const rect = anchorRef.current?.getBoundingClientRect();
    const originX = rect
      ? ((rect.left + rect.width / 2) / window.innerWidth) * 100
      : 90;
    const originY = rect
      ? ((rect.top + rect.height / 2) / window.innerHeight) * 100
      : 8;

    gsap.killTweensOf(overlay);

    if (open) {
      gsap.set(overlay, {
        display: "flex",
        clipPath: `circle(1% at ${originX}% ${originY}%)`,
      });
      gsap.to(overlay, {
        clipPath: `circle(141% at ${originX}% ${originY}%)`,
        duration: reduceMotion ? 0.2 : 1.05,
        ease: reduceMotion ? "power1.out" : "elastic.out(1, 0.78)",
      });

      if (linksRef.current) {
        gsap.fromTo(
          linksRef.current.children,
          { y: 28, opacity: 0, filter: "blur(6px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: reduceMotion ? 0.15 : 0.55,
            ease: "power3.out",
            stagger: reduceMotion ? 0 : 0.05,
            delay: reduceMotion ? 0 : 0.3,
          }
        );
      }

      firstLinkRef.current?.focus({ preventScroll: true });
    } else {
      gsap.to(overlay, {
        clipPath: `circle(1% at ${originX}% ${originY}%)`,
        duration: reduceMotion ? 0.15 : 0.55,
        ease: "power3.in",
        onComplete: () => gsap.set(overlay, { display: "none" }),
      });
      anchorRef.current?.focus({ preventScroll: true });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      id="site-menu"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      aria-hidden={!open}
      className="fixed inset-0 z-50 hidden flex-col items-center justify-center gap-10 bg-bg/95 text-ink backdrop-blur-2xl dark:bg-[#0c0a14]/95 dark:text-white"
      style={{ clipPath: "circle(1% at 90% 8%)" }}
    >
      <nav
        ref={linksRef}
        className="flex flex-col items-center gap-4 md:gap-6"
      >
        {links.map((item, i) => {
          const isRoute = item.link?.startsWith("/");
          const linkClassName =
            "font-display text-5xl font-black tracking-tight opacity-90 transition-[opacity,transform] duration-200 ease-snap hover:opacity-100 active:scale-[0.97] sm:text-6xl md:text-7xl focus:outline-none focus-visible:outline-none";

          // Real routes (e.g. /about) navigate client-side via react-router
          // so they don't force a full page reload; same-page anchors
          // (e.g. #contact) and external links keep the plain <a>.
          return isRoute ? (
            <Link
              key={item.link + item.label}
              ref={i === 0 ? firstLinkRef : null}
              to={item.link}
              onClick={onClose}
              tabIndex={open ? 0 : -1}
              className={linkClassName}
            >
              {item.label}
            </Link>
          ) : (
            <a
              key={item.link + item.label}
              ref={i === 0 ? firstLinkRef : null}
              href={item.link}
              tabIndex={open ? 0 : -1}
              className={linkClassName}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

export default MenuOverlay;

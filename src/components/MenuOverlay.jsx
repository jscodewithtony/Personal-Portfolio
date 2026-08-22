import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import gsap from "gsap";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { navigationQuery } from "../sanity/queries";
import Logo from "./Logo";

// Figma: https://www.figma.com/design/I84MayZQYr2Bri3Se2lfRT/Personal-Portfolio?node-id=716-783
// "Menu page - mobile". Solid blue full-bleed panel, always this color
// regardless of site theme (matching the About page's own deliberate
// blue-regardless-of-toggle treatment) — not a themed dark/light
// overlay like this component used to be.

// Original hardcoded nav, kept as the fallback for the "empty"/"error"
// Sanity states so the menu is never left with nothing to show. "About"
// now points at the dedicated /about route instead of a same-page anchor.
const FALLBACK_LINKS = [
  { label: "Work", link: "/work" },
  { label: "About", link: "/about" },
  { label: "Say Hi", link: "mailto:tony2742000@gmail.com" },
  { label: "Resume", link: "#" },
];

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "behance", href: "#" },
  { label: "Instagram", href: "#" },
];
const CONTACT_EMAIL = "Tony2742000@gmail.com";

function MenuOverlay({ open, onClose, anchorRef }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
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

      // Same stagger/fade/blur entrance as before, now applied to every
      // direct block of content (header row, nav links, contact/social
      // footer) instead of just the nav links, so the whole redesigned
      // panel settles in together.
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.children,
          { y: 28, opacity: 0, filter: "blur(6px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: reduceMotion ? 0.15 : 0.55,
            ease: "power3.out",
            stagger: reduceMotion ? 0 : 0.08,
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

  const navLinkClassName =
    "font-display text-4xl font-bold uppercase tracking-tight text-white transition-opacity duration-200 ease-snap hover:opacity-80 active:scale-[0.97] sm:text-3xl focus:outline-none focus-visible:outline-none";

  return (
    <div
      id="site-menu"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      aria-hidden={!open}
      className="fixed inset-0 z-50 hidden flex-col overflow-y-auto bg-[#114AFC] dark:bg-[#0c0a14] px-5 pb-10 pt-6 text-white"
      style={{ clipPath: "circle(1% at 90% 8%)" }}
    >
      <div ref={contentRef} className="flex flex-1 flex-col">
        {/* Top row — logo/wordmark left, close button right (hidden since Header renders on top of the menu overlay) */}
        <div className="hidden items-center justify-between">
          <Link
            to="/"
            aria-label="Home"
            onClick={onClose}
            className="flex items-center text-white"
          >
            <Logo className="h-6 w-auto sm:h-7" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center text-white transition-transform active:scale-90"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Nav links — left-aligned, stacked (adjusted margin-top to clear Header) */}
        <nav className="mt-24 flex flex-col items-start gap-5 sm:mt-40 sm:gap-8">
          {links.map((item, i) => {
            const isRoute = item.link?.startsWith("/");

            // Real routes (e.g. /about) navigate client-side via
            // react-router so they don't force a full page reload;
            // same-page anchors (e.g. #contact) and external links
            // keep the plain <a>.
            return isRoute ? (
              <Link
                key={item.link + item.label}
                ref={i === 0 ? firstLinkRef : null}
                to={item.link}
                onClick={onClose}
                tabIndex={open ? 0 : -1}
                className={navLinkClassName}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.link + item.label}
                ref={i === 0 ? firstLinkRef : null}
                href={item.link}
                tabIndex={open ? 0 : -1}
                className={navLinkClassName}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Contact + Social footer */}
        <div className="mt-8 flex flex-col gap-6 pt-4 sm:mt-12 sm:gap-8">
          <div className="flex flex-col items-start gap-1.5 sm:gap-3">
            <p className="font-display text-sm font-normal uppercase tracking-wide text-white/80">
              Contact
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              tabIndex={open ? 0 : -1}
              className="font-display text-lg font-normal normal-case text-white transition-opacity hover:opacity-80 focus:outline-none focus-visible:outline-none"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="flex flex-col items-start gap-3 sm:gap-4">
            <p className="font-display text-sm font-normal uppercase tracking-wide text-white/80">
              Social
            </p>
            <div className="flex flex-col items-start gap-2 sm:gap-3">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  tabIndex={open ? 0 : -1}
                  className="font-display text-lg font-normal normal-case text-white transition-opacity hover:opacity-80 focus:outline-none focus-visible:outline-none"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuOverlay;

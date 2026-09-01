import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import gsap from "gsap";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { navigationQuery } from "../sanity/queries";
import Logo from "./Logo";
import DirectionHover from "./DirectionHover";

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
  { label: "Say Hi", link: "/say-hi" },
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
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      if (window.lenis) window.lenis.stop();

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
        onComplete: () => {
          gsap.set(overlay, { display: "none" });

          if (document.body.style.position === 'fixed') {
            const topStr = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(topStr || '0') * -1);
            if (window.lenis) window.lenis.start();
          }
        },
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

  useEffect(() => {
    return () => {
      // Unmount cleanup for scroll lock
      if (document.body.style.position === 'fixed') {
        const topStr = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(topStr || '0') * -1);
        if (window.lenis) window.lenis.start();
      }
    };
  }, []);

  const navLinkClassName =
    "font-display text-[clamp(3.75rem,1.86rem+6.85vw,6.25rem)] leading-none font-normal normal-case tracking-tight text-ink dark:text-white active:scale-[0.97] focus:outline-none focus-visible:outline-none";

  return (
    <div
      id="site-menu"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      aria-hidden={!open}
      className="fixed inset-0 z-50 hidden flex-col overflow-y-auto bg-bg dark:bg-[#0c0a14] px-[clamp(1.25rem,-0.07rem+4.79vw,3rem)] pb-10 pt-6 text-ink dark:text-white"
      style={{ clipPath: "circle(1% at 90% 8%)" }}
    >
      <div ref={contentRef} className="flex flex-1 flex-col">
        {/* Top row — logo/wordmark left, close button right (hidden since Header renders on top of the menu overlay) */}
        <div className="hidden items-center justify-between">
          <Link
            to="/"
            aria-label="Home"
            onClick={onClose}
            className="flex items-center text-ink dark:text-white"
          >
            <Logo className="h-[clamp(1.5rem,0.75rem+2.74vw,2.5rem)] w-auto" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center text-ink dark:text-white transition-transform active:scale-90"
          >
            <X className="h-[clamp(1.5rem,0.75rem+2.74vw,2.5rem)] w-[clamp(1.5rem,0.75rem+2.74vw,2.5rem)]" />
          </button>
        </div>

        {/* Nav links — left-aligned, stacked (adjusted margin-top to clear Header) */}
        <nav className="mt-24 flex flex-col items-start gap-0 sm:gap-[clamp(0.375rem,_-0.465rem_+_3.075vw,_1.5rem)] sm:mt-40">
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
                <DirectionHover>{item.label}</DirectionHover>
              </Link>
            ) : (
              <a
                key={item.link + item.label}
                ref={i === 0 ? firstLinkRef : null}
                href={item.link}
                tabIndex={open ? 0 : -1}
                className={navLinkClassName}
              >
                <DirectionHover>{item.label}</DirectionHover>
              </a>
            );
          })}
        </nav>

        {/* Contact + Social footer */}
        <div className="mt-8 flex flex-col gap-[clamp(1.5rem,0.37rem+4.11vw,3rem)] pt-4 sm:mt-12">
          <div className="flex flex-col items-start gap-1.5 sm:gap-3">
            <p className="font-display text-[clamp(0.875rem,0.59rem+1.03vw,1.25rem)] font-normal uppercase tracking-wide text-ink/80 dark:text-white/80">
              Contact
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              tabIndex={open ? 0 : -1}
              className="font-display text-[clamp(1.125rem,0.47rem+2.4vw,2rem)] font-normal normal-case text-ink dark:text-white focus:outline-none focus-visible:outline-none"
            >
              <DirectionHover>{CONTACT_EMAIL}</DirectionHover>
            </a>
          </div>
          <div className="flex flex-col items-start gap-3 sm:gap-4">
            <p className="font-display text-[clamp(0.875rem,0.59rem+1.03vw,1.25rem)] font-normal uppercase tracking-wide text-ink/80 dark:text-white/80">
              Social
            </p>
            <div className="flex flex-col items-start gap-2 sm:gap-3">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  tabIndex={open ? 0 : -1}
                  className="font-display text-[clamp(1.125rem,0.47rem+2.4vw,2rem)] font-normal normal-case text-ink dark:text-white focus:outline-none focus-visible:outline-none"
                >
                  <DirectionHover>{label}</DirectionHover>
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

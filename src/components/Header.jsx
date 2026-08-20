import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import AnimatedThemeToggler from "./AnimatedThemeToggler";
import Logo from "./Logo";

// Figma: https://www.figma.com/design/I84MayZQYr2Bri3Se2lfRT/Personal-Portfolio?node-id=526-3749
// "Input/Nav bar". Only a desktop variant was provided, so that spec is
// applied at lg: and up; below that the existing hamburger + MenuOverlay
// behavior is unchanged.
const NAV_LINKS = [
  { label: "About", to: "/about" },
  { label: "Work", to: "/#featured-projects" },
  { label: "Contact", to: "/#contact" },
];

// Minimum scroll delta (px) before a direction change is acted on —
// stops the bar flickering in/out on the sub-pixel jitter some
// trackpads/mobile browsers report on an otherwise-still page.
const SCROLL_DELTA_THRESHOLD = 4;

function Header({ menuButtonRef, menuOpen, onToggle, theme, onToggleTheme }) {
  const isDark = theme === "dark";
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef(null);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      // Coalesces bursts of scroll events into at most one measurement
      // per animation frame, rather than reacting to every raw event.
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY <= 0) {
          setHidden(false);
        } else if (delta > SCROLL_DELTA_THRESHOLD) {
          setHidden(true); // scrolling down
        } else if (delta < -SCROLL_DELTA_THRESHOLD) {
          setHidden(false); // scrolling up
        }

        lastScrollY.current = currentY;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-[60] flex items-center justify-between bg-transparent px-6 py-6 transition-[transform,colors] duration-300 ease-out md:px-12 md:py-8 lg:px-24 lg:py-8 ${hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
    >
      {/* Wordmark + (desktop-only) role subtitle */}
      <div className="flex items-center lg:w-[332px] lg:shrink-0 lg:gap-[39px] lg:tracking-[-1px]">
        <Link
          to="/"
          aria-label="Home"
          className={`transition-colors duration-300 flex items-center ${menuOpen ? "text-white" : "text-ink dark:text-white"
            }`}
        >
          <Logo className="h-6 w-auto sm:h-7 md:h-8 lg:h-[38px]" />
        </Link>
        <span
          className={`hidden whitespace-nowrap font-display text-base font-medium normal-case leading-[42px] transition-colors duration-300 lg:inline ${menuOpen ? "text-white" : "text-ink dark:text-white"
            }`}
        >
          Product Designer
        </span>
      </div>

      {/* Desktop nav links — right-anchored, sitting just before the
          theme toggle rather than spread across the header. */}
      <nav className="hidden lg:ml-auto lg:mr-12 lg:flex lg:items-center lg:gap-10">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="font-display text-[28px] font-normal normal-case tracking-[-1px] text-ink transition-opacity hover:opacity-70 dark:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
        {/* Desktop circular theme toggle — reuses AnimatedThemeToggler's
            existing toggle/view-transition logic via custom children
            instead of its default (borderless icon) render. */}
        <AnimatedThemeToggler
          theme={theme}
          onThemeChange={onToggleTheme}
          variant="rectangle"
          duration={500}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform active:scale-90 lg:flex dark:bg-[#282828] dark:text-white"
        >
          {isDark ? (
            <Moon className="h-[22px] w-[22px]" />
          ) : (
            <Sun className="h-[22px] w-[22px]" />
          )}
        </AnimatedThemeToggler>

        {/* Existing icon-only toggle, kept for mobile/tablet since no
            small-screen variant of the toggle was in the Figma node. */}
        <AnimatedThemeToggler
          theme={theme}
          onThemeChange={onToggleTheme}
          variant="rectangle"
          duration={500}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className={`flex items-center justify-center rounded-full p-2 transition-[color,transform,background-color] duration-200 active:scale-90 hover:bg-black/5 lg:hidden dark:hover:bg-white/10 ${menuOpen ? "text-white" : "text-ink dark:text-white"
            }`}
        />

        {/* Mobile MENU button — same MenuOverlay this already drives, hidden at lg: since the links render inline there instead. */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onToggle}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={`flex items-center gap-1.5 font-display font-black text-sm sm:text-base md:text-lg uppercase tracking-wider transition-[color,transform] duration-200 active:scale-[0.96] focus:outline-none focus-visible:outline-none lg:hidden ${menuOpen ? "text-white" : "text-ink dark:text-white"
            }`}
        >
          MENU
          <span
            aria-hidden="true"
            className={`inline-block transition-transform duration-500 ${menuOpen ? "rotate-45" : "rotate-0"
              }`}
          >
            +
          </span>
        </button>
      </div>
    </header>
  );
}

export default Header;

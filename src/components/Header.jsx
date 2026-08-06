function Header({ menuButtonRef, menuOpen, onToggle, theme, onToggleTheme }) {
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-[60] flex items-center justify-between px-6 py-6 md:px-12 md:py-8 bg-transparent">
      <span
        className={`font-display font-black text-sm sm:text-base md:text-lg leading-[0.9] tracking-tight uppercase transition-colors duration-300 ${
          menuOpen ? "text-white" : "text-ink dark:text-white"
        }`}
      >
        I&rsquo;M<br />TONY
      </span>

      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className={`flex items-center gap-1.5 font-display font-black text-sm sm:text-base md:text-lg uppercase tracking-wider transition-[color,transform] duration-200 active:scale-[0.96] ${
            menuOpen ? "text-white" : "text-ink dark:text-white"
          }`}
        >
          {isDark ? "Light" : "Dark"}
        </button>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={onToggle}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={`flex items-center gap-1.5 font-display font-black text-sm sm:text-base md:text-lg uppercase tracking-wider transition-[color,transform] duration-200 active:scale-[0.96] ${
            menuOpen ? "text-white" : "text-ink dark:text-white"
          }`}
        >
          MENU
          <span
            aria-hidden="true"
            className={`inline-block transition-transform duration-500 ${
              menuOpen ? "rotate-45" : "rotate-0"
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

// Contact / outro section sitting directly above the piano keyboard in
// Footer.jsx — flat panel (no piano-lid silhouette), synced from Figma
// file I84MayZQYr2Bri3Se2lfRT, node 412:95. Supports light/dark theme,
// inverting like every other section (light bg + dark ink <-> dark bg + white ink).
const NAV_LINKS = [
  { label: "About Me", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Contact Me", href: "#contact" },
];

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Instagram", href: "#" },
];

// `variant="about"` is opt-in — only AboutPage.jsx passes it, so Home and
// CaseStudy keep the default site palette untouched. The content props
// (headlineLines, eyebrow, email, ctaLabel, ctaHref) are likewise
// opt-in overrides — AboutPage.jsx is the only caller passing them
// (sourced from the aboutPage Sanity document), so every default below
// stays exactly what Home/CaseStudy already render today.
function PianoLidContact({
  variant = "site",
  headlineLines = ["Let's Create a Remarkable Journey"],
  eyebrow = "Always up for good design talk",
  email = "Tony2742000@gmail.com",
  ctaLabel = "Book a call with me",
  ctaHref = "mailto:Tony2742000@gmail.com",
}) {
  const isAbout = variant === "about";

  return (
    <section
      id="contact"
      className={
        isAbout
          ? "relative w-full overflow-hidden bg-primary text-white transition-colors duration-300 dark:bg-[#161616] dark:text-[#fafafa]"
          : "relative w-full overflow-hidden bg-bg text-ink transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white"
      }
    >
      <div className="relative z-10 w-full px-6 pt-14 pb-10 sm:px-10 sm:pt-16 sm:pb-12 md:px-14 md:pt-20 md:pb-14 lg:px-16">
        {/* Standalone headline for the whole contact block, sitting above
            the two-column row rather than stacked inside the left column. */}
        <h2
          className={
            "select-none font-display text-5xl font-black uppercase leading-[1  ] tracking-tight sm:text-3xl md:text-8xl lg:text-[10rem] mb-10 sm:mb-12 md:mb-14 text-center " +
            (isAbout ? "text-white dark:text-[#fafafa]" : "text-ink dark:text-white")
          }
        >
          {headlineLines.filter(Boolean).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>

        {/* Left column switches to a side-by-side split only at lg — keeping
            the email full-width through md avoids a narrow mid-breakpoint
            column that would force it onto two lines. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left: eyebrow, email CTA, book-a-call button */}
          <div className="flex flex-col items-start gap-5 sm:gap-6 lg:col-span-7">
            <p
              className={
                "select-none font-display text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.25em] " +
                (isAbout ? "text-[#e3f900]" : "text-primary dark:text-[#7F9DFD]")
              }
            >
              {eyebrow}
            </p>
            <a
              href={`mailto:${email}`}
              className="block select-none whitespace-nowrap font-display text-xl font-black leading-[1.04] tracking-tight transition-opacity hover:opacity-70 sm:text-2xl md:text-3xl lg:text-2xl xl:text-7xl"
            >
              {email}
            </a>
          </div>

          {/* Right: nav + social columns */}
          <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:col-span-5 lg:justify-items-end">
            <div className="flex flex-col gap-3 font-display text-sm font-medium uppercase sm:gap-4 sm:text-base md:text-lg">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="w-fit transition-opacity hover:opacity-70"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 font-display text-sm font-medium uppercase sm:gap-4 sm:text-base md:text-lg">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="w-fit transition-opacity hover:opacity-70"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar: location + copyright */}
        <div
          className={
            "mt-12 flex flex-col gap-3 pt-6 font-display text-xs uppercase tracking-wide sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:text-sm md:mt-16 " +
            (isAbout
              ? "border-t border-white/20 text-white/70 dark:border-white/10 dark:text-[#fafafa]/70"
              : "border-t border-black/10 text-ink/70 dark:border-white/10 dark:text-white/70")
          }
        >
          <p className="select-none">New Delhi, India: (GMT +5:30) 12:45</p>
          <p className="select-none">© 2026 · Made by I&apos;m Tony, not Framer</p>
        </div>
      </div>
    </section>
  );
}

export default PianoLidContact;
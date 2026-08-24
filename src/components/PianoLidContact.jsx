import { useState, useEffect } from "react";

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

// Formats the live clock + GMT offset for an IANA timezone name (e.g.
// "Asia/Kolkata") — never a raw offset, so it stays correct across DST
// changes and is independent of the visitor's own timezone.
function getZonedClock(timeZone) {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  const offsetPart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(now)
    .find((part) => part.type === "timeZoneName")?.value;
  // formatToParts gives e.g. "GMT+5:30" (or bare "GMT" at UTC) — strip
  // the "GMT" prefix since the surrounding markup already supplies it.
  const offset = offsetPart ? offsetPart.replace("GMT", "") || "+0" : "";
  return { time, offset };
}

// `variant="about"` is opt-in — only AboutPage.jsx passes it, so Home and
// CaseStudy keep the default site palette untouched. The content props
// (headlineLines, eyebrow, email, ctaLabel, ctaHref, socialLinks,
// location, timezone, copyrightSuffix) are likewise opt-in overrides —
// callers pass them from their own Sanity document, so every default
// below stays exactly what this component rendered before any of that
// content was wired up.
function PianoLidContact({
  variant = "site",
  headlineLines = ["Let's Create a Remarkable Journey"],
  eyebrow = "Always up for good design talk",
  email = "Tony2742000@gmail.com",
  ctaLabel = "Book a call with me",
  ctaHref = "mailto:Tony2742000@gmail.com",
  socialLinks = SOCIAL_LINKS,
  location = "New Delhi, India",
  timezone = "Asia/Kolkata",
  copyrightSuffix = "· Made by I'm Tony, not Framer",
}) {
  const isAbout = variant === "about";

  // Starts null (rendered as a stable placeholder) rather than computed
  // during the initial render — this app is client-rendered only today,
  // but keeping `new Date()` out of render/useState-initializer means
  // this never becomes a hydration mismatch if server rendering is ever
  // added later. The real value is filled in on mount, client-only.
  const [clock, setClock] = useState(null);

  useEffect(() => {
    const update = () => setClock(getZonedClock(timezone));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [timezone]);

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
        {eyebrow && (
          <p className="select-none font-display text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#5F87FF] dark:text-[#8ba7ff] mb-3 text-left md:text-center">
            {eyebrow}
          </p>
        )}
        <h2
          className={
            "select-none font-display text-5xl font-black uppercase leading-[1 ] tracking-tight sm:text-3xl md:text-8xl lg:text-[10rem] mb-10 sm:mb-12 md:mb-14 text-left md:text-center " +
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
            <a
              href={`mailto:${email}`}
              className="block select-none whitespace-nowrap font-normal normal-case text-2xl font-semibold leading-[1.04] tracking-tight transition-opacity hover:opacity-70 sm:text-xl md:text-3xl lg:text-2xl xl:text-6xl"
            >
              {email}
            </a>
          </div>

          {/* Right: social column. 0 links renders nothing (no empty
              wrapper); flex-wrap already handles 6+ links wrapping to a
              new row instead of overflowing. Platform is never assumed
              — iterated in stored order from whatever `socialLinks`
              holds. */}
          {socialLinks.length > 0 && (
            <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 font-display text-sm font-medium uppercase sm:gap-x-8 sm:gap-y-3 sm:text-base md:text-lg lg:col-span-5 lg:justify-end lg:items-end">
              {socialLinks.map(({ label, href }) => (
                <a
                  key={label + href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-fit items-center gap-1.5 transition-opacity hover:opacity-70 whitespace-nowrap"
                >
                  <span>{label}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar: location + copyright. Clock/offset stay a stable
            placeholder ("--:--" / no offset) until the client-only
            effect above computes the real value, avoiding any
            server/client mismatch if this ever renders server-side. */}
        <div
          className={
            "mt-12 flex flex-col gap-3 pt-6 font-display text-xs uppercase tracking-wide sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:text-sm md:mt-16 " +
            (isAbout
              ? "border-t border-white/20 text-white/70 dark:border-white/10 dark:text-[#fafafa]/70"
              : "border-t border-black/10 text-ink/70 dark:border-white/10 dark:text-white/70")
          }
        >
          <p className={`select-none text-base sm:text-lg font-semibold ${isAbout ? "text-white" : "text-ink dark:text-white"}`}>
            {location}: (GMT {clock?.offset ?? ""}) {clock?.time ?? "--:--"}
          </p>
          <p className="select-none">© {new Date().getFullYear()} {copyrightSuffix}</p>
        </div>
      </div>
    </section>
  );
}

export default PianoLidContact;
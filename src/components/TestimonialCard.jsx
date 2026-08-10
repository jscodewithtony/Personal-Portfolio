import topmateLogo from "../assets/topmate-logo.png";

/**
 * Reusable TestimonialCard Component
 * Full dynamic light & dark theme support.
 *
 * Props:
 * - name: string (e.g. "RADHIKA MALHOTRA")
 * - quote: string (The testimonial text body)
 * - platform: string ("topmate" or custom platform name)
 * - platformLogo: string (optional custom image URL/src)
 * - role: string (optional role/title e.g. "UI/UX Designer")
 * - className: string (additional container classes)
 */
function TestimonialCard({
  name = "",
  quote = "",
  platform = "topmate",
  platformLogo,
  role,
  className = "",
}) {
  const formattedName = name.trim().startsWith("-")
    ? name.trim().toUpperCase()
    : `-${name.trim().toUpperCase()}`;

  const logoSrc =
    platformLogo || (platform?.toLowerCase() === "topmate" ? topmateLogo : null);

  return (
    <div
      className={`relative flex min-h-[320px] sm:min-h-[360px] flex-col justify-between rounded-none border border-ink/15 bg-white p-7 sm:p-10 text-ink shadow-xl shadow-ink/10 transition-colors duration-300 dark:border-white/15 dark:bg-[#141416] dark:text-white dark:shadow-2xl ${className}`}
    >
      <div>
        {/* Mentee Name */}
        <h3 className="font-display text-2xl font-black uppercase tracking-tight text-ink transition-colors duration-300 dark:text-white sm:text-3xl">
          {formattedName}
        </h3>

        {/* Mentee Role */}
        {role && (
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-ink/60 transition-colors duration-300 dark:text-white/60 sm:text-sm">
            {role}
          </span>
        )}

        {/* Quote Content */}
        <p className="mt-5 font-sans text-base font-normal leading-relaxed text-ink/80 transition-colors duration-300 dark:text-gray-200 sm:text-lg">
          {quote}
        </p>
      </div>

      {/* Platform Logo Footer */}
      <div className="mt-8 flex items-center justify-start border-t border-ink/10 transition-colors duration-300 dark:border-white/10 pt-4 sm:pt-5">
        {logoSrc ? (
          <div className="inline-flex items-center rounded-lg bg-[#0d0c14] px-3 py-1.5 dark:bg-transparent dark:p-0">
            <img
              src={logoSrc}
              alt={platform ? `${platform} logo` : "Platform logo"}
              className="h-5 w-auto object-contain opacity-95 sm:h-6"
            />
          </div>
        ) : (
          platform && (
            <span className="text-xs font-bold uppercase tracking-wider text-ink/50 transition-colors duration-300 dark:text-white/50 sm:text-sm">
              {platform}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default TestimonialCard;

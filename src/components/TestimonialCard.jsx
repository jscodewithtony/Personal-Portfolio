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
      className={`relative flex min-h-[280px] sm:min-h-[320px] flex-col justify-between rounded-none border border-transparent bg-primary p-6 sm:p-8 md:p-9 text-white shadow-xl shadow-primary/20 transition-colors duration-300 dark:border-white/15 dark:bg-[#141416] dark:text-white dark:shadow-2xl ${className}`}
    >
      <div>
        {/* Mentee Name */}
        <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white transition-colors duration-300 dark:text-white sm:text-3xl">
          {formattedName}
        </h3>

        {/* Mentee Role */}
        {role && (
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-white/60 transition-colors duration-300 dark:text-white/60 sm:text-sm">
            {role}
          </span>
        )}

        {/* Quote Content */}
        <p className="mt-4 sm:mt-5 font-sans text-sm sm:text-base md:text-[17px] font-normal normal-case leading-relaxed text-white/80 transition-colors duration-300 dark:text-gray-200">
          {quote}
        </p>
      </div>

      {/* Platform Logo Footer */}
      <div className="mt-6 flex items-center justify-start border-t border-white/10 transition-colors duration-300 dark:border-white/10 pt-3 sm:pt-4">
        {logoSrc ? (
          <div className="inline-flex items-center rounded-lg bg-[#0d0c14] px-3 py-1.5 dark:bg-transparent dark:p-0">
            <img
              src={logoSrc}
              alt={platform ? `${platform} logo` : "Platform logo"}
              loading="lazy"
              decoding="async"
              className="h-5 w-auto object-contain opacity-95 sm:h-6"
            />
          </div>
        ) : (
          platform && (
            <span className="text-xs font-bold uppercase tracking-wider text-white/50 transition-colors duration-300 dark:text-white/50 sm:text-sm">
              {platform}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default TestimonialCard;

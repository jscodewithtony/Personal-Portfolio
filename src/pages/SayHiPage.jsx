import { lazy, Suspense, useRef, useState } from "react";
import Header from "../components/Header";
import CanvasCursor from "../components/CanvasCursor";
import Reveal from "../components/Reveal";

const MenuOverlay = lazy(() => import("../components/MenuOverlay"));
const Footer = lazy(() => import("../components/Footer"));

// Figma: https://www.figma.com/design/I84MayZQYr2Bri3Se2lfRT/Personal-Portfolio?node-id=735-869
// "Say Hi" — dedicated contact page. Only the headline + eyebrow/email/
// social column + contact form are ported from this node; the Figma
// frame's own header and footer are intentionally skipped in favor of
// the site's shared <Header>/<Footer>, per explicit request. Every
// color/surface below comes from the site's existing theme tokens
// (bg-bg/text-ink + dark: pairs, --color-primary) rather than the
// frame's own hardcoded #161616/#fafafa values, so the page inverts
// with the site's light/dark toggle exactly like every other page.
const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Instagram", href: "#" },
];

const CONTACT_EMAIL = "Tony2742000@gmail.com";


const FIELDS = [
  { name: "name", label: "Your name*", type: "text", required: true },
  { name: "email", label: "Email*", type: "email", required: true },
  { name: "phone", label: "Phone", type: "tel", required: false },
  { name: "message", label: "How can I help you", type: "textarea", required: false },
];

const EMPTY_FORM = { name: "", email: "", phone: "", message: "" };

function SayHiPage({ theme, onToggleTheme }) {
  const menuButtonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    if (field === "phone") {
      const filtered = val.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, phone: filtered }));
      setErrors((prev) => ({ ...prev, phone: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: val }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // No backend on this static site, so submission opens the visitor's
  // own mail client with the form content pre-filled — same pattern the
  // rest of the site already relies on for contact (mailto: links in
  // Header/MenuOverlay/PianoLidContact).
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Your name is required";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (form.phone && form.phone.length < 8) {
      newErrors.phone = "Phone number is too short";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const subject = `New message from ${form.name || "your website"}`;
    const phoneFull = form.phone ? form.phone : "";
    const bodyLines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      phoneFull && `Phone: ${phoneFull}`,
      "",
      form.message,
    ].filter(Boolean);
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailto;
  };

  return (
    <div className="site-shell relative min-h-[100dvh] bg-bg font-display text-ink uppercase transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
      <CanvasCursor />
      <Header
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="w-full px-6 pb-24 pt-14 sm:px-10 sm:pt-16 md:px-14 md:pb-32 md:pt-20 lg:px-16">
        <Reveal as="h1" className="max-w-5xl font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl lg:text-[7rem]">
          Let&rsquo;s see what we can dream up together.
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-14 md:mt-24 lg:grid-cols-10 lg:gap-[auto]">
          {/* Left: eyebrow, email, socials */}
          <Reveal delay={80} className="flex flex-col gap-10 lg:col-span-4 lg:justify-between lg:h-full lg:gap-0">
            <div className="flex flex-col gap-3">
              <p className="select-none font-display text-xs font-bold uppercase tracking-[0.2em] text-[#5F87FF] dark:text-[#8ba7ff] sm:text-sm">
                Always up for good design talk
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="block select-none break-words font-display text-2xl font-semibold leading-tight tracking-tight transition-opacity hover:opacity-70 sm:text-3xl"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <p className="select-none font-display text-sm font-semibold uppercase tracking-wide normal-case">
                Connect With Me
              </p>
              <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 font-display text-xl font-medium uppercase">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-fit items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-70"
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
            </div>
          </Reveal>

          {/* Right: contact form */}
          <Reveal delay={140} className="lg:col-span-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-9 w-full max-w-2xl lg:ml-auto">
              {FIELDS.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <label className="flex flex-col gap-3">
                    <span className="sr-only">{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        required={field.required}
                        value={form[field.name]}
                        onChange={handleChange(field.name)}
                        placeholder={field.label}
                        rows={2}
                        className="w-full resize-none border-b border-ink/20 bg-transparent pb-3 font-display text-2xl font-normal !normal-case placeholder:!normal-case leading-snug text-ink placeholder:text-ink/40 outline-none focus-visible:!outline-none transition-colors focus:border-ink dark:border-white/20 dark:text-white dark:placeholder:!normal-case dark:placeholder:text-white/40 dark:focus:border-white sm:text-2xl"
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        required={field.required}
                        value={form[field.name]}
                        onChange={handleChange(field.name)}
                        placeholder={field.label}
                        className="w-full border-b border-ink/20 bg-transparent pb-3 font-display text-2xl font-normal !normal-case placeholder:!normal-case leading-snug text-ink placeholder:text-ink/40 outline-none focus-visible:!outline-none transition-colors focus:border-ink dark:border-white/20 dark:text-white dark:placeholder:!normal-case dark:placeholder:text-white/40 dark:focus:border-white sm:text-2xl"
                      />
                    )}
                  </label>
                  {errors[field.name] && (
                    <span className="text-red-500 font-display text-sm font-semibold !normal-case tracking-wide mt-1">
                      {errors[field.name]}
                    </span>
                  )}
                </div>
              ))}

              <button
                type="submit"
                className="mt-4 w-fit select-none bg-primary px-9 py-4 font-display text-base font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-85 active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          </Reveal>
        </div>
      </main>

      <Suspense fallback={null}>
        <Footer />
        <MenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
        />
      </Suspense>
    </div>
  );
}

export default SayHiPage;

import { lazy, Suspense, useRef, useState, useEffect } from "react";
import Header from "../components/Header";
import CanvasCursor from "../components/CanvasCursor";
import Reveal from "../components/Reveal";
import DirectionHover from "../components/DirectionHover";

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

// Set to false to easily disable hCaptcha in the future
const ENABLE_CAPTCHA = true;

function SayHiPage({ theme, onToggleTheme }) {
  const menuButtonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle, submitting, success, error

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

  useEffect(() => {
    if (!ENABLE_CAPTCHA) return;

    const renderCaptcha = () => {
      if (window.hcaptcha) {
        const el = document.querySelector(".h-captcha");
        if (el && el.innerHTML === "") {
          window.hcaptcha.render(el, {
            sitekey: "50b2fe65-b00b-4b9e-ad62-3ba471098be2",
            theme: "dark"
          });
        }
        return true;
      }
      return false;
    };

    if (!renderCaptcha()) {
      const interval = setInterval(() => {
        if (renderCaptcha()) {
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleSubmit = async (e) => {
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

    let token = "";
    if (ENABLE_CAPTCHA) {
      token = window.hcaptcha?.getResponse();
      if (!token) {
        alert("Please complete the hCaptcha puzzle.");
        return;
      }
    }

    setSubmitStatus("submitting");

    const payload = {
      access_key: "e17348f6-2eda-424e-9d4a-833ef8f27e76",
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
      ...(ENABLE_CAPTCHA && { "h-captcha-response": token }),
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitStatus("success");
        setForm(EMPTY_FORM);
        window.hcaptcha?.reset();
      } else {
        setSubmitStatus("error");
        window.hcaptcha?.reset();
      }
    } catch (error) {
      setSubmitStatus("error");
      window.hcaptcha?.reset();
    }
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

      <section className="w-full px-6 pb-24 pt-14 sm:px-10 sm:pt-16 md:px-14 md:pb-32 md:pt-20 lg:px-16">
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
                className="block select-none break-words font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
              >
                <DirectionHover>{CONTACT_EMAIL}</DirectionHover>
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
                    className="group flex w-fit items-center gap-1.5 whitespace-nowrap"
                  >
                    <DirectionHover>{label}</DirectionHover>
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
            {submitStatus === "success" ? (
              <div className="flex flex-col items-start gap-6 w-full max-w-2xl lg:ml-auto py-10">
                <h2 className="font-display text-4xl font-medium normal-case leading-tight sm:text-5xl">
                  Message Sent!
                </h2>
                <p className="font-display text-lg text-ink/70 dark:text-white/70 normal-case">
                  Thank you for reaching out. Your message has been sent successfully. I'll be in touch soon!
                </p>
                <button
                  onClick={() => setSubmitStatus("idle")}
                  className="mt-4 select-none bg-primary px-9 py-4 font-display text-base font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-85 active:scale-[0.98]"
                >
                  <DirectionHover>Send Another Message</DirectionHover>
                </button>
              </div>
            ) : (
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
                          className={`w-full resize-none border-b bg-transparent pb-3 font-display text-2xl font-normal !normal-case placeholder:!normal-case leading-snug text-ink placeholder:text-ink/40 outline-none focus-visible:!outline-none transition-colors dark:text-white dark:placeholder:!normal-case dark:placeholder:text-white/40 sm:text-2xl ${
                            errors[field.name]
                              ? "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500"
                              : "border-ink/20 focus:border-ink dark:border-white/20 dark:focus:border-white"
                          }`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          required={field.required}
                          value={form[field.name]}
                          onChange={handleChange(field.name)}
                          placeholder={field.label}
                          className={`w-full border-b bg-transparent pb-3 font-display text-2xl font-normal !normal-case placeholder:!normal-case leading-snug text-ink placeholder:text-ink/40 outline-none focus-visible:!outline-none transition-colors dark:text-white dark:placeholder:!normal-case dark:placeholder:text-white/40 sm:text-2xl ${
                            errors[field.name]
                              ? "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500"
                              : "border-ink/20 focus:border-ink dark:border-white/20 dark:focus:border-white"
                          }`}
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

                {ENABLE_CAPTCHA && <div className="h-captcha" data-captcha="true"></div>}

                {submitStatus === "error" && (
                  <span className="text-red-500 font-display text-sm font-semibold !normal-case tracking-wide">
                    Something went wrong. Please try again.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={submitStatus === "submitting"}
                  className="mt-4 w-fit select-none bg-primary px-9 py-4 font-display text-base font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-85 active:scale-[0.98] disabled:opacity-50"
                >
                  <DirectionHover>
                    {submitStatus === "submitting" ? "Sending..." : "Send Message"}
                  </DirectionHover>
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

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

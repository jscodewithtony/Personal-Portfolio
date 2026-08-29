import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Reveal from "./Reveal";
import DirectionHover from "./DirectionHover";

// Figma: https://www.figma.com/design/I84MayZQYr2Bri3Se2lfRT/Personal-Portfolio?node-id=837-508
// "Project-form" — sits at the very end of the Work page, after every
// case study in WorkIndex has scrolled past. Underline inputs use
// border-b utilities instead of the frame's exported line SVGs, and
// every color comes from the site's existing theme tokens (bg-bg/
// text-ink + dark: pairs, --color-primary) rather than the frame's own
// hardcoded #161616/#676767, so it inverts with the site's light/dark
// toggle like every other section.
const BUDGET_OPTIONS = ["Under $5k", "$5k – $15k", "$15k – $50k", "$50k+"];

const CONTACT_EMAIL = "Tony2742000@gmail.com";

const EMPTY_FORM = { name: "", email: "", phone: "", budget: "", message: "" };

const FIELD_CLASS =
  "w-full border-b border-ink/20 bg-transparent pb-3 font-display text-2xl font-normal !normal-case placeholder:!normal-case leading-snug text-ink placeholder:text-ink/40 outline-none focus-visible:!outline-none transition-colors focus:border-ink dark:border-white/20 dark:text-white dark:placeholder:!normal-case dark:placeholder:text-white/40 dark:focus:border-white sm:text-2xl";

// Set to false to easily disable hCaptcha in the future
const ENABLE_CAPTCHA = true;

function ProjectContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle, submitting, success, error
  const [errors, setErrors] = useState({});

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

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === "phone") {
      const hasPlus = value.startsWith('+');
      value = value.replace(/\D/g, "");
      if (hasPlus) {
        value = '+' + value;
      }
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

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
      access_key: "76e40e3e-ada7-4fd6-b5d7-03fe7bb89120",
      name: form.name,
      email: form.email,
      phone: form.phone,
      budget: form.budget,
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

  if (submitStatus === "success") {
    return (
      <section className="relative w-full bg-bg text-ink transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
        <div className="mx-auto w-full max-w-4xl px-6 py-20 sm:px-10 md:px-14 md:py-28 lg:px-16 text-center">
          <Reveal className="flex flex-col items-center justify-center gap-6">
            <h2 className="font-display text-4xl font-medium normal-case leading-tight sm:text-6xl md:text-7xl">
              Thank You!
            </h2>
            <p className="font-display text-lg text-ink/70 dark:text-white/70 max-w-md normal-case">
              Your project enquiry has been submitted successfully. I'll get back to you shortly.
            </p>
            <button
              onClick={() => setSubmitStatus("idle")}
              className="mt-6 select-none bg-primary px-9 py-4 font-display text-base font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-85 active:scale-[0.98]"
            >
              <DirectionHover>Send Another Enquiry</DirectionHover>
            </button>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-bg text-ink transition-colors duration-300 dark:bg-[#0c0a14] dark:text-white">
      <div className="mx-auto w-full max-w-4xl px-6 py-20 sm:px-10 md:px-14 md:py-28 lg:px-16">
        <Reveal
          as="h2"
          className="font-display text-4xl font-medium normal-case leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Got Something Serious
        </Reveal>

        <Reveal delay={100} className="mt-14 md:mt-20">
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-16">
            <div className="grid grid-cols-1 gap-x-16 gap-y-12 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-3">
                  <span className="sr-only">Your name*</span>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your name*"
                    value={form.name}
                    onChange={handleChange("name")}
                    className={FIELD_CLASS}
                  />
                </label>
                {errors.name && (
                  <span className="text-red-500 font-display text-sm font-semibold !normal-case tracking-wide mt-1">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-3">
                  <span className="sr-only">Email*</span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Email*"
                    value={form.email}
                    onChange={handleChange("email")}
                    className={FIELD_CLASS}
                  />
                </label>
                {errors.email && (
                  <span className="text-red-500 font-display text-sm font-semibold !normal-case tracking-wide mt-1">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-3">
                  <span className="sr-only">Phone</span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    className={FIELD_CLASS}
                  />
                </label>
              </div>

              <div className="relative flex flex-col gap-2">
                <label className="flex flex-col gap-3">
                  <span className="sr-only">Budget</span>
                  <select
                    name="budget"
                    value={form.budget}
                    onChange={handleChange("budget")}
                    className={`${FIELD_CLASS} appearance-none pr-8 ${
                      form.budget ? "" : "text-ink/40 dark:text-white/40"
                    }`}
                  >
                    <option value="" disabled hidden>
                      Budget
                    </option>
                    {BUDGET_OPTIONS.map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="text-ink dark:bg-[#0c0a14] dark:text-white"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-4 right-0 h-5 w-5 text-ink/60 dark:text-white/60"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-3">
                <span className="sr-only">What you are building?</span>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="What you are building?"
                  value={form.message}
                  onChange={handleChange("message")}
                  className={`${FIELD_CLASS} resize-none`}
                />
              </label>
            </div>

            {ENABLE_CAPTCHA && <div className="h-captcha" data-captcha="true"></div>}

            {submitStatus === "error" && (
              <span className="text-red-500 font-display text-sm font-semibold !normal-case tracking-wide mt-1">
                Something went wrong. Please try again.
              </span>
            )}

            <button
              type="submit"
              disabled={submitStatus === "submitting"}
              className="w-fit select-none bg-primary px-9 py-4 font-display text-base font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-85 active:scale-[0.98] disabled:opacity-50"
            >
              <DirectionHover>
                {submitStatus === "submitting" ? "Sending..." : "Send Enquiry"}
              </DirectionHover>
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export default ProjectContactForm;

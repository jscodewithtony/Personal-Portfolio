import { buildLegacyTheme } from "sanity";

// Maps the Studio's CSS custom properties onto the portfolio's own
// design tokens (src/index.css: --color-primary #5953b0, --color-ink
// #0d0c14, dark surface #0c0a14) so /admin reads as part of the same
// product instead of stock Sanity blue-on-white.
export const portfolioStudioTheme = buildLegacyTheme({
  "--black": "#0d0c14",
  "--white": "#ffffff",

  "--gray": "#8b899c",
  "--gray-base": "#8b899c",

  "--component-bg": "#141221",
  "--component-text-color": "#f3efe3",

  "--brand-primary": "#8a83e0",

  "--default-button-color": "#8b899c",
  "--default-button-primary-color": "#8a83e0",
  "--default-button-success-color": "#4fb286",
  "--default-button-warning-color": "#e0a83f",
  "--default-button-danger-color": "#e0645f",

  "--state-info-color": "#8a83e0",
  "--state-success-color": "#4fb286",
  "--state-warning-color": "#e0a83f",
  "--state-danger-color": "#e0645f",

  "--main-navigation-color": "#0c0a14",
  "--main-navigation-color--inverted": "#f3efe3",

  "--focus-color": "#8a83e0",

  "--font-family-base":
    "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
  "--font-family-monospace":
    "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace",
});

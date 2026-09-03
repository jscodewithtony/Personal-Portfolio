// A repeatable palette document. The site's light/dark toggle stays
// binary — dark mode is always the hardcoded dark:* styling, untouched
// — but "light mode" now renders whichever theme document siteSettings
// points at, via CSS custom properties applied at runtime. Each field
// maps to specific CSS vars / Three.js colors consumed by the
// frontend (see src/theme/themeTokens.js).
export default {
  name: "theme",
  title: "Theme",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      description: 'e.g. "Light" or "Red Diamond".',
      placeholder: "Light",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "primaryAccent",
      title: "Primary accent",
      description:
        "Buttons, links, borders, ribbons, badges, the hero mascot, focus rings — every element that currently reads as the brand accent color.",
      type: "color",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "primaryAccentHover",
      title: "Primary accent — hover/pressed shade",
      description: "Optional. Falls back to the primary accent if left empty.",
      type: "color",
    },
    {
      name: "backgroundColor",
      title: "Section background",
      description: "The page/section surface color behind everything else.",
      type: "color",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "textColor",
      title: "Text color",
      description:
        "Primary heading/body text color across the site, including the hero headline.",
      type: "color",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "statValueColor",
      title: "Stats — big number color",
      description:
        'The large stat figures (e.g. "20+"). Optional — falls back to the text color.',
      type: "color",
    },
    {
      name: "statsCubeFrontColor",
      title: "Stats — 3D cube front face",
      description: "Optional — falls back to the primary accent.",
      type: "color",
    },
    {
      name: "statsCubeSideColor",
      title: "Stats — 3D cube side face",
      description: "Optional — falls back to the primary accent.",
      type: "color",
    },
    {
      name: "statsCubeLineColor",
      title: "Stats — 3D cube edge lines",
      description: "Optional — falls back to the primary accent.",
      type: "color",
    },
  ],
  preview: {
    select: { title: "name", accent: "primaryAccent.hex" },
    prepare({ title, accent }) {
      return { title, subtitle: accent };
    },
  },
};

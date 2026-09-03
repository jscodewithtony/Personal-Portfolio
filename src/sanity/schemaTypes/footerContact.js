// Singleton — the footer's contact/outro panel (PianoLidContact.jsx's
// default "site" variant). Registered as a singleton in
// schemaTypes/index.js + structure.js, matching navigation/
// homepageContent/aboutPage/siteSettings.
export default {
  name: "footerContact",
  title: "Footer Contact",
  type: "document",
  fields: [
    {
      name: "eyebrow",
      title: "Eyebrow",
      description:
        'Small label above the heading (e.g. "Get in touch"). The heading style already renders everything uppercase, so type it in normal case here. Leave blank to hide it entirely.',
      type: "string",
      placeholder: "Always up for good design talk",
    },
    {
      name: "heading",
      title: "Heading",
      description:
        "The large display heading. Press Enter for a manual line break — each line renders on its own line exactly as typed. Uppercase is applied by the type style, not stored here.",
      type: "text",
      rows: 3,
      placeholder: "Let's Create a Remarkable Journey",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "email",
      title: "Email",
      description: "Renders as a mailto link.",
      type: "string",
      placeholder: "Tony2742000@gmail.com",
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: "socialLinks",
      title: "Social Links",
      description:
        "Rendered in this exact order — drag to reorder. The ↗ arrow icon is added automatically; do not include it in the label.",
      type: "array",
      of: [
        {
          type: "object",
          name: "socialLink",
          fields: [
            {
              name: "label",
              title: "Label",
              description: 'e.g. "LINKEDIN".',
              type: "string",
              placeholder: "LinkedIn",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "url",
              title: "URL",
              type: "url",
              placeholder: "https://linkedin.com/in/your-profile",
              validation: (Rule) =>
                Rule.required().uri({ scheme: ["http", "https"] }),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "url" },
          },
        },
      ],
    },
    {
      name: "location",
      title: "Location",
      description: 'The place label (e.g. "New Delhi, India").',
      type: "string",
      placeholder: "New Delhi, India",
    },
    {
      name: "timezone",
      title: "Timezone",
      description:
        'An IANA timezone name (e.g. "Asia/Kolkata"), NOT a raw GMT offset. The displayed GMT offset and the live clock are both computed from this at runtime — an offset like "+5:30" here will not work.',
      type: "string",
      placeholder: "Asia/Kolkata",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "copyrightSuffix",
      title: "Copyright suffix",
      description:
        'The text after the year, e.g. "· Made by I\'m Tony, not Framer". The year itself is computed automatically and should not be included here.',
      type: "string",
      placeholder: "· Made by I'm Tony, not Framer",
    },
  ],
  preview: {
    prepare() {
      return { title: "Footer Contact" };
    },
  },
};

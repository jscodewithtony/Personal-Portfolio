export default {
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    {
      name: "selectedTheme",
      title: "Active theme (light mode)",
      description:
        "Which theme document renders for light mode. Dark mode is unaffected by this setting.",
      type: "reference",
      to: [{ type: "theme" }],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: { themeName: "selectedTheme.name" },
    prepare({ themeName }) {
      return { title: "Site Settings", subtitle: themeName ? `Active: ${themeName}` : undefined };
    },
  },
};

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
    {
      name: "customFontUrl",
      title: "Custom Font URL",
      description: "Paste a link to a web font stylesheet (e.g. Google Fonts stylesheet URL starting with https://fonts.googleapis.com/...)",
      type: "string",
    },
    {
      name: "customFontFile",
      title: "Custom Font File",
      description: "Upload a custom font file (.woff, .woff2, .ttf, .otf)",
      type: "file",
    },
    {
      name: "customFontFamily",
      title: "Custom Font Family Name",
      description: "The CSS font-family name matching your link or file (e.g. 'Playwrite GB S' or 'MyFont'). If uploading a file, this name will be used to register the font.",
      type: "string",
    },
  ],
  preview: {
    select: { themeName: "selectedTheme.name" },
    prepare({ themeName }) {
      return { title: "Site Settings", subtitle: themeName ? `Active: ${themeName}` : undefined };
    },
  },
};

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
      placeholder: "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;700&display=swap",
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
      placeholder: "Albert Sans",
    },
    {
      name: "showBackgroundGrid",
      title: "Show background grid pattern",
      description: "Sitewide toggle for the faint 120px grid overlay behind every section, header, and footer. Off hides it everywhere on the site. Defaults to on (also stays on if this is left unset).",
      type: "boolean",
      initialValue: true,
    },
    {
      name: "workPageTemplate",
      title: "Work page template",
      description: "Which layout renders /work. \"Gallery\" is the newer grid + Archive design. Defaults to Classic — nothing changes until this is switched.",
      type: "string",
      options: {
        list: [
          { title: "Classic", value: "classic" },
          { title: "Gallery", value: "gallery" },
        ],
        layout: "radio",
      },
      initialValue: "classic",
    },
    {
      name: "footerInteractive",
      title: "Footer interactive element",
      description:
        'Which interactive element renders at the bottom of the footer. "Piano" is the 3-octave interactive piano keyboard; "Flap" is the interactive pixel flap mini-game. Defaults to Piano.',
      type: "string",
      options: {
        list: [
          { title: "Piano Keyboard", value: "piano" },
          { title: "Flap Mini-Game", value: "flap" },
        ],
        layout: "radio",
      },
      initialValue: "piano",
    },
  ],
  preview: {
    select: { themeName: "selectedTheme.name" },
    prepare({ themeName }) {
      return { title: "Site Settings", subtitle: themeName ? `Active: ${themeName}` : undefined };
    },
  },
};

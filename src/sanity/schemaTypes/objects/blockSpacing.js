// Shared, reusable field spread into every custom bodyContent block
// type (captionedImage, videoEmbed, gallery — see
// portableTextObjects.js) so each block can override its own vertical
// spacing without a developer. `collapsible`/`collapsed: true` gives
// this its own foldable "Spacing" section inside the block's editing
// dialog automatically — no custom UI needed for that part.
export const blockSpacingField = {
  name: "blockSpacing",
  title: "Spacing",
  description: "Optional per-block spacing override. Leave blank to use the page's default spacing between blocks.",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    {
      name: "spacingTop",
      title: "Space Above",
      description: "Space above this block, in pixels. Leave blank to use default section spacing.",
      type: "number",
      validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
    },
    {
      name: "spacingBottom",
      title: "Space Below",
      description: "Space below this block, in pixels. Leave blank to use default section spacing.",
      type: "number",
      validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
    },
  ],
};

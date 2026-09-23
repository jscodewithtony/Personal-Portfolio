// Custom block objects available inside every case study's Portable
// Text body (project.js -> bodyContent), on top of the standard
// heading/paragraph/blockquote block styles.

import { blockSpacingField } from "./blockSpacing";

export const captionedImage = {
  name: "captionedImage",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    {
      name: "alt",
      title: "Alternative text",
      type: "string",
      placeholder: "Screenshot of the onboarding flow's second step, showing the permission prompt",
      validation: (Rule) => Rule.required(),
    },
    { name: "caption", title: "Caption", type: "string", placeholder: "The redesigned onboarding flow, step 2 of 4" },
    blockSpacingField,
  ],
};

export const videoEmbed = {
  name: "videoEmbed",
  title: "Video",
  type: "object",
  fields: [
    {
      name: "file",
      title: "Uploaded video",
      type: "file",
      options: { accept: "video/*" },
    },
    {
      name: "externalUrl",
      title: "External video URL (YouTube, Vimeo, etc.)",
      type: "url",
    },
    { name: "caption", title: "Caption", type: "string", placeholder: "A quick walkthrough of the interaction" },
    blockSpacingField,
  ],
  validation: (Rule) =>
    Rule.custom((value) => {
      if (!value) return true;
      if (!value.file && !value.externalUrl) {
        return "Add either an uploaded video file or an external video URL.";
      }
      return true;
    }),
  preview: {
    select: { title: "caption", externalUrl: "externalUrl" },
    prepare({ title, externalUrl }) {
      return { title: title || externalUrl || "Video", subtitle: "Video embed" };
    },
  },
};

export const gallery = {
  name: "gallery",
  title: "Image Gallery",
  type: "object",
  fields: [
    {
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alternative text",
              type: "string",
              placeholder: "Detail shot of the final dashboard layout",
              validation: (Rule) => Rule.required(),
            },
            { name: "caption", title: "Caption", type: "string", placeholder: "Final dashboard layout" },
          ],
        },
      ],
      validation: (Rule) => Rule.min(2),
    },
    blockSpacingField,
  ],
  preview: {
    select: { images: "images" },
    prepare({ images }) {
      return {
        title: `Gallery (${images?.length || 0} images)`,
        media: images?.[0],
      };
    },
  },
};

// Each column independently chooses image or text — one flexible type
// instead of separate fixed image+text/text+text/image+image variants,
// so an editor covers every combination without picking a different
// block from the insert menu each time.
const multiColumnSlotFields = [
  {
    name: "contentType",
    title: "Content Type",
    type: "string",
    options: {
      list: [
        { title: "Image", value: "image" },
        { title: "Text", value: "text" },
      ],
      layout: "radio",
    },
    initialValue: "text",
    validation: (Rule) => Rule.required(),
  },
  {
    name: "image",
    title: "Image",
    type: "image",
    options: { hotspot: true },
    fields: [
      {
        name: "alt",
        title: "Alternative text",
        type: "string",
        placeholder: "The redesigned settings panel, dark mode",
        validation: (Rule) => Rule.required(),
      },
      { name: "caption", title: "Caption", type: "string" },
    ],
    hidden: ({ parent }) => parent?.contentType !== "image",
  },
  {
    name: "text",
    title: "Text",
    description: "Normal and Quote styles only — a half-width column is too narrow for a page-level heading.",
    type: "array",
    of: [
      {
        type: "block",
        styles: [
          { title: "Normal", value: "normal" },
          { title: "Quote", value: "blockquote" },
        ],
      },
    ],
    hidden: ({ parent }) => parent?.contentType !== "text",
  },
];

export const multiColumn = {
  name: "multiColumn",
  title: "Multi Column",
  type: "object",
  fields: [
    {
      name: "columns",
      title: "Columns",
      description: "2-4 columns, each independently image or text.",
      type: "array",
      of: [{ type: "object", name: "column", fields: multiColumnSlotFields }],
      validation: (Rule) => Rule.required().min(2).max(4),
    },
    {
      name: "columnRatio",
      title: "Column Ratio",
      description: "Only applies with exactly 2 columns. 3-4 columns are always equal width.",
      type: "string",
      options: {
        list: [
          { title: "50 / 50", value: "50-50" },
          { title: "60 / 40", value: "60-40" },
          { title: "40 / 60", value: "40-60" },
        ],
        layout: "radio",
      },
      initialValue: "50-50",
      hidden: ({ parent }) => parent?.columns?.length !== 2,
    },
    {
      name: "backgroundStyle",
      title: "Background Style",
      description: "Applies to the whole block, not per-column.",
      type: "string",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Muted", value: "muted" },
          { title: "Accent", value: "accent" },
        ],
        layout: "radio",
      },
      initialValue: "none",
    },
    {
      name: "paddingLeft",
      title: "Padding — Left (px)",
      description: "Optional. Leave blank for no left padding.",
      type: "number",
      validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
    },
    {
      name: "paddingRight",
      title: "Padding — Right (px)",
      description: "Optional. Leave blank for no right padding.",
      type: "number",
      validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
    },
    {
      name: "columnGap",
      title: "Column Gap (px)",
      description: "Space between columns. Leave blank to use the default gap (32px).",
      type: "number",
      validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
    },
    blockSpacingField,
  ],
  preview: {
    select: {
      columns: "columns",
    },
    prepare({ columns }) {
      const count = columns?.length || 0;
      const types = (columns || []).map((c) => c.contentType || "empty").join(" + ");
      const firstImage = (columns || []).find((c) => c.contentType === "image")?.image;
      return {
        title: `Multi Column (${count}: ${types})`,
        media: firstImage,
      };
    },
  },
};

// Purely a layout element — no image/text/alt at all, just a
// manually-sized empty vertical gap. Raw px number fields (not a
// preset dropdown) to match the existing convention this schema
// already uses for spacing (blockSpacing.js's spacingTop/spacingBottom
// are also raw min(0).max(...) numbers, not presets).
//
// Only heightMobile is required — heightTablet/heightDesktop default
// to a sensible multiple of it when left blank (1.25x / 1.5x, rounded
// to the nearest 4px) rather than a flat cascade, so an editor filling
// in just one field still gets a bit more breathing room on larger
// screens instead of an identical gap at every size.
function roundTo4(n) {
  return Math.round(n / 4) * 4;
}
function resolveSpacerHeights({ heightMobile, heightTablet, heightDesktop }) {
  const mobile = typeof heightMobile === "number" ? heightMobile : 40;
  const tablet = typeof heightTablet === "number" ? heightTablet : roundTo4(mobile * 1.25);
  const desktop = typeof heightDesktop === "number" ? heightDesktop : roundTo4(mobile * 1.5);
  return { mobile, tablet, desktop };
}

export const spacer = {
  name: "spacer",
  title: "Spacer",
  type: "object",
  fields: [
    {
      name: "heightMobile",
      title: "Height — Mobile (px)",
      type: "number",
      initialValue: 40,
      validation: (Rule) => Rule.required().min(0).max(400),
    },
    {
      name: "heightTablet",
      title: "Height — Tablet (px)",
      description: "Optional. Defaults to 1.25x the mobile height if left blank.",
      type: "number",
      validation: (Rule) => Rule.min(0).max(400),
    },
    {
      name: "heightDesktop",
      title: "Height — Desktop (px)",
      description: "Optional. Defaults to 1.5x the mobile height if left blank.",
      type: "number",
      validation: (Rule) => Rule.min(0).max(400),
    },
  ],
  preview: {
    select: { heightMobile: "heightMobile", heightTablet: "heightTablet", heightDesktop: "heightDesktop" },
    prepare(value) {
      const { mobile, tablet, desktop } = resolveSpacerHeights(value);
      return { title: `Spacer — ${mobile}px / ${tablet}px / ${desktop}px`, subtitle: "mobile / tablet / desktop" };
    },
  },
};

export const portableTextObjects = [captionedImage, videoEmbed, gallery, multiColumn, spacer];

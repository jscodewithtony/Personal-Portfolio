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

export const portableTextObjects = [captionedImage, videoEmbed, gallery, multiColumn];

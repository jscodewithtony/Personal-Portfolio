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
      validation: (Rule) => Rule.required(),
    },
    { name: "caption", title: "Caption", type: "string" },
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
    { name: "caption", title: "Caption", type: "string" },
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
              validation: (Rule) => Rule.required(),
            },
            { name: "caption", title: "Caption", type: "string" },
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

export const portableTextObjects = [captionedImage, videoEmbed, gallery];

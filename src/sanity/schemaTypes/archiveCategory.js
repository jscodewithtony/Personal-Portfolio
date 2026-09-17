// One document per Archive row on the "gallery" Work-index template
// (Figma node 1003:552) — a global, project-independent section. Each
// row is a category ("Promotional Banner", "UI Screen", ...) with its
// own date range, chip label, and set of images. Repeatable (not a
// singleton) so an editor can add/remove/reorder rows freely, same
// pattern as `article`.
export default {
  name: "archiveCategory",
  title: "Archive Category",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      description: 'The row heading, e.g. "Promotional Banner".',
      type: "string",
      placeholder: "Promotional Banner",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "categoryTag",
      title: "Category tag",
      description: 'Short bordered chip label, e.g. "Poster". Optional — leave blank to hide the chip.',
      type: "string",
      placeholder: "Poster",
    },
    {
      name: "dateRangeLabel",
      title: "Date range",
      description: 'Free-text date range, not a structured date — e.g. "2015 → 2023". Optional.',
      type: "string",
      placeholder: "2015 → 2023",
    },
    {
      name: "displayOrder",
      title: "Display order",
      description: "Controls row order top to bottom on the page.",
      type: "number",
      validation: (Rule) => Rule.required().integer(),
    },
    {
      name: "items",
      title: "Images",
      description: "The thumbnails shown in this row, left to right.",
      type: "array",
      of: [
        {
          type: "object",
          name: "archiveItem",
          fields: [
            {
              name: "media",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "alt",
              title: "Alt text",
              description: "Describe what's in the image for screen readers and search engines — not the filename.",
              type: "string",
              placeholder: "Concept sketch for a limited-run event poster",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { media: "media", title: "alt" },
          },
        },
      ],
    },
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrderAsc",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "categoryTag", media: "items.0.media" },
  },
};

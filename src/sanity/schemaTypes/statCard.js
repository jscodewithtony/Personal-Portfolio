export default {
  name: "statCard",
  title: "Stat Card",
  type: "document",
  fields: [
    {
      name: "label",
      title: "Label",
      description: 'The small eyebrow tag, e.g. "Experience".',
      type: "string",
      placeholder: "Experience",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "value",
      title: "Value",
      description: 'The large headline figure, e.g. "5+ Years".',
      type: "string",
      placeholder: "5+ Years",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "title",
      title: "Title",
      description: 'Short bold sub-line, e.g. "Crafting UX & Systems".',
      type: "string",
      placeholder: "Crafting UX & Systems",
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      placeholder: "Building design engines & scalable UI components for high-growth tech products.",
    },
    {
      name: "displayOrder",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer(),
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
    select: { title: "value", subtitle: "label" },
  },
};

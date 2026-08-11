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
      validation: (Rule) => Rule.required(),
    },
    {
      name: "value",
      title: "Value",
      description: 'The large headline figure, e.g. "5+ Years".',
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "title",
      title: "Title",
      description: 'Short bold sub-line, e.g. "Crafting UX & Systems".',
      type: "string",
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
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

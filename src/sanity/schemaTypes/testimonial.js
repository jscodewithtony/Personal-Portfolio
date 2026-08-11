const SOURCE_PLATFORMS = ["Topmate", "LinkedIn", "Medium", "Other"];

export default {
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    {
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    },
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "role",
      title: "Role / Title",
      type: "string",
    },
    {
      name: "sourcePlatform",
      title: "Source platform",
      type: "string",
      options: { list: SOURCE_PLATFORMS, layout: "dropdown" },
      initialValue: "Topmate",
    },
    {
      name: "sourceLogo",
      title: "Source logo",
      type: "image",
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
    select: { title: "name", subtitle: "role" },
  },
};

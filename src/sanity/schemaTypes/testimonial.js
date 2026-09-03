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
      placeholder:
        "I booked a portfolio review session with Tony and it was really insightful. He gave me a lot of tips and things to improve upon.",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "name",
      title: "Name",
      type: "string",
      placeholder: "RADHIKA MALHOTRA",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "role",
      title: "Role / Title",
      type: "string",
      placeholder: "Product Designer",
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

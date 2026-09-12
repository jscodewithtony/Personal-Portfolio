const SOURCE_PLATFORMS = ["Medium", "LinkedIn", "Topmate", "Other"];

export default {
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      placeholder: "How I Design Systems That Scale",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      placeholder: "A look at how governed, pattern-first design systems hold up under real product growth.",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "publishDate",
      title: "Publish date",
      type: "date",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      fields: [
        {
          name: "alt",
          title: "Alt text",
          description: "Describe what's in the image for screen readers and search engines — not the filename.",
          type: "string",
          placeholder: "Illustration of a phone notification pulling a user back into an app",
          validation: (Rule) => Rule.required(),
        },
      ],
    },
    {
      name: "externalLink",
      title: "External link",
      type: "url",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "sourcePlatform",
      title: "Source platform",
      type: "string",
      options: { list: SOURCE_PLATFORMS, layout: "dropdown" },
      initialValue: "Medium",
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
    select: { title: "title", subtitle: "sourcePlatform", media: "thumbnail" },
  },
};

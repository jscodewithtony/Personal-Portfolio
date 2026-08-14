export default {
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "client",
      title: "Client name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "mainImage",
      title: "Main image",
      description: "The large portrait image shown on the featured project card.",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "thumbnailImage",
      title: "Thumbnail image",
      description: "The small preview image shown alongside the role/industry details.",
      type: "image",
      options: { hotspot: true },
    },
    {
      name: "shortDescription",
      title: "Short description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    },
    {
      name: "industry",
      title: "Tags / Industry",
      type: "string",
      description: 'e.g. "TECHNOLOGY | IT SUPPORT"',
    },
    {
      name: "role",
      title: "Role",
      type: "string",
      description: 'e.g. "UIUX DESIGNER | DESIGN SYSTEM"',
    },
    {
      name: "displayOrder",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer(),
    },
    {
      name: "externalLink",
      title: "External link",
      type: "url",
      description: "Optional — a live site or external case study link.",
    },
    {
      name: "timeline",
      title: "Timeline",
      type: "string",
      description: 'e.g. "6 Weeks · Q1 2026" — shown in the case study meta row.',
    },
    {
      name: "tools",
      title: "Tools used",
      type: "array",
      of: [{ type: "string" }],
      description: 'e.g. "Figma", "React", "GSAP" — shown in the case study meta row.',
    },
    {
      name: "overviewParagraphs",
      title: "Overview",
      description: "2–3 paragraphs: problem statement, context, goals.",
      type: "array",
      of: [{ type: "text", rows: 4 }],
    },
    {
      name: "outcomeStats",
      title: "Outcome stats",
      description: 'Short results, e.g. value "32%", label "Reduction in onboarding drop-off".',
      type: "array",
      of: [
        {
          type: "object",
          name: "outcomeStat",
          fields: [
            { name: "value", title: "Value", type: "string", validation: (Rule) => Rule.required() },
            { name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required() },
          ],
          preview: {
            select: { title: "value", subtitle: "label" },
          },
        },
      ],
    },
    {
      name: "caseStudyBody",
      title: "Process / Approach",
      description: "Rich content body: headings, paragraphs, images, video, galleries.",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
        },
        { type: "captionedImage" },
        { type: "videoEmbed" },
        { type: "gallery" },
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
    select: { title: "title", subtitle: "client", media: "mainImage" },
  },
};

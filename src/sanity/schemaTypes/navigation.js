export default {
  name: "navigation",
  title: "Navigation",
  type: "document",
  // Singleton — the Studio's structure.js hides "Create new" for this
  // type and routes straight to the one document.
  fields: [
    {
      name: "items",
      title: "Menu items",
      description: "Drag to reorder. This order drives the menu overlay on the live site.",
      type: "array",
      of: [
        {
          type: "object",
          name: "navItem",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "link",
              title: "Link",
              type: "string",
              description: "A path (e.g. /work) or an anchor (e.g. #contact).",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "link" },
          },
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return { title: "Navigation" };
    },
  },
};

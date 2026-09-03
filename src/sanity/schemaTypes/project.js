import { PageBackgroundColorInput } from "../components/PageBackgroundColorInput";
import { ContentSpacingSliderInput } from "../components/ContentSpacingSliderInput";
import { PagePaddingBoxInput } from "../components/PagePaddingBoxInput";

// Case study document — one per project on /projects/[slug]. Grouped
// into Studio tabs matching how the page is actually organized: core
// details, the rich "Process & Approach" body, and the two right-rail
// sidebar blocks (flexible info rows + tags).
export default {
  name: "project",
  title: "Project",
  type: "document",
  groups: [
    { name: "overview", title: "Overview", default: true },
    { name: "content", title: "Content" },
    { name: "sidebarInfo", title: "Sidebar Info" },
    { name: "style", title: "Style" },
  ],
  fields: [
    // --- Overview ---
    {
      name: "title",
      title: "Project Title",
      type: "string",
      group: "overview",
      placeholder: "Tekxera Technology",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "coverImage",
      title: "Project Cover",
      description: "The cover visual for this project — used wherever the project is introduced.",
      type: "image",
      options: { hotspot: true },
      group: "overview",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "mainImage",
      title: "Main Image",
      description: "The large portrait image shown on the featured project card.",
      type: "image",
      options: { hotspot: true },
      group: "overview",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "thumbnail",
      title: "Thumbnail",
      description:
        "Used in the Featured Projects card grid. Supports static image or animated GIF.",
      type: "image",
      group: "overview",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      description: "Auto-generated from the title — used for the /projects/[slug] URL. Edit manually if you need a different one.",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      group: "overview",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "shortDescription",
      title: "Short Description",
      description: "Short summary shown on the project card.",
      type: "text",
      rows: 3,
      group: "overview",
      placeholder:
        "NudgeFile renames and sorts your files with a local AI — but it asks first, and it always has an undo button, because trusting an AI with your file system sight-unseen is how horror movies start.",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "industry",
      title: "Industry",
      type: "string",
      description: 'e.g. "TECHNOLOGY | IT SUPPORT"',
      group: "overview",
      placeholder: "TECHNOLOGY | IT SUPPORT",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "role",
      title: "Role",
      type: "string",
      description: 'e.g. "UIUX DESIGNER | DESIGN SYSTEM"',
      group: "overview",
      placeholder: "UIUX DESIGNER | DESIGN SYSTEM",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "displayOrder",
      title: "Display Order",
      description: "Controls the order projects appear in the Featured Projects section. Lower numbers show first.",
      type: "number",
      group: "overview",
      validation: (Rule) => Rule.required().integer(),
    },
    {
      name: "externalLink",
      title: "External Link",
      description: "Optional external link (e.g. live site, Behance). Leave blank if not applicable.",
      type: "url",
      group: "overview",
    },

    // --- Content ---
    {
      name: "bodyContent",
      title: "Process / Approach",
      description: "The main editorial content: headings, paragraphs, embedded images, and galleries.",
      type: "array",
      group: "content",
      validation: (Rule) => Rule.required().min(1),
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

    // --- Sidebar Info ---
    {
      name: "projectInfoFields",
      title: "Project Information",
      description:
        "Add one entry per info row (e.g. Type, Industry, Timeline, Category, Year). Choose the field type that matches your value — Text for things like \"Personal\" or \"Accessibility Companion App\", Number for things like the year. Drag to reorder.",
      type: "array",
      group: "sidebarInfo",
      of: [
        {
          type: "object",
          name: "projectInfoField",
          fields: [
            {
              name: "label",
              title: "Label",
              description: 'e.g. "Type", "Industry", "Timeline", "Category", "Year".',
              type: "string",
              placeholder: "Year",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "fieldType",
              title: "Value Type",
              description: "Determines which value field below is used.",
              type: "string",
              options: {
                list: [
                  { title: "Text", value: "text" },
                  { title: "Select", value: "select" },
                  { title: "Number", value: "number" },
                ],
                layout: "radio",
              },
              initialValue: "text",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "textValue",
              title: "Text Value",
              type: "string",
              placeholder: "Accessibility Companion App",
              hidden: ({ parent }) => parent?.fieldType !== "text",
            },
            {
              name: "selectValue",
              title: "Select Value",
              description: 'Common values: "Personal", "Client Work", "Mobile App", "Web App", "Design System". Free entry is fine too.',
              type: "string",
              options: {
                list: [
                  "Personal",
                  "Client Work",
                  "Mobile App",
                  "Web App",
                  "Design System",
                ],
              },
              hidden: ({ parent }) => parent?.fieldType !== "select",
            },
            {
              name: "numberValue",
              title: "Number Value",
              type: "number",
              placeholder: "2024",
              hidden: ({ parent }) => parent?.fieldType !== "number",
            },
          ],
          // The Work index page resolves "Year" specifically by matching
          // this label (case-insensitive) and requires it to be a Number
          // row — this warns editors at entry time rather than silently
          // failing to resolve later.
          validation: (Rule) =>
            Rule.custom((value) => {
              if (value?.label?.trim().toLowerCase() === "year" && value?.fieldType !== "number") {
                return 'When Label is "Year", Value Type should be Number so it can be picked up as the project year.';
              }
              return true;
            }).warning(),
          preview: {
            select: {
              label: "label",
              fieldType: "fieldType",
              textValue: "textValue",
              selectValue: "selectValue",
              numberValue: "numberValue",
            },
            prepare({ label, fieldType, textValue, selectValue, numberValue }) {
              const value =
                fieldType === "select"
                  ? selectValue
                  : fieldType === "number"
                    ? numberValue
                    : textValue;
              return { title: label, subtitle: value != null ? String(value) : "" };
            },
          },
        },
      ],
    },
    {
      name: "tags",
      title: "Tags / Tools Used",
      description: 'e.g. "Figma", "React", "GSAP".',
      type: "array",
      group: "sidebarInfo",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },

    // --- Style ---
    // Optional per-project overrides for page-level layout/spacing/
    // color. All three sub-fields are optional and unset by default —
    // the case study template already has sane sitewide defaults that
    // render identically whether or not this whole object is filled in.
    {
      name: "styleSettings",
      title: "Style Settings",
      description:
        "Optional page-level layout overrides for this case study. Leave anything blank to use the site's default look.",
      type: "object",
      group: "style",
      options: { collapsible: true, collapsed: false },
      fields: [
        {
          name: "pagePadding",
          title: "Page Padding",
          description:
            "Sets the padding around the page content on each side individually, in pixels (0–200). Leave a side blank to use the site default for it.",
          type: "object",
          components: { input: PagePaddingBoxInput },
          fields: [
            {
              name: "paddingTop",
              title: "Top",
              type: "number",
              validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
            },
            {
              name: "paddingRight",
              title: "Right",
              type: "number",
              validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
            },
            {
              name: "paddingBottom",
              title: "Bottom",
              type: "number",
              validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
            },
            {
              name: "paddingLeft",
              title: "Left",
              type: "number",
              validation: (Rule) => Rule.min(0).max(200).error("Must be between 0 and 200px."),
            },
          ],
        },
        {
          name: "contentSpacing",
          title: "Content Spacing",
          description:
            "Sets the vertical space between major sections on this page (Context, Process & Approach, etc.), in pixels. Leave blank to use the site default. For spacing between individual blocks inside the body content editor, use \"Body Block Spacing\" below instead.",
          type: "number",
          components: { input: ContentSpacingSliderInput },
          validation: (Rule) =>
            Rule.min(0).max(300).error("Content spacing must be between 0 and 300px."),
        },
        {
          name: "bodyBlockSpacing",
          title: "Body Block Spacing",
          description:
            "Sets the default vertical space between individual blocks inside the body content editor (Process & Approach — headings, paragraphs, images, galleries), in pixels. Leave blank to use each block's own default spacing. A block's own Spacing override (set on that block itself) always takes priority over this.",
          type: "number",
          components: { input: ContentSpacingSliderInput },
          validation: (Rule) =>
            Rule.min(0).max(300).error("Body block spacing must be between 0 and 300px."),
        },
        {
          name: "pageBackgroundColor",
          title: "Page Background Color",
          description:
            "Sets the background color for this case study page. Choose any color using the picker or enter a hex value. Leave blank to use the site default. When set, this page's colors become an intentional, fixed pair — the light/dark theme toggle no longer changes this page's background or text color (see Page Text Color below).",
          type: "color",
          options: { disableAlpha: true },
          components: { input: PageBackgroundColorInput },
        },
        {
          name: "pageTextColor",
          title: "Page Text Color",
          description:
            "Sets the text color for this page when a custom background color is used. Choose a color with strong contrast against your background color. Leave blank and one will be picked automatically based on your background's brightness.",
          type: "color",
          options: { disableAlpha: true },
          components: { input: PageBackgroundColorInput },
          hidden: ({ parent }) => !parent?.pageBackgroundColor,
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
    select: { title: "title", subtitle: "industry", media: "coverImage" },
  },
};

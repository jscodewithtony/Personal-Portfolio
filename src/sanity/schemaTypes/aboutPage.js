// Singleton document backing the /about page. Grouped into Studio tabs
// that mirror the page's actual sections top to bottom, so an editor
// can find a field without guessing which document it lives in. The
// bio paragraph beside the portrait continues to come from the
// existing `homepageContent` document (shared with the homepage About
// ribbon) — everything else on /about is owned by this document.
export default {
  name: "aboutPage",
  title: "About Page",
  type: "document",
  groups: [
    { name: "intro", title: "Intro" },
    { name: "experienceNarrative", title: "Experience Narrative" },
    { name: "philosophy", title: "Philosophy" },
    { name: "professionalExperience", title: "Professional Experience" },
    { name: "knowMore", title: "Know More / Annotation Dots" },
    { name: "personalTravel", title: "Personal / Travel" },
    { name: "closingCta", title: "Closing / CTA" },
  ],
  fields: [
    {
      name: "customColorTheme",
      title: "Custom Color Theme Override",
      type: "object",
      group: "intro",
      fields: [
        {
          name: "isEnabled",
          title: "Enable custom color theme",
          type: "boolean",
          description: "When ON, the custom color below replaces the default Light theme background on this page. Dark theme is never affected by this setting. When OFF, the page uses the standard Light/Dark toggle behavior with default colors.",
          initialValue: false,
        },
        {
          name: "customColor",
          title: "Custom background color",
          type: "color",
          hidden: ({ parent }) => !parent?.isEnabled,
        },
      ],
    },
    // --- Group 1: Intro ---
    {
      name: "scrollingTicker",
      title: "Scrolling ticker",
      description: "The marquee/ticker line that loops across the yellow band near the top of the page.",
      type: "string",
      group: "intro",
      placeholder:
        "BEST IDEAS SHOW UP MID-SHOWER • NEVER IN MEETINGS • I DESIGN AT 2AM AND REGRET IT AT 9AM • STILL SKETCHING ON PAPER BEFORE FIGMA",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "heroHeadline",
      title: "Hero headline",
      description: 'The large intro headline, e.g. "SO WHO IS ACTUALLY BEHIND THIS".',
      type: "text",
      rows: 2,
      group: "intro",
      placeholder: "SO WHO IS ACTUALLY BEHIND THIS",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "introParagraph",
      title: "Intro paragraph",
      description: 'The short line right under the yellow ticker band, e.g. "I\'m a product designer who builds..."',
      type: "text",
      rows: 3,
      group: "intro",
      placeholder:
        "My design journey found me somewhere between wanting things to work better and being too impatient to wait for someone else to fix them.",
      validation: (Rule) => Rule.required(),
    },

    // --- Group 2: Experience Narrative ---
    {
      name: "narrativeImageOne",
      title: "Narrative image 1",
      description: "First full-width narrative photo, shown after the intro.",
      type: "image",
      options: { hotspot: true },
      group: "experienceNarrative",
    },
    {
      name: "narrativeImageOneAlt",
      title: "Narrative image 1 — alt text",
      type: "string",
      group: "experienceNarrative",
      placeholder: "Tony sketching a layout on paper at a desk, mid-afternoon light",
      validation: (Rule) => Rule.required(),
      hidden: ({ document }) => !document?.narrativeImageOne,
    },
    {
      name: "narrativeImageTwo",
      title: "Narrative image 2",
      description: "Second full-width narrative photo. Not yet wired to a second image slot on the live page — reserved for a future narrative photo.",
      type: "image",
      options: { hotspot: true },
      group: "experienceNarrative",
    },
    {
      name: "narrativeImageTwoAlt",
      title: "Narrative image 2 — alt text",
      type: "string",
      group: "experienceNarrative",
      placeholder: "Tony presenting a design system to a small team around a laptop",
      validation: (Rule) => Rule.required(),
      hidden: ({ document }) => !document?.narrativeImageTwo,
    },
    {
      name: "leftText",
      title: "Left text block",
      description: "Sits in the left column of the two-column row beneath narrative image 1. Keep to 1–2 short lines.",
      type: "text",
      rows: 3,
      group: "experienceNarrative",
      placeholder: "Me at somewhere",
    },
    {
      name: "rightText",
      title: "Right text block",
      description: "Sits in the right column of the two-column row beneath narrative image 1. Keep to 1–2 short lines.",
      type: "text",
      rows: 3,
      group: "experienceNarrative",
      placeholder: "Giving a Unique pose @2022",
    },
    {
      name: "portraitImage",
      title: "Portrait image",
      description: "The portrait photo shown in the intro grid, beside the intro bio text.",
      type: "image",
      options: { hotspot: true },
      group: "experienceNarrative",
    },
    {
      name: "portraitImageAlt",
      title: "Portrait image — alt text",
      type: "string",
      group: "experienceNarrative",
      placeholder: "Tony, seated outdoors in dark clothing beside a black horse",
      validation: (Rule) => Rule.required(),
      hidden: ({ document }) => !document?.portraitImage,
    },
    {
      name: "portraitCaption",
      title: "Portrait caption",
      description: "Small caption line under the portrait, e.g. a name or title. Optional — leave blank to show nothing.",
      type: "string",
      group: "experienceNarrative",
      placeholder: "Tony Sharma",
    },
    {
      name: "portraitSubCaption",
      title: "Portrait sub-caption",
      description: "Smaller secondary caption line under the portrait caption. Optional — leave blank to show nothing.",
      type: "string",
      group: "experienceNarrative",
      placeholder: "Product Designer",
    },

    // --- Group 3: Philosophy ---
    {
      name: "philosophyLabel",
      title: "Philosophy label",
      description: 'Small eyebrow label above the philosophy paragraph, e.g. "My Philosophy". Optional.',
      type: "string",
      group: "philosophy",
      placeholder: "My Philosophy",
    },
    {
      name: "philosophyText",
      title: "Philosophy paragraph",
      description: "Supporting paragraph beneath the philosophy label. Keep to 2–3 short sentences.",
      type: "text",
      rows: 4,
      group: "philosophy",
      placeholder:
        "The best products don't just work well, they feel like someone cared enough to get the details right. That's what I aim for in every screen I design.",
    },
    {
      name: "philosophyHeadline",
      title: "Philosophy headline",
      description: 'Large statement headline, e.g. "I design Applications and Websites that build credibility."',
      type: "text",
      rows: 2,
      group: "philosophy",
      placeholder: "I design Applications and Websites that build credibility.",
      validation: (Rule) => Rule.required(),
    },

    // --- Group 4: Professional Experience ---
    {
      name: "experienceHeading",
      title: "Experience card heading",
      description: 'Heading shown at the top of the floating card, e.g. "Professional Experience".',
      type: "string",
      group: "professionalExperience",
      placeholder: "Professional Experience",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "experienceEntries",
      title: "Experience entries",
      description: "The year-by-year timeline rows inside the floating card. Drag to reorder — they render top to bottom in this order.",
      type: "array",
      group: "professionalExperience",
      of: [
        {
          type: "object",
          name: "experienceEntry",
          fields: [
            {
              name: "year",
              title: "Year",
              type: "string",
              placeholder: "2024",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "description",
              title: "Description",
              description: "Keep to 1–2 short lines — this sits in a fixed-width card next to the year.",
              type: "text",
              rows: 2,
              placeholder: "Launched NudgeFile — first solo shipped product, design to code",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: "year", subtitle: "description" },
          },
        },
      ],
    },
    {
      name: "experienceBackgroundImage",
      title: "Experience background image",
      description: "Full-width parallax background photo behind the Professional Experience card.",
      type: "image",
      options: { hotspot: true },
      group: "professionalExperience",
    },
    {
      name: "experienceBackgroundImageAlt",
      title: "Experience background image — alt text",
      type: "string",
      group: "professionalExperience",
      placeholder: "Close-up of an elderly woman smiling softly, warm natural light",
      validation: (Rule) => Rule.required(),
      hidden: ({ document }) => !document?.experienceBackgroundImage,
    },

    // --- Group 5: Know More / Annotation Dots ---
    {
      name: "knowMoreHeadline",
      title: "Know More headline",
      description: 'Large headline, e.g. "Know more about Myself Beyond as a designer". The annotation dots sit on top of this text.',
      type: "text",
      rows: 2,
      group: "knowMore",
      placeholder: "Know more about Myself Beyond as a designer",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "annotationDots",
      title: "Annotation dots",
      description: "Dot position on screen is controlled in code — only the tooltip text should be edited here. Entries are matched to dots in order (1st entry = 1st dot, and so on).",
      type: "array",
      group: "knowMore",
      of: [
        {
          type: "object",
          name: "annotationDot",
          fields: [
            {
              name: "label",
              title: "Label (internal reference only)",
              description: 'Not shown on the site — just for finding the right dot in this list, e.g. "Dot 1".',
              type: "string",
              placeholder: "Dot 1",
            },
            {
              name: "tooltipText",
              title: "Tooltip text",
              description: "Keep to 1–2 short lines — this renders inside a fixed-width tooltip box.",
              type: "text",
              rows: 3,
              placeholder: "Beans and potatoes? Not my thing. But I like mashed Potatoes 😅",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "tooltipText" },
          },
        },
      ],
    },

    // --- Group 6: Personal / Travel ---
    {
      name: "personalParagraphOne",
      title: "Personal paragraph 1",
      description: "First personal/travel paragraph, shown before the Exploring India headline.",
      type: "text",
      rows: 4,
      group: "personalTravel",
      placeholder:
        "I love traveling around India, exploring greenery and snow. But my wallet always seems to cry at the thought! It's like every time I plan a trip, one of my friends decides it's a great time to bail at the last minute. Perfect timing, right?",
    },
    {
      name: "personalParagraphTwo",
      title: "Personal paragraph 2",
      description: "Second personal/travel paragraph, shown alongside paragraph 1 before the Exploring India headline.",
      type: "text",
      rows: 4,
      group: "personalTravel",
      placeholder:
        "I've always loved how design affects the way people feel and interact. I work to create easy-to-use designs and visuals that people remember, making every experience enjoyable and valuable.",
    },
    {
      name: "exploringIndiaHeadline",
      title: "Exploring India headline",
      type: "string",
      group: "personalTravel",
      placeholder: "Exploring India",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "exploringIndiaText",
      title: "Exploring India paragraph",
      description: "Supporting paragraph shown under the Exploring India headline.",
      type: "text",
      rows: 4,
      group: "personalTravel",
      placeholder:
        "As I mentioned, I love traveling! So far, I've explored 10 states and over 30 cities across India, each place adding something unique to my journey.",
    },
    {
      name: "travelPhotoCollage",
      title: "Travel photo collage",
      description: "Photos for the travel collage strip. Add, remove, or reorder freely — no developer needed.",
      type: "array",
      group: "personalTravel",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alt text",
              type: "string",
              placeholder: "Sunset over the Himalayan foothills",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { imageUrl: "asset.url", title: "alt" },
          },
        },
      ],
    },

    // --- Group 7: Closing / CTA ---
    {
      name: "closingHeadlineOne",
      title: "Closing headline — line 1",
      description: "First line of the closing headline above the footer/contact panel.",
      type: "text",
      rows: 2,
      group: "closingCta",
      placeholder: "Let's Create a",
    },
    {
      name: "closingHeadlineTwo",
      title: "Closing headline — line 2",
      description: "Second line of the closing headline above the footer/contact panel.",
      type: "text",
      rows: 2,
      group: "closingCta",
      placeholder: "Remarkable Journey",
    },
    {
      name: "ctaEyebrow",
      title: "CTA eyebrow",
      description: 'Small label above the contact email, e.g. "Always up for good design talk".',
      type: "string",
      group: "closingCta",
      placeholder: "Always up for good design talk",
    },
    {
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      group: "closingCta",
      placeholder: "Tony2742000@gmail.com",
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: "ctaButtonLabel",
      title: "CTA button label",
      description: 'e.g. "Book a call with me".',
      type: "string",
      group: "closingCta",
      placeholder: "Book a call with me",
    },
    {
      name: "ctaButtonLink",
      title: "CTA button link",
      description: "Where the CTA button goes — a mailto:, tel:, or booking-page URL.",
      type: "url",
      group: "closingCta",
      placeholder: "mailto:Tony2742000@gmail.com",
      validation: (Rule) =>
        Rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
    },
  ],
  preview: {
    select: {
      title: "heroHeadline",
      media: "portraitImage",
    },
    prepare({ title, media }) {
      return { title: "About Page", subtitle: title, media };
    },
  },
};

// One-time content seed: pushes the site's existing hardcoded copy and
// images (the same fallback content baked into the React components)
// into Sanity, so the Studio starts populated instead of empty.
//
// Usage:
//   1. Create a write-capable API token at
//      https://sanity.io/manage -> your project -> API -> Tokens
//      ("Editor" permission is enough), and add it to .env as
//      SANITY_WRITE_TOKEN (no VITE_ prefix — it must never ship to the
//      browser bundle).
//   2. node --env-file=.env scripts/seed-sanity.mjs
//
// Safe to re-run: singletons use createOrReplace on a fixed _id, and
// repeatable docs use deterministic _id's (e.g. "project-tekxera"), so
// re-running updates the same documents instead of duplicating them.

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const projectId = process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.VITE_SANITY_DATASET || "production";
const apiVersion = process.env.VITE_SANITY_API_VERSION || "2024-01-01";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId) {
  console.error("Missing VITE_SANITY_PROJECT_ID (check your .env).");
  process.exit(1);
}
if (!token) {
  console.error(
    "Missing SANITY_WRITE_TOKEN.\n" +
      "Create one at https://sanity.io/manage -> your project -> API -> Tokens\n" +
      "(Editor permission), add it to .env as SANITY_WRITE_TOKEN, then re-run:\n" +
      "  node --env-file=.env scripts/seed-sanity.mjs"
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const uploadedAssets = new Map();

async function uploadImage(relativePath) {
  if (uploadedAssets.has(relativePath)) return uploadedAssets.get(relativePath);
  const absPath = path.join(root, relativePath);
  const buffer = readFileSync(absPath);
  const asset = await client.assets.upload("image", buffer, {
    filename: path.basename(relativePath),
  });
  const ref = { _type: "image", asset: { _type: "reference", _ref: asset._id } };
  uploadedAssets.set(relativePath, ref);
  console.log(`  uploaded ${relativePath}`);
  return ref;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function color(hex) {
  return { _type: "color", hex, alpha: 1 };
}

async function seedThemes() {
  console.log("Themes...");
  // Exact current hardcoded values — keeps "Light" pixel-identical to
  // what the site has always rendered, whether or not this doc exists.
  await client.createOrReplace({
    _id: "theme-light",
    _type: "theme",
    name: "Light",
    primaryAccent: color("#114AFC"),
    primaryAccentHover: color("#022CDB"),
    backgroundColor: color("#F9F9F9"),
    textColor: color("#0d0c14"),
    statValueColor: color("#0d0c14"),
    statsCubeFrontColor: color("#114AFC"),
    statsCubeSideColor: color("#0013B2"),
    statsCubeLineColor: color("#022CDB"),
  });

  // Red Diamond: dark/near-black surfaces (matching dark mode's own
  // near-black) with the purple accent swapped for #A60000 everywhere,
  // and hero/body text forced white for readability on the dark
  // background — see themeTokens.js for how textColor drives that.
  await client.createOrReplace({
    _id: "theme-red-diamond",
    _type: "theme",
    name: "Red Diamond",
    primaryAccent: color("#A60000"),
    primaryAccentHover: color("#7a0000"),
    backgroundColor: color("#0c0a14"),
    textColor: color("#ffffff"),
    statValueColor: color("#A60000"),
    statsCubeFrontColor: color("#A60000"),
    statsCubeSideColor: color("#7a0000"),
    statsCubeLineColor: color("#8f0000"),
  });
}

async function seedSiteSettings() {
  console.log("Site Settings...");
  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    selectedTheme: { _type: "reference", _ref: "theme-light" },
  });
}

async function seedNavigation() {
  console.log("Navigation...");
  await client.createOrReplace({
    _id: "navigation",
    _type: "navigation",
    items: [
      { _key: "work", label: "Work", link: "#featured-projects" },
      { _key: "about", label: "About", link: "#about" },
      { _key: "contact", label: "Contact", link: "#contact" },
      { _key: "resume", label: "Resume", link: "#" },
    ],
  });
}

async function seedHomepageContent() {
  console.log("Homepage Content...");
  await client.createOrReplace({
    _id: "homepageContent",
    _type: "homepageContent",
    heroHeadline: "HELLO I'M TONY",
    heroBasedInLocation: "INDIA",
    heroTagline: "DESIGN WITH AI",
    heroSpecs: ["UIUX DESIGNER", "ACCESSIBILITY(A11Y)", "DESIGN SYSTEM"],
    heroBadgeLine1: "STILL WAITING FOR",
    heroBadgeLine2: "FIRST DESIGN AWARD 🏆",
    aboutBodyParagraph1:
      "I value clarity, structure, and intent — both in design and in how I build. I am drawn to systems that hold up under scale: patterns, not one-offs. I believe good design is governed, not just made — every decision should trace back to a reason.",
    aboutBodyParagraph2:
      "I like building things end to end, from the first sketch to the shipped product. And I trust frameworks over instinct — but only the ones I've tested myself.",
    statementHeadline: "Design is a series of decisions so you",
    statementTrailingLine: "Don't have to make one.",
  });
}

// Builds a demo caseStudyBody: intro paragraph, an H2, another
// paragraph, a full-bleed captioned image, a second H2, and a
// multi-image gallery block — exercises every block type the case
// study page's Portable Text renderer supports (headings, paragraphs,
// full-width image break, image grid) in one pass.
function buildDemoCaseStudyBody(id, shortDescription, images) {
  return [
    {
      _type: "block",
      _key: `${id}-intro`,
      style: "normal",
      children: [{ _type: "span", _key: `${id}-intro-span`, text: shortDescription }],
    },
    {
      _type: "block",
      _key: `${id}-h2-1`,
      style: "h2",
      children: [{ _type: "span", _key: `${id}-h2-1-span`, text: "The Problem" }],
    },
    {
      _type: "block",
      _key: `${id}-p1`,
      style: "normal",
      children: [
        {
          _type: "span",
          _key: `${id}-p1-span`,
          text: "Early usage data showed people understood the product's value the moment they saw it work — the drop-off happened earlier, in the handful of screens before that moment. We mapped every step between signup and first real result, and found three places where the product asked for trust before it had earned any.",
        },
      ],
    },
    {
      _type: "captionedImage",
      _key: `${id}-hero-break`,
      ...images.full,
      alt: `${id} full-bleed visual`,
      caption: "Early exploration — mapping the first-five-minutes flow end to end.",
    },
    {
      _type: "block",
      _key: `${id}-h2-2`,
      style: "h2",
      children: [{ _type: "span", _key: `${id}-h2-2-span`, text: "The Approach" }],
    },
    {
      _type: "block",
      _key: `${id}-p2`,
      style: "normal",
      children: [
        {
          _type: "span",
          _key: `${id}-p2-span`,
          text: "Rather than redesign the whole flow, we replaced each trust-breaking moment with a small, specific explanation exactly where the doubt appeared — before an irreversible action, not after. The rest of the interface stayed untouched.",
        },
      ],
    },
    {
      _type: "gallery",
      _key: `${id}-gallery`,
      images: [
        { ...images.gallery1, _key: `${id}-gallery-1`, alt: `${id} detail view 1` },
        { ...images.gallery2, _key: `${id}-gallery-2`, alt: `${id} detail view 2` },
      ],
    },
  ];
}

async function seedProjects() {
  console.log("Projects...");
  const projects = [
    {
      id: "tekxera",
      title: "Tekxera\nTechnology",
      client: "Tekxera",
      mainImage: "src/assets/project-tekxera.webp",
      thumbnailImage: "src/assets/project-jewelry.webp",
      shortDescription:
        "NudgeFile renames and sorts your files with a local AI — but it asks first, and it always has an undo button, because trusting an AI with your file system sight-unseen is how horror movies start.",
      industry: "TECHNOLOGY | IT SUPPORT",
      role: "UIUX DESIGNER | DESIGN SYSTEM",
      timeline: "6 Weeks · Q1 2026",
      tools: ["Figma", "React", "GSAP"],
      overviewParagraphs: [
        "Tekxera's local-AI file assistant, NudgeFile, worked well in testing but saw a third of new users disable it within their first session — not because it made mistakes, but because it acted before explaining itself.",
        "Support tickets and session recordings pointed to the same handful of moments: batch renames and moves happening automatically, with no visible way to know what changed or undo it.",
        "The goal was narrow: rebuild the first-run experience so every automatic action is visible, explained, and reversible, without adding a single extra click for users who already trust the tool.",
      ],
      outcomeStats: [
        { value: "32%", label: "Reduction in first-session opt-out" },
        { value: "2.4x", label: "Faster first successful rename batch" },
        { value: "18", label: "Components shipped to the design system" },
      ],
      gallery: {
        full: { image: "src/assets/project-jewelry.webp" },
        gallery1: { image: "src/assets/project-strategy.webp" },
        gallery2: { image: "src/assets/about-portrait.webp" },
      },
      displayOrder: 1,
    },
    {
      id: "aurelle",
      title: "Aurelle Fine\nJewelry",
      client: "Aurelle",
      mainImage: "src/assets/project-jewelry.webp",
      thumbnailImage: "src/assets/project-strategy.webp",
      shortDescription:
        "An immersive luxury e-commerce experience crafted for high-end bespoke jewelry, featuring fluid micro-interactions, spatial product showcases, and bespoke design systems.",
      industry: "E-COMMERCE | LUXURY RETAIL",
      role: "LEAD DESIGNER | FRONTEND ARCHITECT",
      timeline: "10 Weeks · Q4 2025",
      tools: ["Figma", "Three.js", "Shopify Hydrogen"],
      overviewParagraphs: [
        "Aurelle sells bespoke jewelry starting at five figures, but the existing site presented every piece the same way a mass-market retailer would: a grid, a price, an 'add to cart.'",
        "For a considered, high-trust purchase, that flattening was costing them consultations. The brief was to make the site feel like walking into the atelier, not a warehouse.",
        "We rebuilt product presentation around spatial, close-up exploration and slowed the pacing deliberately, trading conversion-funnel speed for the kind of confidence a five-figure purchase actually needs.",
      ],
      outcomeStats: [
        { value: "47%", label: "More consultation requests per visitor" },
        { value: "3.1x", label: "Longer average session on product pages" },
        { value: "12", label: "Bespoke product configurators shipped" },
      ],
      gallery: {
        full: { image: "src/assets/project-strategy.webp" },
        gallery1: { image: "src/assets/project-tekxera.webp" },
        gallery2: { image: "src/assets/about-portrait.webp" },
      },
      displayOrder: 2,
    },
    {
      id: "meridian",
      title: "Meridian\nTelemetry",
      client: "Meridian",
      mainImage: "src/assets/project-strategy.webp",
      thumbnailImage: "src/assets/project-tekxera.webp",
      shortDescription:
        "Real-time financial risk assessment and decision-making platform for enterprise finance teams. Consolidates multi-market telemetry streams into intuitive interactive dashboards.",
      industry: "FINTECH | RISK ANALYTICS",
      role: "PRODUCT DESIGNER | GSAP DEVELOPER",
      timeline: "14 Weeks · Q2 2025",
      tools: ["Figma", "D3.js", "GSAP", "WebSocket streaming"],
      overviewParagraphs: [
        "Meridian's risk desk was reading eleven separate market-data tools side by side, cross-referencing by memory during the exact moments when a slow read costs money.",
        "The ask wasn't a prettier dashboard — it was a single surface that could hold multi-market telemetry at a glance without hiding the precision analysts actually needed underneath.",
        "We designed a layered system: an always-visible overview for ambient awareness, with every widget one interaction away from the full precision view analysts used to make the actual call.",
      ],
      outcomeStats: [
        { value: "41%", label: "Faster time-to-decision on flagged risk" },
        { value: "11 → 1", label: "Tools consolidated into one surface" },
        { value: "99.98%", label: "Uptime on the live telemetry layer" },
      ],
      gallery: {
        full: { image: "src/assets/project-tekxera.webp" },
        gallery1: { image: "src/assets/project-jewelry.webp" },
        gallery2: { image: "src/assets/about-portrait.webp" },
      },
      displayOrder: 3,
    },
  ];

  for (const p of projects) {
    const mainImage = await uploadImage(p.mainImage);
    const thumbnailImage = await uploadImage(p.thumbnailImage);
    const galleryImages = {
      full: await uploadImage(p.gallery.full.image),
      gallery1: await uploadImage(p.gallery.gallery1.image),
      gallery2: await uploadImage(p.gallery.gallery2.image),
    };
    await client.createOrReplace({
      _id: `project-${p.id}`,
      _type: "project",
      title: p.title,
      client: p.client,
      slug: { _type: "slug", current: slugify(p.client) },
      mainImage,
      thumbnailImage,
      shortDescription: p.shortDescription,
      industry: p.industry,
      role: p.role,
      timeline: p.timeline,
      tools: p.tools,
      overviewParagraphs: p.overviewParagraphs,
      outcomeStats: p.outcomeStats.map((s, i) => ({ ...s, _key: `${p.id}-stat-${i}` })),
      displayOrder: p.displayOrder,
      caseStudyBody: buildDemoCaseStudyBody(p.id, p.shortDescription, galleryImages),
    });
  }
}

async function seedStatCards() {
  console.log("Stat Cards...");
  const stats = [
    { id: "exp", label: "Experience", value: "5+ Years", title: "Crafting UX & Systems", description: "Building design engines & scalable UI components for high-growth tech products.", displayOrder: 1 },
    { id: "systems", label: "Design Systems", value: "10+ Systems", title: "Tokens & Component Specs", description: "Precision token architectures engineered for speed, themeability, and accessibility.", displayOrder: 2 },
    { id: "shipped", label: "Products Shipped", value: "15+ Apps", title: "Mobile, Web & Desktop", description: "End-to-end user interfaces delivered from early concept to production code.", displayOrder: 3 },
    { id: "impact", label: "Impact", value: "100k+ Users", title: "Global Audience", description: "Creating intuitive interfaces trusted daily by thousands of active users.", displayOrder: 4 },
    { id: "centerpiece", label: "Projects Shipped", value: "20+", title: "", description: "NudgeFile renames and sorts your files with a local AI — but it asks first, and it always has an undo button, because trusting an AI with your file system sight-unseen is how horror movies start.", displayOrder: 5 },
  ];
  for (const s of stats) {
    await client.createOrReplace({
      _id: `statCard-${s.id}`,
      _type: "statCard",
      label: s.label,
      value: s.value,
      title: s.title,
      description: s.description,
      displayOrder: s.displayOrder,
    });
  }
}

async function seedTestimonials() {
  console.log("Testimonials...");
  const sourceLogo = await uploadImage("src/assets/topmate-logo.png");
  const testimonials = [
    { id: "radhika", name: "RADHIKA MALHOTRA", role: "Product Designer", quote: "I booked a portfolio review session with Tony and it was really insightful. He gave me a lot of tips and things to improve upon. I also feel more inspired towards my work approach after the call. He seemed like a dedicated designer knowing a lot about the industry. If you have any confusion in your Design Career, I recommend to get in touch with him.", displayOrder: 1 },
    { id: "deepanshu", name: "DEEPANSHU", role: "UI/UX Designer", quote: "Tony has been an incredible support throughout my portfolio revamp and job search journey. His insights, feedback, and guidance made the entire process smoother and more focused. From helping me fine-tune my work to giving strategic advice, Tony truly made a difference. Grateful for all the help!", displayOrder: 2 },
    { id: "vaishnavi", name: "VAISHNAVI", role: "Aspiring Designer", quote: "The session was incredibly insightful and exactly what I needed as a beginner in UI/UX. Tony sir explained things so clearly, broke down complex concepts into simple steps, and gave me practical advice that really boosted my confidence. I finally feel like I have a direction to move forward in. Super grateful for such a helpful and supportive session!", displayOrder: 3 },
    { id: "neha", name: "NEHA BISHT", role: "UX Researcher", quote: "I truly appreciate the way he teaches and ensures every concept is thoroughly explained. His teaching style is clear, engaging, and easy to understand. He patiently addresses all my doubts and makes sure I grasp each topic with confidence. Thank you so much for helping me and making learning such a great experience.", displayOrder: 4 },
    { id: "ankit", name: "ANKIT VERMA", role: "Product Designer", quote: "Tony's mentorship session gave me immense clarity on product design frameworks and portfolio presentation. His actionable feedback helped me refine my design case studies and stand out in interviews!", displayOrder: 5 },
  ];
  for (const t of testimonials) {
    await client.createOrReplace({
      _id: `testimonial-${t.id}`,
      _type: "testimonial",
      quote: t.quote,
      name: t.name,
      role: t.role,
      sourcePlatform: "Topmate",
      sourceLogo,
      displayOrder: t.displayOrder,
    });
  }
}

async function seedArticles() {
  console.log("Articles...");
  const articles = [
    {
      id: "guilt-loop",
      title: "The Guilt-Loop: How Apps Are Designed to Make You Feel Bad About Leaving",
      excerpt: "A few months ago I tried to cancel a subscription I'd forgotten I had. The button wasn't hidden; I found it in seconds…",
      publishDate: "2026-07-13",
      thumbnail: "public/images/insights/guilt-loop.jpg",
      externalLink: "https://medium.com/@tony2742000/the-guilt-loop-how-apps-are-designed-to-make-you-feel-bad-about-leaving-2460f7be4b58?sharedUserId=tony2742000",
      sourcePlatform: "Medium",
      displayOrder: 1,
    },
    {
      id: "client-ux",
      title: "Balancing Client Input and UX Expertise: Avoiding Design Risk",
      excerpt: "In the world of UX design, collaboration with clients is important. Their insights, knowledge of the business, and…",
      publishDate: "2026-07-13",
      thumbnail: "public/images/insights/client-ux.jpg",
      externalLink: "https://www.linkedin.com/pulse/balancing-client-input-ux-expertise-avoiding-design-risk-tony--nipuc",
      sourcePlatform: "LinkedIn",
      displayOrder: 2,
    },
  ];
  for (const a of articles) {
    const thumbnail = await uploadImage(a.thumbnail);
    await client.createOrReplace({
      _id: `article-${a.id}`,
      _type: "article",
      title: a.title,
      excerpt: a.excerpt,
      publishDate: a.publishDate,
      thumbnail,
      externalLink: a.externalLink,
      sourcePlatform: a.sourcePlatform,
      displayOrder: a.displayOrder,
    });
  }
}

async function main() {
  console.log(`Seeding Sanity project ${projectId}/${dataset}...\n`);
  await seedNavigation();
  await seedHomepageContent();
  await seedThemes();
  await seedSiteSettings();
  await seedProjects();
  await seedStatCards();
  await seedTestimonials();
  await seedArticles();
  console.log(
    "\nDone. Refresh the Studio to see the content.\n" +
      'Site Settings currently points at "Light" — switch it to "Red Diamond" in the Studio to preview the new theme.'
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message || err);
  process.exit(1);
});

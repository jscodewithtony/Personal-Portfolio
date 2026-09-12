// Build-time sitemap: writes public/sitemap.xml from the static routes
// plus every published Sanity project slug, so Vite ships it at
// /sitemap.xml. Runs as part of `npm run build` (see package.json).
//
// Reads the public dataset anonymously — no token needed, same as the
// site's own client — so only PUBLISHED projects appear (drafts are
// never returned to unauthenticated reads). Degrades on Sanity failure
// rather than failing the build: writes the static routes only and
// warns, since a missing project entry is recoverable and a broken
// deploy is not.

import { createClient } from "@sanity/client";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Optional: pick up .env if present (local builds). CI can supply the
// same VITE_SANITY_* vars directly, so a missing .env is not an error.
try {
  process.loadEnvFile(".env");
} catch {}

const SITE_URL = "https://heytony.design";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.resolve(__dirname, "..", "public", "sitemap.xml");

const projectId = process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.VITE_SANITY_DATASET || "production";
const apiVersion = process.env.VITE_SANITY_API_VERSION || "2024-01-01";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/work", priority: "0.9", changefreq: "weekly" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
  { path: "/say-hi", priority: "0.5", changefreq: "yearly" },
];

async function fetchProjects() {
  if (!projectId) {
    console.warn("[sitemap] VITE_SANITY_PROJECT_ID not set — writing static routes only.");
    return [];
  }
  const client = createClient({ projectId, dataset, apiVersion, useCdn: true });
  return client.fetch(
    `*[_type == "project" && defined(slug.current)] | order(displayOrder asc){
      "slug": slug.current,
      _updatedAt
    }`
  );
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[c]);
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

let projects = [];
try {
  projects = await fetchProjects();
} catch (err) {
  console.warn(`[sitemap] Sanity fetch failed (${err.message}) — writing static routes only.`);
}

const today = new Date().toISOString();

const entries = [
  ...STATIC_ROUTES.map((r) =>
    urlEntry({ loc: `${SITE_URL}${r.path}`, lastmod: today, changefreq: r.changefreq, priority: r.priority })
  ),
  ...projects.map((p) =>
    urlEntry({
      loc: `${SITE_URL}/projects/${p.slug}`,
      lastmod: p._updatedAt,
      changefreq: "monthly",
      priority: "0.8",
    })
  ),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.join("\n") +
  "\n</urlset>\n";

writeFileSync(outFile, xml, "utf8");
console.log(
  `[sitemap] wrote ${path.relative(process.cwd(), outFile)} — ${STATIC_ROUTES.length} static + ${projects.length} project URLs`
);

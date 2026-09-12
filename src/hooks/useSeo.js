import { useEffect } from "react";

const SITE_URL = "https://heytony.design";
const SITE_NAME = "Tony — Product & UX Designer";

// Client-side <head> management. Deliberately manual (no react-helmet):
// helmet's peer range stops at React 18, and React 19's native <title>
// hoisting can't replace the static fallback tags in index.html — it
// would add a second <title>, and browsers honor the first. Updating
// the existing tags in place keeps the static index.html set as the
// no-JS fallback (all social crawlers) while JS-executing clients
// (Google) get per-route values.
//
// Known limitation until SSR/prerendering exists: none of this reaches
// crawlers that don't run JS. It's wired now so the data is flowing the
// moment prerendering lands — a DOM-snapshot prerenderer captures these
// as-is.

function upsertMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// CMS titles carry display line-breaks ("Aurelle Fine\nJewelry") and
// stray trailing spaces; collapse to single-line for <head> use.
const clean = (s) => (s ? String(s).replace(/\s+/g, " ").trim() : s);

// `path` should be the route's canonical pathname ("/about",
// "/projects/foo"). Query strings and hashes are intentionally not
// part of the canonical URL.
export function useSeo({ title, description, image, path, type = "website" }) {
  useEffect(() => {
    const cleanTitle = clean(title);
    const fullTitle = cleanTitle ? `${cleanTitle} | ${SITE_NAME}` : SITE_NAME;
    description = clean(description);
    const url = `${SITE_URL}${path || "/"}`;

    document.title = fullTitle;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    }
    upsertCanonical(url);
  }, [title, description, image, path, type]);
}

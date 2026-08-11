import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { projectId, dataset, apiVersion, hasSanityConfig } from "./env";

// `useCdn: true` — every read on the public site is anonymous/published
// content, so the fast, cached CDN endpoint is preferred over the
// live API used inside the Studio itself.
export const sanityClient = hasSanityConfig
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null;

const builder = sanityClient ? imageUrlBuilder(sanityClient) : null;

// Returns an @sanity/image-url builder, or null if Sanity isn't
// configured yet or no image asset was passed — callers fall back to
// their existing static asset in that case.
export function urlFor(source) {
  if (!builder || !source) return null;
  return builder.image(source);
}

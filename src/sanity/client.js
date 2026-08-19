import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { projectId, dataset, apiVersion, hasSanityConfig } from "./env";

// `useCdn: true` — every read on the public site is anonymous/published
// content, so the fast, cached CDN endpoint is preferred over the
// live API used inside the Studio itself.
export const sanityClient = hasSanityConfig
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null;

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null;

// Returns an @sanity/image-url builder, or null if Sanity isn't
// configured yet or no image asset was passed — callers fall back to
// their existing static asset in that case.
export function urlFor(source) {
  if (!builder || !source) return null;
  return builder.image(source);
}

// Sanity's image CDN flattens animated GIFs to a single static frame
// the moment any transform (.width(), .height(), .fit(), etc.) is
// requested — the raw, untransformed asset URL is the only one that
// preserves animation. Asset refs encode their format as a suffix
// (e.g. "image-abc123-800x600-gif"), so a GIF can be detected and
// served untransformed instead of silently losing its animation.
export function isGifAsset(source) {
  return typeof source?.asset?._ref === "string" && source.asset._ref.endsWith("-gif");
}

// urlFor(source)?.width(width).url(), except a GIF source skips the
// resize transform entirely (see isGifAsset) so it keeps animating.
export function imageUrl(source, width) {
  const built = urlFor(source);
  if (!built) return null;
  if (isGifAsset(source)) return built.url();
  return width ? built.width(width).url() : built.url();
}

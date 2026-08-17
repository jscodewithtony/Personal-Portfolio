import { createClient } from "@sanity/client";
import { projectId, dataset, apiVersion, hasSanityConfig } from "./env";

const viewerToken = import.meta.env.VITE_SANITY_VIEWER_TOKEN;

// Preview-only client — reads the "previewDrafts" perspective (draft +
// published, drafts winning) instead of the CDN-cached published-only
// dataset the public site uses. Only ever instantiated behind the
// `?sanityPreview=1` flag (see preview.js / AboutPage.jsx); no other
// page or component touches this file, so the public site's data path
// (client.js's `sanityClient`) is completely unaffected.
//
// Security note: this token is a VITE_-prefixed env var, so — like any
// Vite client env var — it ends up in the built preview bundle and is
// technically extractable by anyone who finds it. Use a "Viewer" role
// token (read-only) from sanity.io/manage, never an Editor/Admin token.
// Full protection would need a server to broker the token, which this
// static Vite SPA doesn't have; that's an accepted tradeoff for this
// lightweight, backend-free preview setup on a personal site.
export const previewClient =
  hasSanityConfig && viewerToken
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false,
        token: viewerToken,
        perspective: "previewDrafts",
        // Embeds invisible field-path metadata into string content so
        // @sanity/visual-editing's click-to-edit overlays can map a
        // rendered element back to its Studio field. `studioUrl` must
        // match sanity.config.js's `basePath`.
        stega: {
          enabled: true,
          studioUrl: "/admin",
        },
      })
    : null;

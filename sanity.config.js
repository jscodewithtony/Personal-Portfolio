import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { colorInput } from "@sanity/color-input";
import { schemaTypes, singletonTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { portfolioStudioTheme } from "./src/sanity/theme";
import StudioLogo from "./src/sanity/StudioLogo";
import { projectId, dataset } from "./src/sanity/env";

// Site + Studio share one origin (Studio is embedded at /admin on the
// same domain), so the Presentation preview iframe just points back at
// this same origin's public routes.
const PREVIEW_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

// Maps a schema type to the site route(s) it renders on, so Presentation
// knows what to load in its preview iframe (and shows a "used on this
// page" location bar on the document). Every href carries
// `?sanityPreview=1` — the flag the target page checks (see
// src/sanity/preview.js) to switch from the public, published-only
// client to the drafts-aware preview client with live refetching. To
// extend live preview to another document type: add an entry here, then
// wire that page the same way AboutPage.jsx is wired (isPreviewMode() +
// previewClient passed into useSanityQuery's 4th argument). Only
// aboutPage is wired up today, per current scope.
const PREVIEW_LOCATIONS = {
  aboutPage: () => ({
    locations: [{ title: "About Page", href: "/about?sanityPreview=1" }],
  }),
};

export default defineConfig({
  name: "default",
  title: "I'm Tony — Studio",
  // Embedded at /admin on the existing domain via AdminStudio.jsx
  // (react-router basename), not a separate *.sanity.studio subdomain.
  basePath: "/admin",

  projectId,
  dataset,

  theme: portfolioStudioTheme,
  icon: StudioLogo,

  plugins: [
    structureTool({ structure }),
    // Live preview: shows the actual site rendering the document being
    // edited, refetching as fields change (see useSanityQuery.js's
    // `client.listen()` wiring). Click-to-edit overlays run via
    // @sanity/visual-editing's enableVisualEditing(), mounted at the
    // frontend's app root (src/App.jsx) rather than per-page, since this
    // tool's preview iframe can land on any route.
    presentationTool({
      // `preview` is the route Presentation loads by DEFAULT — before
      // you've drilled into a specific document via the right-hand
      // panel (resolve.locations only kicks in once a document is
      // selected). Without the flag here too, that default landing
      // view never triggers the visual-editing connector at all, no
      // matter where enableVisualEditing() is mounted on the frontend.
      previewUrl: { origin: PREVIEW_ORIGIN, preview: "/?sanityPreview=1" },
      resolve: { locations: PREVIEW_LOCATIONS },
    }),
    visionTool(),
    colorInput(),
  ],

  schema: {
    types: schemaTypes,
    // Singletons never appear in the generic "create new document"
    // menu — the desk structure (structure.js) is the only way to
    // reach the one navigation / homepageContent document.
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  document: {
    // Removes "Duplicate" and "Delete" from singleton documents —
    // exactly one navigation and one homepageContent document must
    // always exist.
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(
            ({ action }) => action !== "duplicate" && action !== "delete"
          )
        : input,
    // Keeps singleton types out of the "+ New document" search/menu
    // entirely, on top of the template filter above.
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter(
          (option) => !singletonTypes.has(option.templateId)
        );
      }
      return prev;
    },
  },
});

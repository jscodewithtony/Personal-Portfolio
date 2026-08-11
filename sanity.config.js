import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { colorInput } from "@sanity/color-input";
import { schemaTypes, singletonTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { portfolioStudioTheme } from "./src/sanity/theme";
import StudioLogo from "./src/sanity/StudioLogo";
import { projectId, dataset } from "./src/sanity/env";

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

  plugins: [structureTool({ structure }), visionTool(), colorInput()],

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

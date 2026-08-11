import { defineCliConfig } from "sanity/cli";

// Separate from sanity.config.js (the Studio's own config, read by the
// browser bundle via import.meta.env) — this one is read by the `sanity`
// CLI itself (cors, deploy, dataset commands, etc.) in a plain Node
// context, so it reads process.env rather than import.meta.env.
export default defineCliConfig({
  api: {
    projectId: process.env.VITE_SANITY_PROJECT_ID,
    dataset: process.env.VITE_SANITY_DATASET || "production",
  },
});

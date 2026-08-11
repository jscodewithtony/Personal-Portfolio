// Central place for the Sanity connection settings so client.js and
// sanity.config.js (Studio) read the exact same values instead of two
// copies drifting apart.
export const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || "3hjqpfgb";
export const dataset = import.meta.env.VITE_SANITY_DATASET || "production";
export const apiVersion =
  import.meta.env.VITE_SANITY_API_VERSION || "2024-01-01";

export const hasSanityConfig = Boolean(projectId);

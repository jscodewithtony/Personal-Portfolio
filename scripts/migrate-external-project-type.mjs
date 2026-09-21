import { createClient } from "@sanity/client";

const projectId = process.env.VITE_SANITY_PROJECT_ID || "3hjqpfgb";
const dataset = process.env.VITE_SANITY_DATASET || "production";
const apiVersion = process.env.VITE_SANITY_API_VERSION || "2024-01-01";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Missing projectId or SANITY_WRITE_TOKEN in environment.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

async function main() {
  const docs = await client.fetch(`*[_type == "project"]{_id, _rev, title, externalLink, projectType}`);
  console.log(`Found ${docs.length} project documents.`);

  for (const doc of docs) {
    const targetType = (doc.externalLink && doc.externalLink.trim()) ? "external" : "internal";
    if (doc.projectType === targetType) {
      console.log(`[OK] ${doc.title} (${doc._id}) already has projectType="${targetType}"`);
      continue;
    }

    await client
      .patch(doc._id)
      .ifRevisionId(doc._rev)
      .set({ projectType: targetType })
      .commit();

    console.log(`[UPDATED] ${doc.title} (${doc._id}) -> projectType="${targetType}"`);
  }

  console.log("Migration finished successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

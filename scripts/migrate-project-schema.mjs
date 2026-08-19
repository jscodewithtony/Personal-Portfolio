// One-off data migration for the `project` schema rename (see
// schemaTypes/project.js): several fields were renamed or removed, so
// existing documents still carry data under the old field names, which
// Studio now flags as "Unknown fields found".
//
// For each `project` document:
//   - caseStudyBody  -> bodyContent   (copied only if bodyContent unset)
//   - thumbnailImage -> thumbnail     (copied only if thumbnail unset)
//   - tools          -> tags          (copied only if tags unset)
//   - client, timeline, outcomeStats, overviewParagraphs
//                    -> removed entirely (no equivalent field in the
//                       new schema; confirmed with the user to just
//                       clear these rather than fold them in elsewhere)
//
// Never overwrites a new-name field that's already been filled in
// through Studio — only fills gaps, then removes the old field names
// so the "unknown fields" warning clears.
//
// Usage: node --env-file=.env scripts/migrate-project-schema.mjs
// Safe to re-run: once a document has no more old field names present,
// there's nothing left for it to do.

import { createClient } from "@sanity/client";

const projectId = process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.VITE_SANITY_DATASET || "production";
const apiVersion = process.env.VITE_SANITY_API_VERSION || "2024-01-01";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId) {
  console.error("Missing VITE_SANITY_PROJECT_ID (check your .env).");
  process.exit(1);
}
if (!token) {
  console.error(
    "Missing SANITY_WRITE_TOKEN (check your .env) — see seed-sanity.mjs's header for how to create one."
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const RENAMES = [
  { from: "caseStudyBody", to: "bodyContent" },
  { from: "thumbnailImage", to: "thumbnail" },
  { from: "tools", to: "tags" },
];
const DROPPED = ["client", "timeline", "outcomeStats", "overviewParagraphs"];

async function main() {
  const docs = await client.fetch(`*[_type == "project"]`);

  let migratedDocs = 0;

  for (const doc of docs) {
    const setFields = {};
    const unsetFields = [];

    for (const { from, to } of RENAMES) {
      if (doc[from] === undefined) continue;
      if (doc[to] === undefined) setFields[to] = doc[from];
      unsetFields.push(from);
    }

    for (const field of DROPPED) {
      if (doc[field] !== undefined) unsetFields.push(field);
    }

    if (unsetFields.length === 0) continue;

    let patch = client.patch(doc._id).ifRevisionId(doc._rev);
    if (Object.keys(setFields).length > 0) patch = patch.set(setFields);
    patch = patch.unset(unsetFields);
    await patch.commit();

    migratedDocs += 1;
    console.log(
      `Migrated ${doc._id}: set [${Object.keys(setFields).join(", ") || "none"}], removed [${unsetFields.join(", ")}]`
    );
  }

  if (migratedDocs === 0) {
    console.log("No documents needed migration.");
  } else {
    console.log(`Done. Migrated ${migratedDocs} document(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

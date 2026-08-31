import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Coordinates ONE ScrollTrigger.refresh() across the homepage's batch
// of lazy, `introFinished`-gated sections (Statement, FeaturedProjects,
// Stats, MentorshipTestimonials, Insight, Footer — see HomePage.jsx).
// Each of those sections calls `useSignalSectionMounted(name)` once on
// mount; this module waits for every expected name to have signaled
// (or, failing that, a fixed backstop) and fires exactly one
// debounced refresh — instead of each section guessing independently,
// on its own fixed schedule, whether everything above it has settled.
//
// Replaces Insight.jsx's previous approach of firing
// `ScrollTrigger.refresh()` up to 5 times on a blind timer schedule
// (`fonts.ready` + 3 staggered `setTimeout`s + `window.load`), which
// existed to paper over the exact same problem this solves directly:
// these 6 chunks are independently `lazy()`-loaded and can finish
// mounting in any order, so a trigger positioned below a slower
// sibling (Stats' 532KB Three.js chunk, in particular) could measure
// its own position before that sibling's real height was in the page.
//
// Module-level state is intentional (it's how independent sibling
// components share one coordinator without prop-drilling or a new
// Context), but it's generation-scoped so repeat visits to the
// homepage (mount -> navigate away -> mount again) start a fresh
// cycle rather than silently no-op-ing forever after the first one:
// the tracked set empties out as sections unmount, and the next
// section to signal after that starts a new generation.
const EXPECTED_SECTIONS = [
  "statement",
  "featured-projects",
  "stats",
  "mentorship-testimonials",
  "insight",
  "footer",
];
const BACKSTOP_MS = 2500;
const DEBOUNCE_MS = 150;

let currentGeneration = 0;
let mountedInGeneration = new Set();
let refreshedGeneration = -1;
let debounceTimer = null;
let backstopTimer = null;

function refreshOnce(generation) {
  if (refreshedGeneration === generation) return;
  refreshedGeneration = generation;
  clearTimeout(backstopTimer);
  clearTimeout(debounceTimer);
  ScrollTrigger.refresh();
}

// `name` is nullable so a shared component (Footer, used on every page,
// not just the homepage) can opt in conditionally via a prop rather
// than needing a separate hook/branch — passing `null`/`undefined`
// makes this a no-op, so pages outside the coordinated homepage batch
// never touch this module's state.
export function useSignalSectionMounted(name) {
  useEffect(() => {
    if (!name) return;

    // Empty tracked set means either the very first mount, or every
    // section from a previous cycle has since unmounted — either way,
    // this is the start of a fresh batch.
    if (mountedInGeneration.size === 0) {
      currentGeneration += 1;
      const generation = currentGeneration;
      clearTimeout(backstopTimer);
      backstopTimer = setTimeout(() => refreshOnce(generation), BACKSTOP_MS);
    }

    const generation = currentGeneration;
    mountedInGeneration.add(name);

    if (EXPECTED_SECTIONS.every((expected) => mountedInGeneration.has(expected))) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => refreshOnce(generation), DEBOUNCE_MS);
    }

    return () => {
      mountedInGeneration.delete(name);
    };
  }, [name]);
}

import { Studio } from "sanity";
import config from "../../sanity.config.js";
import { hasSanityConfig } from "../sanity/env";

// Mounted at /admin/* by App.jsx. Rendered outside the public site's
// .site-shell wrapper so none of the portfolio's global type/casing
// rules reach the Studio's own UI (see index.css). Sanity's built-in
// login screen (handled internally by <Studio>) is the only auth gate
// — no separate auth layer is added here.
export default function AdminStudio() {
  if (!hasSanityConfig) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#0c0a14",
          color: "#f3efe3",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            Sanity Studio isn&rsquo;t configured yet
          </h1>
          <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
            Set <code>VITE_SANITY_PROJECT_ID</code> and{" "}
            <code>VITE_SANITY_DATASET</code> in your <code>.env</code> file
            (see <code>.env.example</code>), then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return <Studio config={config} />;
}

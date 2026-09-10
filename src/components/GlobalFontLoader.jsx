import { useEffect } from "react";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { siteSettingsQuery } from "../sanity/queries";

export function GlobalFontLoader() {
  const { data, status } = useSanityQuery(siteSettingsQuery, {}, null);

  useEffect(() => {
    if (status !== "ready" || !data) return;

    const { customFontUrl, customFontFileUrl, customFontFamily, showBackgroundGrid } = data;

    // 1. Manage stylesheet link element for customFontUrl
    let linkEl = document.getElementById("sanity-custom-font-link");
    if (customFontUrl) {
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.id = "sanity-custom-font-link";
        linkEl.rel = "stylesheet";
        document.head.appendChild(linkEl);
      }
      if (linkEl.href !== customFontUrl) {
        linkEl.href = customFontUrl;
      }
    } else if (linkEl) {
      linkEl.remove();
    }

    // 2. Manage style tag for customFontFileUrl (@font-face)
    let styleEl = document.getElementById("sanity-custom-font-file-style");
    if (customFontFileUrl) {
      const familyName = customFontFamily || "CustomDynamicFont";
      const rules = `
        @font-face {
          font-family: '${familyName}';
          src: url('${customFontFileUrl}');
          font-display: swap;
        }
      `;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "sanity-custom-font-file-style";
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = rules;
    } else if (styleEl) {
      styleEl.remove();
    }

    // 3. Apply custom font family globally via --font-display property override
    const activeFamily = customFontFamily || (customFontFileUrl ? "CustomDynamicFont" : "");
    if (activeFamily) {
      // Ensure font name is correctly quoted if it has spaces and is not already quoted
      const formattedFamily = activeFamily.includes(" ") && !activeFamily.startsWith("'") && !activeFamily.startsWith('"')
        ? `'${activeFamily}'`
        : activeFamily;
      // "Bricolage Grotesque" (the site's own default) sits ahead of the
      // generic system fonts here — if the CMS-configured font fails to
      // load (e.g. a bad customFontUrl), text falls back to the site's
      // real, weight-matched typeface instead of jumping straight to an
      // unrelated OS default.
      document.documentElement.style.setProperty("--font-display", `${formattedFamily}, "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif`);
    } else {
      document.documentElement.style.removeProperty("--font-display");
    }

    // 4. Sitewide background grid toggle — only `false` hides it, so an
    // unset field (undefined) or an explicit `true` both leave the
    // existing :root/.dark --grid-line-color values (and therefore the
    // grid) untouched. Overriding the custom property itself, the same
    // technique used for --font-display above, means every section's
    // existing `.site-shell ... { background-image: ... var(--grid-line-color) ... }`
    // rule (index.css) needs no changes at all — it just resolves to a
    // transparent line color when hidden.
    if (showBackgroundGrid === false) {
      document.documentElement.style.setProperty("--grid-line-color", "transparent");
    } else {
      document.documentElement.style.removeProperty("--grid-line-color");
    }
  }, [data, status]);

  return null;
}

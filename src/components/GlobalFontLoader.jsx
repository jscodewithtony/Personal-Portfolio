import { useEffect } from "react";
import { useSanityQuery } from "../sanity/useSanityQuery";
import { siteSettingsQuery } from "../sanity/queries";

export function GlobalFontLoader() {
  const { data, status } = useSanityQuery(siteSettingsQuery, {}, null);

  useEffect(() => {
    if (status !== "ready" || !data) return;

    const { customFontUrl, customFontFileUrl, customFontFamily } = data;

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
  }, [data, status]);

  return null;
}

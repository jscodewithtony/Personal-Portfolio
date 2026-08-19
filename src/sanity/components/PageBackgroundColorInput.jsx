import { useCallback, useEffect, useState } from "react";
import { set, unset } from "sanity";
import { Box, Flex, Text, TextInput } from "@sanity/ui";

// Custom input for project.js's `styleSettings.pageBackgroundColor`
// (type: "color", from @sanity/color-input) — renders as a swatch box
// + "or" + a #-prefixed hex text input, side by side, rather than
// @sanity/color-input's own default layout. Still writes the same
// `{ _type: "color", hex }` shape that field type expects, so nothing
// downstream (the GROQ query, the frontend) needs to change.
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function PageBackgroundColorInput(props) {
  const { value, onChange, elementProps } = props;
  const committedHex = HEX_RE.test(value?.hex) ? value.hex : "";

  // Local text buffer for the hex field — lets the editor type a
  // partial/invalid hex without it being reverted mid-keystroke; only
  // commits (or reverts) on blur.
  const [hexText, setHexText] = useState(committedHex);

  useEffect(() => {
    setHexText(committedHex);
  }, [committedHex]);

  const commit = useCallback(
    (hex) => {
      if (!hex) {
        onChange(unset());
        return;
      }
      onChange(set({ _type: "color", hex }));
    },
    [onChange]
  );

  const handleSwatchChange = (event) => {
    const nextHex = event.currentTarget.value;
    setHexText(nextHex);
    commit(nextHex);
  };

  const handleHexTextChange = (event) => {
    setHexText(`#${event.currentTarget.value}`);
  };

  const handleHexBlur = () => {
    const raw = hexText.trim();
    if (raw === "" || raw === "#") {
      commit(null);
      setHexText("");
      return;
    }
    const candidate = raw.startsWith("#") ? raw : `#${raw}`;
    if (HEX_RE.test(candidate)) {
      commit(candidate);
      setHexText(candidate);
    } else {
      // Invalid — revert to the last committed value rather than
      // saving something broken.
      setHexText(committedHex);
    }
  };

  return (
    <Flex align="center" gap={3} {...elementProps}>
      <input
        type="color"
        aria-label="Pick background color"
        value={committedHex || "#ffffff"}
        onChange={handleSwatchChange}
        style={{
          width: 40,
          height: 40,
          padding: 0,
          border: "1px solid var(--card-border-color)",
          borderRadius: 6,
          cursor: "pointer",
          background: "none",
          flexShrink: 0,
        }}
      />
      <Text size={1} muted>
        or
      </Text>
      <Flex align="center" gap={2} style={{ maxWidth: 180 }}>
        <Text size={1} muted>
          #
        </Text>
        <Box flex={1}>
          <TextInput
            value={hexText.startsWith("#") ? hexText.slice(1) : hexText}
            onChange={handleHexTextChange}
            onBlur={handleHexBlur}
            placeholder="114AFC"
          />
        </Box>
      </Flex>
    </Flex>
  );
}

export default PageBackgroundColorInput;

import { useCallback } from "react";
import { set, unset } from "sanity";
import { Box, Card, Grid, Text, TextInput } from "@sanity/ui";

// Custom input for project.js's `styleSettings.pagePadding` — a
// compact 2x2 grid of independent Top/Right/Bottom/Left number inputs,
// replacing the single uniform-padding number field. Each side patches
// only its own sub-field (relative `set`/`unset` paths), so editing one
// side never touches the others.
//
// No link/unlink toggle yet (shipping the four independent inputs
// first, per explicit scope) — that's a natural follow-up: a small
// icon-button that, when active, mirrors one side's value across all
// four on change.
const MIN = 0;
const MAX = 200;

const SIDES = [
  { name: "paddingTop", label: "Top" },
  { name: "paddingRight", label: "Right" },
  { name: "paddingBottom", label: "Bottom" },
  { name: "paddingLeft", label: "Left" },
];

export function PagePaddingBoxInput(props) {
  const { value, onChange, elementProps } = props;

  const handleSideChange = useCallback(
    (sideName, rawText) => {
      if (rawText.trim() === "") {
        onChange(unset([sideName]));
        return;
      }
      const num = Number(rawText);
      if (Number.isNaN(num)) return;
      onChange(set(Math.min(MAX, Math.max(MIN, num)), [sideName]));
    },
    [onChange]
  );

  return (
    <Card padding={3} border radius={2} {...elementProps}>
      <Grid columns={2} gap={3}>
        {SIDES.map((side) => (
          <Box key={side.name}>
            <Text size={1} muted style={{ display: "block", marginBottom: 4 }}>
              {side.label}
            </Text>
            <TextInput
              type="number"
              value={value?.[side.name] ?? ""}
              onChange={(event) => handleSideChange(side.name, event.currentTarget.value)}
              placeholder="0"
            />
          </Box>
        ))}
      </Grid>
    </Card>
  );
}

export default PagePaddingBoxInput;

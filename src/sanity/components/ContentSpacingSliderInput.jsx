import { useCallback, useEffect, useState } from "react";
import { set, unset } from "sanity";
import { Box, Flex, Text, TextInput } from "@sanity/ui";

// Custom input for project.js's `styleSettings.contentSpacing` — a
// horizontal range slider paired with a numeric readout, replacing the
// plain number field. Bounds are kept in sync with the field's own
// Rule.min(0).max(300) validation — this is a display/UX layer only,
// the underlying stored value and validation are unchanged.
const MIN = 0;
const MAX = 300;

export function ContentSpacingSliderInput(props) {
  const { value, onChange, elementProps } = props;
  const committed = typeof value === "number" ? value : null;

  const [text, setText] = useState(committed === null ? "" : String(committed));

  useEffect(() => {
    setText(committed === null ? "" : String(committed));
  }, [committed]);

  const commit = useCallback(
    (num) => {
      if (num === null || Number.isNaN(num)) {
        onChange(unset());
        return;
      }
      onChange(set(Math.min(MAX, Math.max(MIN, num))));
    },
    [onChange]
  );

  const handleSliderChange = (event) => {
    const num = Number(event.currentTarget.value);
    setText(String(num));
    commit(num);
  };

  const handleNumberChange = (event) => {
    setText(event.currentTarget.value);
  };

  const handleNumberBlur = () => {
    if (text.trim() === "") {
      commit(null);
      return;
    }
    const num = Number(text);
    if (Number.isNaN(num)) {
      setText(committed === null ? "" : String(committed));
      return;
    }
    commit(num);
    setText(String(Math.min(MAX, Math.max(MIN, num))));
  };

  return (
    <Flex align="center" gap={3} {...elementProps}>
      <Box flex={1}>
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={committed ?? MIN}
          onChange={handleSliderChange}
          style={{ width: "100%", accentColor: "#114AFC" }}
        />
      </Box>
      <Flex align="center" gap={2} style={{ width: 110, flexShrink: 0 }}>
        <TextInput
          type="number"
          value={text}
          onChange={handleNumberChange}
          onBlur={handleNumberBlur}
          placeholder="Default"
        />
        <Text size={1} muted>
          px
        </Text>
      </Flex>
    </Flex>
  );
}

export default ContentSpacingSliderInput;

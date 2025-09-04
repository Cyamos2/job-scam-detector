// src/components/ScoreBadge.tsx
import * as React from "react";
import { View, Text } from "react-native";
import { bucket } from "../lib/scoring";

export default function ScoreBadge({ score }: { score: number }) {
  const b = bucket(score);
  const palette = {
    low:   { bg: "#E7F8ED", text: "#047857", border: "#C7F0D6" },
    medium:{ bg: "#FFF4E6", text: "#B45309", border: "#FFE6C7" },
    high:  { bg: "#FDE8E8", text: "#B91C1C", border: "#F8C8C8" },
  }[b];

  return (
    <View
      style={{
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 999, backgroundColor: palette.bg,
        borderWidth: 1, borderColor: palette.border,
        minWidth: 42, alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: "700", color: palette.text }}>{score}</Text>
    </View>
  );
}
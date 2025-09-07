// src/components/ScoreBadge.tsx
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { visualBucket } from "../lib/scoring";

export default function ScoreBadge({ score }: { score: number }) {
  const b = visualBucket(score);

  const palette = {
    low:    { bg: "#E7F8ED", text: "#047857", border: "#A7F3D0" },
    medium: { bg: "#FFF4E6", text: "#B45309", border: "#FED7AA" },
    high:   { bg: "#FEE2E2", text: "#B91C1C", border: "#FCA5A5" },
  } as const;

  const p = palette[b];

  return (
    <View style={[styles.badge, { backgroundColor: p.bg, borderColor: p.border }]}>
      <Text style={[styles.text, { color: p.text }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontWeight: "800" },
});
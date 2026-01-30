// src/components/ScoreBadge.tsx
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { visualBucket, scoreJob, type ScoreResult } from "../lib/scoring";

// Accept a numeric score and color by visual bucket inferred from it
export default function ScoreBadge({ score }: { score: number }) {
  // synthesize a minimal ScoreResult for coloring
  const fakeResult: ScoreResult = { score, reasons: [] };
  const b = visualBucket(fakeResult);

  const palette = {
    low:    { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
    medium: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D" },
    high:   { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" },
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
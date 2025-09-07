// src/components/ScoreBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { bucket, type Severity } from "../lib/scoring";

export default function ScoreBadge({ score }: { score: number }) {
  const sev: Severity = bucket(score);

  const ring: Record<Severity, { bg: string; text: string; border: string }> = {
    low:    { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
    medium: { bg: "#FFF7ED", text: "#B45309", border: "#FBD38D" },
    high:   { bg: "#FEF2F2", text: "#B91C1C", border: "#FCA5A5" },
  };

  const c = ring[sev];

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.text, { color: c.text }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
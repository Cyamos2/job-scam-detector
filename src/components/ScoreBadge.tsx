// src/components/ScoreBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { bucket } from "../lib/scoring";

export default function ScoreBadge({ score }: { score: number }) {
  const b = bucket(score);
  const palette = {
    low:    { bg: "#E7F8ED", text: "#047857", border: "#A7F3D0" },
    medium: { bg: "#FFF4E6", text: "#B45309", border: "#FED7AA" },
    high:   { bg: "#FEECEC", text: "#B91C1C", border: "#FCA5A5" },
  }[b];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.text }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "800" },
});
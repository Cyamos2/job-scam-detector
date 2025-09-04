// src/components/ScoreBadge.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colorForScore } from "../lib/scoring";

type Props = {
  score: number;
  onPress?: () => void; // optional: show “why” hits
};

export default function ScoreBadge({ score, onPress }: Props) {
  const bg = colorForScore(score);
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      {...(onPress ? { onPress } : {})}
      style={[styles.wrap, { borderColor: bg }]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`Risk score ${score}`}
    >
      <View style={[styles.dot, { backgroundColor: bg }]} />
      <Text style={styles.text}>{score}</Text>
    </Comp>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  text: { fontWeight: "800", color: "#111" },
});
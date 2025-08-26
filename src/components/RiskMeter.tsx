import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

type Props = {
  score: number;        // 0..100
  level: "Low" | "Medium" | "High";
  baseScore?: number;
  bonusLabel?: string;
};

export default function RiskMeter({ score, level, baseScore, bonusLabel }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Analysis</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, score))}%` }]} />
      </View>
      <Text style={styles.hint}>
        Score: {score.toFixed(0)} {baseScore !== undefined ? ` • Base: ${baseScore.toFixed(0)}` : ""} —{" "}
        <Text style={{ fontWeight: "700" }}>
          {level === "High" ? "High risk" : level === "Medium" ? "Medium risk" : "Low risk"}
        </Text>
      </Text>
      {!!bonusLabel && <Text style={styles.hint}>{bonusLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 10
  },
  title: { color: theme.colors.text, fontWeight: "700", marginBottom: 8 },
  track: {
    height: 10,
    backgroundColor: "#0A1220",
    borderRadius: 6,
    overflow: "hidden"
  },
  fill: {
    height: 10,
    backgroundColor: theme.colors.primary
  },
  hint: { color: theme.colors.hint, marginTop: 8 }
});
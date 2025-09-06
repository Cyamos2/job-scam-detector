// src/components/JobRow.tsx
import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import ScoreBadge from "./ScoreBadge";
import type { Job } from "../hooks/useJobs";

type Props = {
  job: Job;
  score: number;
  onPress?: () => void;
  onLongPress?: () => void;
};

export default function JobRow({ job, score, onPress, onLongPress }: Props) {
  const { colors, dark } = useTheme();

  // Subtle background tint by risk bucket
  const tint =
    job.risk === "high"
      ? dark ? "#3b1f1f" : "#FEF2F2"
      : job.risk === "medium"
      ? dark ? "#3b2a1f" : "#FFF7ED"
      : dark ? "#10291f" : "#F0FDF4";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.row, { backgroundColor: tint, borderColor: colors.border }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          <Text style={{ color: "#6B7280" }}>{job.company}</Text>
          <Text style={{ color: "#9CA3AF" }}>
            {job.url ? ` • ${job.url}` : ""} • {job.risk.toUpperCase()}
          </Text>
        </Text>
      </View>
      <ScoreBadge score={score} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  sub: { fontSize: 13 },
});
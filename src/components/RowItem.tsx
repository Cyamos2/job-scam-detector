// src/components/RowItem.tsx
import * as React from "react";
import { Pressable, Text, View, StyleSheet, Platform } from "react-native";
import ScoreBadge from "./ScoreBadge";
import { scoreJob, bucket } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";

// Derive the Job type from the store — no import from ../store/savedItems
type Job = ReturnType<typeof useJobs>["items"][number];

type Props = {
  job: Job;
  onPress: () => void;
};

export default function RowItem({ job, onPress }: Props) {
  // normalize nullable fields to undefined for scoreJob
  const { score } = scoreJob({
    title: job.title,
    company: job.company,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
    risk: job.risk,
  });

  const b = bucket(score);
  const theme = palette[b];

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.ripple }}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.bgPressed : theme.bg, borderColor: theme.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${job.title} at ${job.company}, ${b} risk`}
    >
      <View style={[styles.accent, { backgroundColor: theme.accent }]} />
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {job.company}{job.risk ? ` • ${job.risk.toUpperCase()}` : ""}
        </Text>
      </View>
      <ScoreBadge score={score} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
  },
  accent: { width: 4, alignSelf: "stretch", borderRadius: 4, marginRight: 10 },
  textWrap: { flex: 1, paddingRight: 10 },
  title: { fontSize: 18, fontWeight: "800" },
  sub: { marginTop: 4, color: "#6B7280" },
});

const palette = {
  low:    { bg: "#ECFDF5", bgPressed: "#E1FAF1", border: "#D1FAE5", accent: "#10B981", ripple: "#00000019" },
  medium: { bg: "#FFF7ED", bgPressed: "#FFF1E6", border: "#FFE4D3", accent: "#F59E0B", ripple: "#00000019" },
  high:   { bg: "#FEF2F2", bgPressed: "#FDEDED", border: "#FECACA", accent: "#EF4444", ripple: "#00000019" },
} as const;
// src/components/JobRow.tsx
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import ScoreBadge from "./ScoreBadge";
import type { Job } from "../hooks/useJobs"; // assuming this exists

type Props = {
  job: Job;
  score: number;
  reasonsPreview?: string[];
  onPress?: () => void;
  onLongPress?: () => void;
};

export default function JobRow({ job, score, reasonsPreview = [], onPress, onLongPress }: Props) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.row, { borderColor: "#E5E7EB" }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {job.company}
          {job.url ? `  ·  ${job.url}` : ""}
          {`  ·  ${job.risk.toUpperCase()}`}
        </Text>
        {!!reasonsPreview.length && (
          <Text style={styles.reasons} numberOfLines={1}>
            {reasonsPreview.join(" · ")}
          </Text>
        )}
      </View>
      <ScoreBadge score={score} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "800" },
  meta: { color: "#6B7280", marginTop: 2 },
  reasons: { color: "#6B7280", marginTop: 2 },
});
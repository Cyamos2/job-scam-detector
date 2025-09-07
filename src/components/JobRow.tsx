// src/components/JobRow.tsx
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import ScoreBadge from "./ScoreBadge";
import type { Job } from "../hooks/useJobs"; // whatever your Job type export is

type Props = {
  job: Job;
  score: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Optional: show 1–2 short reasons under the meta line */
  reasonsPreview?: string[];
};

export default function JobRow({ job, score, reasonsPreview, onPress, onLongPress }: Props) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {job.company} {job.url ? ` • ${job.url}` : ""} • {job.risk.toUpperCase()}
        </Text>
        {reasonsPreview && reasonsPreview.length > 0 ? (
          <Text style={styles.preview} numberOfLines={1}>
            {reasonsPreview.slice(0, 2).join(" • ")}
          </Text>
        ) : null}
      </View>
      <ScoreBadge score={score} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  title: { fontWeight: "800", fontSize: 16, marginBottom: 2, color: "#111827" },
  meta: { color: "#6B7280", fontWeight: "600" },
  preview: { color: "#4B5563", marginTop: 2 },
});
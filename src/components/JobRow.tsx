import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import ScoreBadge from "./ScoreBadge";
import type { Job } from "../hooks/useJobs";
import type { Reason, Severity } from "../lib/scoring";

type Props = {
  job: Job;
  score: number;
  reasons: Reason[];
  bucket: Severity;
  onPress: () => void;
  onLongPress?: () => void;
};

export default function JobRow({
  job,
  score,
  reasons,
  bucket,
  onPress,
  onLongPress,
}: Props) {
  const preview = reasons.slice(0, 2).map((r) => r.label).join(" · ");

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {job.company}
          {job.location ? ` · ${job.location}` : ""}
          {job.url ? `  ·  ${job.url}` : ""}
        </Text>
        {!!preview && (
          <Text style={styles.reasons} numberOfLines={1}>
            {preview}
          </Text>
        )}
      </View>
      <ScoreBadge score={score} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 2, color: "#111" },
  meta: { fontSize: 14, color: "#374151" },
  reasons: { marginTop: 4, color: "#6B7280" },
});
// src/components/JobRow.tsx
import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import type { Job } from "../hooks/useJobs";

type Props = {
  job: Job;
  score?: number; // optional: we’ll recompute if not provided
  onPress?: () => void;
  onLongPress?: () => void;
};

export default function JobRow({ job, score, onPress, onLongPress }: Props) {
  // compute score & reasons (cheap) if caller didn't pass one
  const result = React.useMemo(
    () =>
      score != null
        ? { score, reasons: [] }
        : scoreJob({
            title: job.title,
            company: job.company,
            url: job.url ?? undefined,
            notes: job.notes ?? undefined,
          }),
    [job, score]
  );

  const bucket: Severity = visualBucket(result);

  const palette: Record<Severity, { dot: string; text: string; bg: string; border: string }> = {
    high:   { dot: "#EF4444", text: "#B91C1C", bg: "#FEE2E2", border: "#FCA5A5" },
    medium: { dot: "#F59E0B", text: "#B45309", bg: "#FFF7ED", border: "#FED7AA" },
    low:    { dot: "#10B981", text: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
  };

  // short 1-line reasons preview (uses top 2 labels if we have them)
  const reasonsPreview = React.useMemo(() => {
    // If caller passed just a number, we won't have reasons; recompute safely:
    const full = result.reasons.length
      ? result
      : scoreJob({
          title: job.title,
          company: job.company,
          url: job.url ?? undefined,
          notes: job.notes ?? undefined,
        });
    return full.reasons.slice(0, 2).map((r) => r.label);
  }, [job, result]);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title} numberOfLines={1}>
          {job.title}
        </Text>

        <Text style={styles.meta} numberOfLines={1}>
          {job.company}
          {job.url ? `  ·  ${job.url}` : ""}
        </Text>

        {!!reasonsPreview.length && (
          <Text style={styles.reasons} numberOfLines={1}>
            {reasonsPreview.join(" · ")}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.badge,
          { backgroundColor: palette[bucket].bg, borderColor: palette[bucket].border },
        ]}
      >
        <Text style={[styles.badgeText, { color: palette[bucket].text }]}>{result.score}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 2, color: "#111827" },
  meta: { color: "#4B5563", marginBottom: 2, fontWeight: "600" },
  reasons: { color: "#6B7280" },

  badge: {
    minWidth: 52,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontWeight: "900" },
});
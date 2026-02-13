// src/components/RowItem.tsx
import * as React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import ScoreBadge from "./ScoreBadge";
import { scoreJob, visualBucket } from "../lib/scoring";
import type { Job } from "../hooks/useJobs";

export default function RowItem({
  job,
  onPress,
  onLongPress,
}: {
  job: Job;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const s = scoreJob({
    title: job.title,
    company: job.company,
    location: job.location,
    recruiterEmail: job.recruiterEmail,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
  });

  const b = visualBucket(s);

  const pills = s.reasons.slice(0, 2).map(r => r.label).join(" · ");

  const tint = {
    low:    { bg: "#F0FDF4", border: "#BBF7D0" },
    medium: { bg: "#FFFBEB", border: "#FDE68A" },
    high:   { bg: "#FEF2F2", border: "#FECACA" },
  } as const;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.row, { backgroundColor: tint[b].bg, borderColor: tint[b].border }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {job.company}
          {job.url ? `  ·  ${job.url}` : ""}  ·  {b.toUpperCase()}
        </Text>
        {pills ? <Text style={styles.hint} numberOfLines={1}>{pills}</Text> : null}
      </View>
      <ScoreBadge score={s.score} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "800" },
  sub:   { color: "#6B7280", marginTop: 2 },
  hint:  { color: "#9CA3AF", marginTop: 4, fontSize: 12 },
});
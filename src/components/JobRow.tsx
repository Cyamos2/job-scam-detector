import * as React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import ScoreBadge from "./ScoreBadge";

type Severity = "low" | "medium" | "high";

export type Job = {
  id: string;
  title: string;
  company: string;
  url?: string | null;
  risk: Severity;
};

type Props = {
  job: Job;
  score: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Optional one-line preview (e.g., first 1–3 reason labels) */
  reasonsPreview?: string[];
};

export default function JobRow({
  job,
  score,
  onPress,
  onLongPress,
  reasonsPreview,
}: Props) {
  const { colors } = useTheme();

  const palette: Record<Severity, { bg: string; border: string; title: string }> =
    {
      high: { bg: "#FEF2F2", border: "#FEE2E2", title: "#B91C1C" },
      medium: { bg: "#FFF7ED", border: "#FFEDD5", title: "#B45309" },
      low: { bg: "#ECFDF5", border: "#D1FAE5", title: "#047857" },
    };

  const p = palette[job.risk];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.row,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {job.title}
        </Text>

        <Text style={styles.sub} numberOfLines={1}>
          {job.company}
          {job.url ? ` ・ ${job.url}` : ""} ・ {job.risk.toUpperCase()}
        </Text>

        {!!(reasonsPreview && reasonsPreview.length) && (
          <Text style={styles.preview} numberOfLines={1}>
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
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: { fontWeight: "800", fontSize: 16 },
  sub: { marginTop: 2, color: "#6B7280" },
  preview: { marginTop: 2, color: "#9CA3AF", fontSize: 12 },
});
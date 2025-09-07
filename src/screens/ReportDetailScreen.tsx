// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { useJobs } from "../hooks/useJobs";
import { scoreJob, type ScoreResult } from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";
import ScoreBadge from "../components/ScoreBadge";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors } = useTheme();
  const { items } = useJobs();

  const job = items.find((j) => j.id === route.params.id);
  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Job not found.</Text>
      </View>
    );
  }

  const scored: ScoreResult = scoreJob({
    title: job.title,
    company: job.company,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
    risk: job.risk,
  });

  // Group reasons by severity
  const grouped = React.useMemo(() => {
    const by: Record<"high" | "medium" | "low", string[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const r of scored.reasons) by[r.severity].push(r.label);
    return by;
  }, [scored.reasons]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
          <Text style={[styles.company, { color: colors.text }]}>{job.company}</Text>
          {job.url ? (
            <Text style={styles.url} numberOfLines={1}>
              {job.url}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.badgeLabel}>Scam Likelihood</Text>
          <ScoreBadge score={scored.score} />
          <Pressable
            onPress={() => nav.navigate("AddContent", { editId: job.id })}
            style={styles.editPill}
          >
            <Text style={styles.editPillText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      {/* Why this score */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Why this score</Text>

      {grouped.high.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.sevHeader, { color: "#B91C1C" }]}>High-risk factors detected:</Text>
          {grouped.high.map((label, i) => (
            <Text key={`h-${i}`} style={[styles.bullet, { color: colors.text }]}>
              • {label}
            </Text>
          ))}
        </View>
      )}

      {grouped.medium.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.sevHeader, { color: "#B45309" }]}>Medium-risk factors detected:</Text>
          {grouped.medium.map((label, i) => (
            <Text key={`m-${i}`} style={[styles.bullet, { color: colors.text }]}>
              • {label}
            </Text>
          ))}
        </View>
      )}

      {grouped.low.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.sevHeader, { color: "#047857" }]}>Low-risk factors detected:</Text>
          {grouped.low.map((label, i) => (
            <Text key={`l-${i}`} style={[styles.bullet, { color: colors.text }]}>
              • {label}
            </Text>
          ))}
        </View>
      )}

      {/* Notes */}
      {job.notes ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
          <Text style={{ color: colors.text, marginBottom: 16 }}>{job.notes}</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800" },
  company: { fontSize: 14, marginTop: 2 },
  url: { fontSize: 13, color: "#2563EB", marginTop: 2 },

  badgeLabel: { fontSize: 10, fontWeight: "700", color: "#6B7280", marginBottom: 4, textAlign: "right" },
  editPill: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  editPillText: { fontWeight: "700", color: "#1D4ED8" },

  sectionTitle: { fontSize: 16, fontWeight: "900", marginTop: 12, marginBottom: 6 },
  sevHeader: { fontWeight: "900", marginBottom: 4 },
  bullet: { marginLeft: 12, marginBottom: 2 },
});
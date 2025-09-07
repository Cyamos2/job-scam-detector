import * as React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";

import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";
import ScoreBadge from "../components/ScoreBadge";
import { scoreJob } from "../lib/scoring";

type Rt = RouteProp<RootStackParamList, "ReportDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ReportDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { id } = route.params;
  const { items } = useJobs();

  const job = items.find((j) => j.id === id);
  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Job not found</Text>
      </View>
    );
  }

  const scored = scoreJob({
    title: job.title,
    company: job.company,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
    risk: job.risk,
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
        <ScoreBadge score={scored.score} />
      </View>

      <Text style={[styles.company, { color: colors.text }]}>{job.company}</Text>
      {job.url ? <Text style={styles.url}>{job.url}</Text> : null}

      <Text style={styles.sectionTitle}>Why this score</Text>
      {scored.reasons.map((r, i) => (
        <View key={i} style={styles.reason}>
          <Text style={{ color: colors.text }}>
            {r.severity.toUpperCase()}: {r.label}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Notes</Text>
      <Text style={{ color: colors.text }}>{job.notes || "No notes"}</Text>

      <View style={styles.actions}>
        <Pressable onPress={() => navigation.navigate("AddContent")}>
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  company: { fontSize: 14, marginBottom: 4 },
  url: { fontSize: 13, color: "#2563EB", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  reason: { marginBottom: 4 },
  actions: { marginTop: 24, flexDirection: "row", gap: 12 },
  actionText: { color: "#1f6cff", fontWeight: "600" },
});
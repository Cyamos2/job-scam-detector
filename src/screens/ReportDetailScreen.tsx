import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useJobs } from "../hooks/useJobs";
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import ScoreBadge from "../components/ScoreBadge";
import UndoBar from "../components/UndoBar";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors } = useTheme();
  const { items, deleteJob } = useJobs();

  const job = items.find((j) => j.id === route.params.id);
  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Job not found.</Text>
        <UndoBar />
      </View>
    );
  }

  const scored = scoreJob({
    title: job.title,
    company: job.company,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
  });
  const bucket: Severity = visualBucket(scored);

  const grouped = React.useMemo(() => {
    const by: Record<Severity, string[]> = { high: [], medium: [], low: [] };
    for (const r of scored.reasons) by[r.severity].push(r.label);
    return by;
  }, [scored.reasons]);

  const palette: Record<Severity, { color: string; label: string }> = {
    high: { color: "#B91C1C", label: "High Risk" },
    medium: { color: "#B45309", label: "Medium Risk" },
    low: { color: "#047857", label: "Low Risk" },
  };

  const onDelete = () => {
    Alert.alert("Delete this item?", "You can Undo for a few seconds.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteJob(job.id);
          navigation.goBack(); // banner persists globally; user can still Undo
        },
      },
    ]);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Title, company, url */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
            <Text style={[styles.company, { color: colors.text }]}>{job.company}</Text>
            {!!job.url && <Text style={styles.url} numberOfLines={1}>{job.url}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.badgeLabel}>Scam Likelihood</Text>
            <ScoreBadge score={scored.score} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Why this score</Text>

        {(["high", "medium", "low"] as const).map((sev) =>
          grouped[sev].length ? (
            <View key={sev} style={{ marginBottom: 12 }}>
              <Text style={[styles.sevHeader, { color: palette[sev].color }]}>
                {palette[sev].label}
              </Text>
              {grouped[sev].map((label, i) => (
                <Text key={i} style={{ marginLeft: 12, marginBottom: 2, color: colors.text }}>
                  • {label}
                </Text>
              ))}
            </View>
          ) : null
        )}

        {!!job.notes && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={{ color: colors.text, marginBottom: 16 }}>{job.notes}</Text>
          </>
        )}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => navigation.navigate("AddContent", { editId: job.id })}
            style={styles.editBtn}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>

          <Pressable onPress={onDelete} style={styles.delBtn}>
            <Text style={styles.delText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Global Undo */}
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  company: { fontSize: 14, marginBottom: 2 },
  url: { fontSize: 13, color: "#2563EB" },

  badgeLabel: { color: "#6B7280", fontWeight: "600", marginBottom: 4, fontSize: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  sevHeader: { fontWeight: "700", marginBottom: 4 },

  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  editText: { fontWeight: "600", color: "#1D4ED8" },

  delBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  delText: { fontWeight: "700", color: "#B91C1C" },
});
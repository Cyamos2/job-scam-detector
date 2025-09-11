// src/screens/ReportDetailScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { useJobs } from "../hooks/useJobs";
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";
import ScoreBadge from "../components/ScoreBadge";

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

  // group reasons for display
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

  const handleDelete = () => {
    Alert.alert("Delete Report", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteJob(job.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Title + Company + URL */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
          <Text style={[styles.company, { color: colors.text }]}>
            {job.company}
          </Text>
          {job.url ? (
            <Text style={styles.url} numberOfLines={1}>
              {job.url}
            </Text>
          ) : null}
        </View>

        {/* Score + computed bucket color */}
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.badgeLabel}>Scam Likelihood</Text>
          <ScoreBadge score={scored.score} />
        </View>
      </View>

      {/* Why this score */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Why this score
      </Text>

      {(["high", "medium", "low"] as const).map((sev) => {
        if (grouped[sev].length === 0) return null;
        return (
          <View key={sev} style={{ marginBottom: 12 }}>
            <Text style={[styles.sevHeader, { color: palette[sev].color }]}>
              {palette[sev].label}
            </Text>
            {grouped[sev].map((label, i) => (
              <Text
                key={i}
                style={{ marginLeft: 12, marginBottom: 2, color: colors.text }}
              >
                • {label}
              </Text>
            ))}
          </View>
        );
      })}

      {/* Notes */}
      {job.notes ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Notes
          </Text>
          <Text style={{ color: colors.text, marginBottom: 16 }}>
            {job.notes}
          </Text>
        </>
      ) : null}

      {/* Edit + Delete buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => navigation.navigate("AddContent", { editId: job.id })}
          style={styles.editBtn}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  company: { fontSize: 14, marginBottom: 2 },
  url: { fontSize: 13, color: "#2563EB" },

  badgeLabel: {
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  sevHeader: {
    fontWeight: "700",
    marginBottom: 4,
  },

  actionsRow: { flexDirection: "row", gap: 12 },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  editText: { fontWeight: "600", color: "#1D4ED8" },

  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEE2E2",
  },
  deleteText: { fontWeight: "600", color: "#B91C1C" },
});
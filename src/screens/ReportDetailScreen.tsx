// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useTheme,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { useJobs } from "../hooks/useJobs";
import { scoreJob, type ScoreResult } from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";
import ScoreBadge from "../components/ScoreBadge";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors } = useTheme();
  const { items } = useJobs();

  // ----- find job -----
  const job = items.find((j) => j.id === route.params.id);
  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Job not found.</Text>
      </View>
    );
  }

  // ----- score -----
  const scored: ScoreResult = scoreJob({
    title: job.title,
    company: job.company,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
    risk: job.risk,
  });

  // ----- group reasons by severity for display -----
  const grouped = React.useMemo(() => {
    const by: Record<"high" | "medium" | "low", string[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const r of scored.reasons) {
      by[r.severity].push(r.label);
    }
    return by;
  }, [scored.reasons]);

  // palette for headings
  const palette: Record<"high" | "medium" | "low", { label: string; color: string }> = {
    high: { label: "High Risk", color: "#B91C1C" },
    medium: { label: "Medium Risk", color: "#B45309" },
    low: { label: "Low Risk", color: "#047857" },
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
          <Text style={[styles.company, { color: colors.text }]}>{job.company}</Text>
          {job.url ? (
            <Pressable onPress={() => Linking.openURL(job.url!)}>
              <Text style={styles.url} numberOfLines={1}>{job.url}</Text>
            </Pressable>
          ) : null}
        </View>
        <ScoreBadge score={scored.score} />
      </View>

      {/* reasons */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Why this score</Text>
      {(["high", "medium", "low"] as const).map((sev) =>
        grouped[sev].length ? (
          <View key={sev} style={styles.reasonBlock}>
            <Text style={[styles.severity, { color: palette[sev].color }]}>
              {palette[sev].label}
            </Text>
            {grouped[sev].map((label, idx) => (
              <Text key={idx} style={[styles.reason, { color: colors.text }]}>
                • {label}
              </Text>
            ))}
          </View>
        ) : null
      )}

      {/* notes */}
      {job.notes ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
          <Text style={[styles.notes, { color: colors.text }]}>{job.notes}</Text>
        </>
      ) : null}

      {/* actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate("AddContent", { editId: job.id })}
          style={[styles.actionBtn, styles.primary]}
        >
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "800" },
  company: { fontSize: 14, marginTop: 2 },
  url: { fontSize: 13, color: "#2563EB", marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 6 },

  reasonBlock: { marginBottom: 10 },
  severity: { fontWeight: "800", marginBottom: 4 },
  reason: { marginLeft: 12, marginBottom: 2 },

  notes: { lineHeight: 20, marginBottom: 12 },

  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  primary: { backgroundColor: "#EBF2FF", borderColor: "#C7DAFF" },
  actionText: { fontWeight: "700", color: "#1D4ED8" },
});
// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Screen from "../components/Screen";
import ScoreBadge from "../components/ScoreBadge";
import { useJobs } from "../hooks/useJobs";
import { scoreJob, type ScoreResult } from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";

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
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Job not found.</Text>
        </View>
      </Screen>
    );
  }

  const result: ScoreResult = scoreJob({
    title: job.title,
    company: job.company,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
    risk: job.risk,
  });

  const grouped = React.useMemo(() => {
    const by: Record<"high" | "medium" | "low", string[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const r of result.reasons) by[r.severity].push(r.label);
    return by;
  }, [result.reasons]);

  return (
    <Screen>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {job.title}
            </Text>
            <Text style={[styles.company, { color: colors.text }]}>{job.company}</Text>
            {job.url ? (
              <Text style={styles.url} numberOfLines={1}>
                {job.url}
              </Text>
            ) : null}
          </View>

          {/* Score pill */}
          <ScoreBadge score={result.score} />
        </View>

        {/* Why this score */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Why this score</Text>

        {(["high", "medium", "low"] as const).map((sev) => {
          if (!grouped[sev].length) return null;

          const palette = {
            high: { color: "#B91C1C", label: "High-risk factors detected:" },
            medium: { color: "#B45309", label: "Medium-risk factors detected:" },
            low: { color: "#047857", label: "Low-risk factors detected:" },
          } as const;

          return (
            <View key={sev} style={{ marginBottom: 12 }}>
              <Text style={[styles.sevHeader, { color: palette[sev].color }]}>
                {palette[sev].label}
              </Text>
              {grouped[sev].map((label, i) => (
                <Text
                  key={`${sev}-${i}`}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={{ color: colors.text, marginBottom: 16 }}>{job.notes}</Text>
          </>
        ) : null}

        {/* Edit button */}
        <Pressable
          onPress={() =>
            nav.navigate({
              name: "AddContent",
              params: { editId: job.id }, // edit mode
            })
          }
          style={styles.editBtn}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  company: { fontSize: 14, opacity: 0.9, marginBottom: 2 },
  url: { fontSize: 13, color: "#2563EB" },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 14, marginBottom: 6 },
  sevHeader: { fontWeight: "800", marginBottom: 4 },

  editBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    marginTop: 8,
  },
  editText: { fontWeight: "600", color: "#1D4ED8" },
});
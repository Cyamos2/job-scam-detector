// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useTheme,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Screen from "../components/Screen";
import ScoreBadge from "../components/ScoreBadge";
import { scoreJob, type Reason } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";
import EditJobModal from "../components/EditJobModal";

type Nav = NativeStackNavigationProp<RootStackParamList, "ReportDetail">;
type Rt = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors } = useTheme();
  const { id } = route.params;

  const { items, update, remove } = useJobs();
  const job = items.find((j) => j.id === id);

  const [editing, setEditing] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(true);

  if (!job) {
    return (
      <Screen>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>This report no longer exists.</Text>
        </View>
      </Screen>
    );
  }

  const { score, reasons } = scoreJob(job);

  const onShare = async () => {
    const body =
      `${job.title} — ${job.company}\n` +
      (job.url ? `${job.url}\n` : "") +
      `Risk score: ${score}/100\n` +
      (reasons.length ? `Reasons: ${reasons.map(r => r.label).join(", ")}\n\n` : "\n") +
      (job.notes ?? "");
    try { await Share.share({ message: body }); } catch {}
  };

  const onDelete = () => {
    Alert.alert("Delete report", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try { await remove(job.id); navigation.goBack(); }
          catch (e) { Alert.alert("Delete failed", String(e ?? "Unknown error")); }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {job.title}
              </Text>
              <Text style={[styles.sub, { color: "#6B7280" }]} numberOfLines={2}>
                {job.company}{job.url ? ` • ${job.url}` : ""}
              </Text>
            </View>
            <ScoreBadge score={score} />
          </View>

          {/* Why this score */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.whyRow}>
              <Text style={[styles.h2, { color: colors.text }]}>Why this score</Text>
              <Pressable onPress={() => setShowWhy(v => !v)}>
                <Text style={{ color: "#6B7280", fontWeight: "700" }}>
                  {showWhy ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {showWhy && (
              <>
                <View style={styles.reasonsWrap}>
                  {reasons.length === 0 ? (
                    <Text style={{ color: "#6B7280" }}>No specific red flags detected.</Text>
                  ) : (
                    reasons.map((r) => (
                      <View key={r.key} style={styles.chip}>
                        <Text style={styles.chipText}>{r.label}</Text>
                      </View>
                    ))
                  )}
                </View>

                {reasons.some(r => r.tip) && (
                  <View style={{ marginTop: 8 }}>
                    {reasons.filter(r => r.tip).map((r) => (
                      <View key={`${r.key}-tip`} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={[styles.tip, { color: colors.text }]}>{r.tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {!!job.notes && (
            <>
              <Text style={[styles.h2, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notes, { color: colors.text }]}>{job.notes}</Text>
            </>
          )}

          <View style={styles.actionsRow}>
            <Pressable onPress={() => setEditing(true)} style={[styles.btn, styles.btnNeutral]}>
              <Text style={[styles.btnText, { color: colors.text }]}>Edit</Text>
            </Pressable>

            <Pressable onPress={onShare} style={[styles.btn, styles.btnNeutral]}>
              <Text style={[styles.btnText, { color: colors.text }]}>Share</Text>
            </Pressable>

            <Pressable onPress={onDelete} style={[styles.btn, styles.btnDanger]}>
              <Text style={[styles.btnText, { color: "#fff" }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Edit modal */}
      <EditJobModal
        visible={editing}
        job={job}
        onClose={() => setEditing(false)}
        onSaved={async (patch) => {
          try {
            // map to Partial<JobInput> (null -> undefined)
            await update(job.id, {
              title: patch.title,
              company: patch.company,
              url: patch.url ?? undefined,
              risk: patch.risk,
              notes: patch.notes ?? undefined,
            });
          } catch (e) {
            Alert.alert("Save failed", String(e ?? "Unknown error"));
          } finally {
            setEditing(false);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center" },

  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  sub: { fontSize: 14 },

  h2: { fontSize: 16, fontWeight: "700" },
  reasonsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },

  chip: {
    backgroundColor: "#FFF4E6",
    borderColor: "#FFE6C7",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: "#B45309", fontWeight: "700" },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: "#B45309", marginTop: 7 },
  tip: { fontSize: 15, lineHeight: 22 },

  notes: { fontSize: 15, lineHeight: 22, marginTop: 6 },

  whyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 18, justifyContent: "flex-end" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnNeutral: { backgroundColor: "#F3F4F6" },
  btnDanger: { backgroundColor: "#EF4444" },
  btnText: { fontWeight: "700" },
});
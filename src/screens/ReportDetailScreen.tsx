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
import { scoreJob, reasonLabel, reasonHelp } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";
import EditJobModal from "../components/EditJobModal";
import type { JobInput } from "../lib/api";

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

  const onShare = async () => {
    if (!job) return;
    const { score } = scoreJob(job);
    const body =
      `${job.title} — ${job.company}\n` +
      (job.url ? `${job.url}\n` : "") +
      `Risk score: ${score}/100\n\n` +
      (job.notes ?? "");
    try {
      await Share.share({ message: body });
    } catch {
      /* no-op */
    }
  };

  const onDelete = () => {
    if (!job) return;
    Alert.alert("Delete report", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(job.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert("Delete failed", String(e ?? "Unknown error"));
          }
        },
      },
    ]);
  };

  if (!job) {
    return (
      <Screen>
        <View
          style={[
            styles.card,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            This report no longer exists.
          </Text>
        </View>
      </Screen>
    );
  }

  const { score, reasons } = scoreJob(job);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {job.title}
              </Text>
              <Text style={[styles.sub, { color: "#6B7280" }]} numberOfLines={2}>
                {job.company}
                {job.url ? ` • ${job.url}` : ""}
              </Text>
            </View>

            <Pressable onPress={() => setShowWhy((s) => !s)} hitSlop={10}>
              <ScoreBadge score={score} />
            </Pressable>
          </View>

          {/* Why this score */}
          <View style={styles.whyHeaderRow}>
            <Pressable onPress={() => setShowWhy((s) => !s)} style={{ paddingVertical: 6 }}>
              <Text style={[styles.h2, { color: colors.text }]}>Why this score</Text>
            </Pressable>
            <Pressable onPress={() => setShowWhy((s) => !s)}>
              <Text style={{ color: "#6B7280", fontWeight: "700" }}>
                {showWhy ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {showWhy && (
            <>
              <View style={styles.reasonChips}>
                {reasons.length === 0 ? (
                  <Text style={{ color: "#6B7280" }}>
                    No specific red flags detected.
                  </Text>
                ) : (
                  reasons.map((r) => (
                    <View key={r} style={styles.reasonChip}>
                      <Text style={styles.reasonChipText}>{reasonLabel(r)}</Text>
                    </View>
                  ))
                )}
              </View>

              {reasons.length > 0 && (
                <View style={{ marginTop: 8, gap: 6 }}>
                  {reasons.map((r) => (
                    <View key={`${r}-help`} style={{ flexDirection: "row", gap: 8 }}>
                      <View style={styles.bullet} />
                      <Text style={{ color: colors.text, flex: 1 }}>
                        {reasonHelp(r)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {!!job.notes && (
            <>
              <Text style={[styles.h2, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notes, { color: colors.text }]}>{job.notes}</Text>
            </>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setEditing(true)}
              style={[styles.btn, styles.btnNeutral]}
            >
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
            // Map Partial<Job> -> Partial<JobInput> (strip nulls to undefined)
            const toPatch: Partial<JobInput> = {
              title: patch.title,
              company: patch.company,
              url: patch.url ?? undefined,
              risk: patch.risk,
              notes: patch.notes ?? undefined,
            };
            await update(job.id, toPatch);
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
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  sub: { fontSize: 14 },

  whyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  reasonChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFE6C7",
    backgroundColor: "#FFF4E6",
  },
  reasonChipText: { fontWeight: "700", color: "#B45309" },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 8,
    backgroundColor: "#B45309",
  },

  h2: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  notes: { fontSize: 15, lineHeight: 22 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    justifyContent: "flex-end",
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnNeutral: { backgroundColor: "#F3F4F6" },
  btnDanger: { backgroundColor: "#EF4444" },
  btnText: { fontWeight: "700" },
});
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
import { scoreJob } from "../lib/scoring";
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
      // no-op
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

  const { score } = scoreJob(job);

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
            <ScoreBadge score={score} />
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

      {/* inline edit modal */}
      <EditJobModal
        visible={editing}
        job={job}
        onClose={() => setEditing(false)}
        onSaved={async (patch) => {
          try {
            // Map Partial<Job> -> Partial<JobInput> (coerce nulls)
            const toPatch: Partial<import("../lib/api").JobInput> = {
              title: patch.title,
              company: patch.company,
              url: patch.url ?? undefined,    // null -> undefined
              risk: patch.risk,
              notes: patch.notes ?? undefined // null -> undefined (fix)
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
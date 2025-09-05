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
import type { Reason } from "../lib/scoring"; // <-- ensure scoring exports this
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";
import EditJobModal from "../components/EditJobModal";

type Nav = NativeStackNavigationProp<RootStackParamList, "ReportDetail">;
type Rt = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  // ---------- Hooks (unconditional!) ----------
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors } = useTheme();
  const { id } = route.params;

  const { items, update, remove } = useJobs();
  const job = items.find((j) => j.id === id) ?? null;

  const [editing, setEditing] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(true);

  // Derive score & reasons every render (cheap), even when job is null
  const { score, reasons } = React.useMemo<{
    score: number;
    reasons: Reason[];
  }>(() => (job ? scoreJob(job) : { score: 0, reasons: [] }), [job]);

  // Group reasons by severity (still unconditional)
  const grouped = React.useMemo(() => {
    const by: Record<"high" | "medium" | "low", Reason[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const r of reasons) by[r.severity].push(r);
    return by;
  }, [reasons]);

  // ---------- Actions ----------
  const onShare = async () => {
    if (!job) return;
    const body =
      `${job.title} — ${job.company}\n` +
      (job.url ? `${job.url}\n` : "") +
      `Risk score: ${score}/100\n\n` +
      (job.notes ?? "");
    try {
      await Share.share({ message: body });
    } catch {
      // ignore
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

  // ---------- Empty / missing ----------
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

  // ---------- UI ----------
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

          {/* Why this score */}
          <View style={styles.whyRow}>
            <Text style={[styles.h2, { color: colors.text }]}>Why this score</Text>
            <Pressable onPress={() => setShowWhy((v) => !v)}>
              <Text style={[styles.link, { color: "#6B7280" }]}>
                {showWhy ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {showWhy && reasons.length > 0 && (
            <>
              {/* Chips in grouped order */}
              <View style={styles.chipsWrap}>
                {(["high", "medium", "low"] as const).map((sev) =>
                  grouped[sev].map((r) => (
                    <View key={r.id} style={[styles.chip, chipStyle(sev)]}>
                      <Text style={[styles.chipText, chipTextStyle(sev)]}>
                        {r.label}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* Bulleted explanations */}
              <View style={{ marginTop: 8 }}>
                {(["high", "medium", "low"] as const).map((sev) =>
                  grouped[sev].map((r) => (
                    <View key={`ex-${r.id}`} style={styles.bulletRow}>
                      <View style={[styles.dot, dotStyle(sev)]} />
                      <Text style={[styles.bulletText, { color: colors.text }]}>
                        {r.explain}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {!!job.notes && (
            <>
              <Text style={[styles.h2, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notes, { color: colors.text }]}>{job.notes}</Text>
            </>
          )}

          {/* Actions */}
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

      {/* Inline edit modal */}
      <EditJobModal
        visible={editing}
        job={job}
        onClose={() => setEditing(false)}
        onSaved={async (patch) => {
          try {
            // Map Partial<Job> -> Partial<JobInput> (coerce nulls to undefined)
            const toPatch = {
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

/* ---------------- styles & helpers ---------------- */

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  sub: { fontSize: 14 },

  whyRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h2: { fontSize: 16, fontWeight: "700" },
  link: { fontWeight: "600" },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontWeight: "700" },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 999, marginTop: 7, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22 },

  notes: { fontSize: 15, lineHeight: 22, marginTop: 2 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    justifyContent: "flex-end",
  },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnNeutral: { backgroundColor: "#F3F4F6" },
  btnDanger: { backgroundColor: "#EF4444" },
  btnText: { fontWeight: "700" },
});

// visual severity helpers
function chipStyle(sev: "high" | "medium" | "low") {
  if (sev === "high") return { backgroundColor: "#FDE8E8", borderColor: "#F8C8C8" };
  if (sev === "medium") return { backgroundColor: "#FFF4E6", borderColor: "#FFE6C7" };
  return { backgroundColor: "#E7F8ED", borderColor: "#C7F0D6" };
}
function chipTextStyle(sev: "high" | "medium" | "low") {
  if (sev === "high") return { color: "#B91C1C" };
  if (sev === "medium") return { color: "#B45309" };
  return { color: "#047857" };
}
function dotStyle(sev: "high" | "medium" | "low") {
  if (sev === "high") return { backgroundColor: "#DC2626" };
  if (sev === "medium") return { backgroundColor: "#F59E0B" };
  return { backgroundColor: "#10B981" };
}
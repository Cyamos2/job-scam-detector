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
import { scoreJob, toScoreInput, type Reason } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";
import EditJobModal from "../components/EditJobModal";

type Nav = NativeStackNavigationProp<RootStackParamList, "ReportDetail">;
type Rt = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  // ---- stable hooks (order never changes) ----
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors } = useTheme();
  const { id } = route.params;

  const { items, update, remove } = useJobs();
  const [editing, setEditing] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(true);

  // find job (pure read, memoized)
  const job = React.useMemo(() => items.find((j) => j.id === id), [items, id]);

  // early return is fine (no hooks after this are skipped conditionally)
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

  // compute score & reasons (normalize nulls -> undefined)
  const scored = React.useMemo(() => {
    return scoreJob(toScoreInput(job));
  }, [job]);

  // group reasons for display (not conditional)
  const grouped = React.useMemo(() => {
    const by: Record<"high" | "medium" | "low", Reason[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const r of scored.reasons) by[r.severity].push(r);
    return by;
  }, [scored.reasons]);

  // ----- actions -----
  const onShare = React.useCallback(async () => {
    const body =
      `${job.title} — ${job.company}\n` +
      (job.url ? `${job.url}\n` : "") +
      `Risk score: ${scored.score}/100\n\n` +
      (job.notes ?? "");
    try {
      await Share.share({ message: body });
    } catch {
      /* no-op */
    }
  }, [job, scored.score]);

  const onDelete = React.useCallback(() => {
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
  }, [job.id, navigation, remove]);

  // ----- render -----
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={2}
              >
                {job.title}
              </Text>
              <Text
                style={[styles.sub, { color: "#6B7280" }]}
                numberOfLines={2}
              >
                {job.company}
                {job.url ? ` • ${job.url}` : ""}
              </Text>
            </View>
            <ScoreBadge score={scored.score} />
          </View>

          {/* why this score */}
          <View style={styles.whyHeaderRow}>
            <Text style={[styles.h2, { color: colors.text }]}>
              Why this score
            </Text>
            <Pressable onPress={() => setShowWhy((v) => !v)}>
              <Text style={[styles.toggle, { color: "#6B7280" }]}>
                {showWhy ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {showWhy && (
            <>
              {/* reason chips */}
              <View style={styles.chipsWrap}>
                {scored.reasons.map((r, i) => (
                  <View key={`${r.key}-${i}`} style={styles.chip}>
                    <Text style={styles.chipText}>{r.label}</Text>
                  </View>
                ))}
              </View>

              {/* grouped bullets */}
              {(["high", "medium", "low"] as const).map((sev) =>
                grouped[sev].length ? (
                  <View key={sev} style={styles.bucketWrap}>
                    <Text
                      style={[
                        styles.bucketTitle,
                        sev === "high"
                          ? styles.bucketHigh
                          : sev === "medium"
                          ? styles.bucketMedium
                          : styles.bucketLow,
                      ]}
                    >
                      {sev.toUpperCase()}
                    </Text>
                    {grouped[sev].map((r, i) => (
                      <View key={`${r.key}-b-${i}`} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={[styles.bulletText, { color: colors.text }]}>
                          {r.explain}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null
              )}
            </>
          )}

          {!!job.notes && (
            <>
              <Text style={[styles.h2, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notes, { color: colors.text }]}>
                {job.notes}
              </Text>
            </>
          )}

          {/* actions */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setEditing(true)}
              style={[styles.btn, styles.btnNeutral]}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={onShare}
              style={[styles.btn, styles.btnNeutral]}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>Share</Text>
            </Pressable>

            <Pressable
              onPress={onDelete}
              style={[styles.btn, styles.btnDanger]}
            >
              <Text style={[styles.btnText, { color: "#fff" }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* edit modal */}
      <EditJobModal
        visible={editing}
        job={job}
        onClose={() => setEditing(false)}
        onSaved={async (patch) => {
          try {
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

  whyHeaderRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  h2: { fontSize: 16, fontWeight: "700", flex: 1 },
  toggle: { fontWeight: "700" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
  },
  chipText: { color: "#B45309", fontWeight: "700" },

  bucketWrap: { marginTop: 12 },
  bucketTitle: { fontSize: 12, fontWeight: "900", marginBottom: 6 },
  bucketHigh: { color: "#B91C1C" },
  bucketMedium: { color: "#B45309" },
  bucketLow: { color: "#047857" },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A3A3A3",
    marginTop: 7,
  },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22 },

  notes: { fontSize: 15, lineHeight: 22 },

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
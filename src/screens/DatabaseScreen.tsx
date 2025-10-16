import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SectionList,
  Pressable,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../components/Screen";
import JobRow from "../components/JobRow";
import UndoBar from "../components/UndoBar";
import { useJobs } from "../hooks/useJobs";
import type { Job } from "../hooks/useJobs";
import {
  scoreJob,
  visualBucket,
  type Severity,
  type ScoreResult,
  type Reason,
} from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortKey = "score" | "date" | "title";
type SortDir = "asc" | "desc";
type RiskFilter = "all" | "high" | "medium" | "low";

type Row = { job: Job; result: ScoreResult; bucket: Severity };

export default function DatabaseScreen() {
  const { colors, dark } = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const { items, deleteJob, undoDelete } = useJobs();

  // UI state
  const [query, setQuery] = React.useState("");
  const [risk, setRisk] = React.useState<RiskFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("score");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  // Undo (visible for 60s)
  const [showUndo, setShowUndo] = React.useState(false);
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const UNDO_DURATION_MS = 60_000;

  React.useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Remove header "+ Add" (we use empty-state CTA + conditional FAB)
  React.useLayoutEffect(() => {
    nav.setOptions({ headerRight: undefined });
  }, [nav]);

  // Build rows → filter → sort
  const rows = React.useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();

    const scored: Row[] = items.map((job) => {
      const result = scoreJob({
        title: job.title,
        company: job.company,
        url: job.url,
        notes: job.notes,
      });
      const bucket = visualBucket(result);
      return { job, result, bucket };
    });

    const byQuery = !q
      ? scored
      : scored.filter(({ job }) =>
          `${job.title} ${job.company} ${job.url ?? ""}`.toLowerCase().includes(q)
        );

    const byRisk = risk === "all" ? byQuery : byQuery.filter((r) => r.bucket === risk);

    byRisk.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = a.result.score - b.result.score;
      else if (sortKey === "date") cmp = (a.job.updatedAt ?? 0) - (b.job.updatedAt ?? 0);
      else if (sortKey === "title") cmp = a.job.title.localeCompare(b.job.title);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return byRisk;
  }, [items, query, risk, sortKey, sortDir]);

  // Group by bucket
  const sections = React.useMemo(
    () =>
      (["high", "medium", "low"] as Severity[])
        .map((sev) => ({
          title: sev === "high" ? "High Risk" : sev === "medium" ? "Medium Risk" : "Low Risk",
          key: sev,
          data: rows.filter((r) => r.bucket === sev),
        }))
        .filter((s) => s.data.length > 0),
    [rows]
  );

  const empty = sections.length === 0;
  const showFab = !empty; // only show FAB when there are items

  // Delete + Undo
  const onDelete = async (id: string) => {
    await deleteJob(id);
    setShowUndo(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setShowUndo(false), UNDO_DURATION_MS);
  };

  const onUndo = async () => {
    await undoDelete();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setShowUndo(false);
  };

  const confirmDelete = (id: string) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: "Delete this job?",
          message: "You can Undo for up to 1 minute after deleting.",
        },
        (idx) => {
          if (idx === 1) onDelete(id);
        }
      );
    } else {
      Alert.alert(
        "Delete this job?",
        "You can Undo for up to 1 minute after deleting.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(id) },
        ],
        { cancelable: true }
      );
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <Screen>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by company or role"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.search,
            { color: colors.text, backgroundColor: colors.card, borderColor: "#E5E7EB" },
          ]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {/* Filters + Sort */}
      <View style={styles.toolbar}>
        <View style={styles.chipsRow}>
          {(["all", "low", "medium", "high"] as const).map((r) => {
            const active = risk === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRisk(r)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityLabel={`Filter ${r.toUpperCase()}`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.chipsRow, { marginTop: 10 }]}>
          {(["score", "date", "title"] as const).map((key) => {
            const active = sortKey === key;
            const arrow = active ? (sortDir === "asc" ? "↑" : "↓") : "";
            return (
              <Pressable
                key={key}
                onPress={() => toggleSort(key)}
                style={styles.sortChip}
                accessibilityLabel={`Sort by ${key}`}
              >
                <Text style={styles.sortLabel}>
                  {key[0].toUpperCase() + key.slice(1)} {arrow}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* List / Empty */}
      {empty ? (
        <View style={styles.empty}>
          <Text style={{ color: "#6B7280", marginBottom: 12 }}>No saved jobs yet.</Text>
          <Pressable onPress={() => nav.navigate("AddContent")} style={styles.addBtn}>
            <Text style={styles.addBtnText}>＋ Add a job</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(row) => row.job.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                section.key === "high"
                  ? { backgroundColor: "#FEE2E2" }
                  : section.key === "medium"
                  ? { backgroundColor: "#FEF3C7" }
                  : { backgroundColor: "#DCFCE7" },
              ]}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <JobRow
              job={item.job}
              score={item.result.score}
              reasons={item.result.reasons as Reason[]}
              bucket={item.bucket}
              onPress={() => nav.navigate("ReportDetail", { id: item.job.id })}
              onLongPress={() => confirmDelete(item.job.id)}
            />
          )}
          contentContainerStyle={{ paddingBottom: showFab ? 120 : 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* FAB — only when list has items */}
      {showFab && (
        <View pointerEvents="box-none" style={styles.fabWrap}>
          <Pressable
            onPress={() => nav.navigate("AddContent")}
            style={styles.fab}
            accessibilityRole="button"
            accessibilityLabel="Add Job"
          >
            <Text style={styles.fabPlus}>＋</Text>
          </Pressable>
        </View>
      )}

      {/* Undo Snackbar (safe-area aware, above tab bar) */}
      <View
        pointerEvents="box-none"
        style={[styles.snackbarWrap, { bottom: Math.max(insets.bottom + 70, 86) }]}
      >
        <UndoBar
          visible={showUndo}
          message="Item deleted"
          actionLabel="Undo"
          onAction={onUndo}
          onHide={() => setShowUndo(false)}
          duration={UNDO_DURATION_MS}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, paddingTop: 8 },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },

  toolbar: { paddingHorizontal: 16, paddingTop: 10 },
  chipsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  chipText: { fontWeight: "700", color: "#111" },
  chipTextActive: { color: "#1D4ED8" },

  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  sortLabel: { fontWeight: "700", color: "#111" },

  sectionHeader: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionTitle: { fontWeight: "800", color: "#991B1B" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },

  addBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  addBtnText: { color: "white", fontWeight: "800" },

  fabWrap: { position: "absolute", bottom: 24, right: 24 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabPlus: { color: "white", fontSize: 28, fontWeight: "800", lineHeight: 28 },

  snackbarWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
});
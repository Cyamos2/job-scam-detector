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
        location: job.location,
        recruiterEmail: job.recruiterEmail,
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

      {/* Filters */}
      <View style={styles.toolbar}>
        <View style={styles.chipsRow}>
          {(["all", "high", "medium", "low"] as const).map((r) => {
            const active = risk === r;
            const emoji = r === "all" ? "📋" : r === "high" ? "🚨" : r === "medium" ? "⚠️" : "✅";
            return (
              <Pressable
                key={r}
                onPress={() => setRisk(r)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityLabel={`Filter ${r.toUpperCase()}`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {emoji} {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.chipsRow, { marginTop: 10 }]}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {(["score", "date", "title"] as const).map((key) => {
            const active = sortKey === key;
            const arrow = active ? (sortDir === "asc" ? " ↑" : " ↓") : "";
            return (
              <Pressable
                key={key}
                onPress={() => toggleSort(key)}
                style={[styles.sortChip, active && styles.sortChipActive]}
                accessibilityLabel={`Sort by ${key}`}
              >
                <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}{arrow}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* List / Empty */}
      {empty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyTitle}>
            {query.trim() ? "No matches found" : "Database is empty"}
          </Text>
          <Text style={styles.emptyText}>
            {query.trim() 
              ? "Try adjusting your search or filters" 
              : "Start analyzing job posts to build your scam detection history"}
          </Text>
          {!query.trim() && (
            <Pressable onPress={() => nav.navigate("AddContent")} style={styles.addBtn}>
              <Text style={styles.addBtnText}>✨ Analyze First Job</Text>
            </Pressable>
          )}
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
                  ? { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }
                  : section.key === "medium"
                  ? { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }
                  : { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
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

  toolbar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  chipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  chipText: { fontWeight: "700", color: "#6B7280", fontSize: 13 },
  chipTextActive: { color: "#2563EB" },

  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  sortChipActive: {
    backgroundColor: "#F3F4F6",
  },
  sortLabel: { fontWeight: "700", color: "#9CA3AF", fontSize: 13, marginRight: 4 },
  sortChipText: { fontWeight: "600", color: "#6B7280", fontSize: 13 },
  sortChipTextActive: { color: "#111827", fontWeight: "700" },

  sectionHeader: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  sectionTitle: { fontWeight: "800", color: "#374151", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },

  empty: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#111827",
    marginBottom: 8,
    textAlign: "center"
  },
  emptyText: { 
    fontSize: 14, 
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24
  },

  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addBtnText: { color: "white", fontWeight: "800", fontSize: 15 },

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
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
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortKey = "score" | "date" | "title";
type SortDir = "asc" | "desc";
type RiskFilter = "all" | "high" | "medium" | "low";

export default function DatabaseScreen() {
  const { colors, dark } = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const { items, deleteJob, undoDelete } = useJobs();

  const [query, setQuery] = React.useState("");
  const [risk, setRisk] = React.useState<RiskFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("score");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [showUndo, setShowUndo] = React.useState(false);

  React.useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => nav.navigate("AddContent")}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Add Job"
        >
          <Text style={{ fontWeight: "700", color: "#2563EB" }}>＋ Add</Text>
        </Pressable>
      ),
    });
  }, [nav]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    const scored = items.map((job) => {
      const result = scoreJob({
        title: job.title,
        company: job.company,
        url: job.url,
        notes: job.notes,
      });
      const bucket = visualBucket(result);
      return { job, result, bucket };
    });

    const filteredQuery = !q
      ? scored
      : scored.filter(({ job }) =>
          `${job.title} ${job.company} ${job.url ?? ""}`.toLowerCase().includes(q)
        );

    const filtered =
      risk === "all" ? filteredQuery : filteredQuery.filter((r) => r.bucket === risk);

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = a.result.score - b.result.score;
      else if (sortKey === "date") cmp = a.job.updatedAt - b.job.updatedAt;
      else if (sortKey === "title") cmp = a.job.title.localeCompare(b.job.title);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [items, query, risk, sortKey, sortDir]);

  const sections = React.useMemo(() => {
    const buckets: Severity[] = ["high", "medium", "low"];
    const labels: Record<Severity, string> = {
      high: "High Risk",
      medium: "Medium Risk",
      low: "Low Risk",
    };
    return buckets
      .map((b) => ({
        title: labels[b],
        key: b,
        data: rows.filter((r) => r.bucket === b),
      }))
      .filter((s) => s.data.length > 0);
  }, [rows]);

  const onDelete = async (id: string) => {
    await deleteJob(id);
    setShowUndo(true);
  };

  const confirmDelete = (id: string) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: "Delete this job?",
          message: "You can Undo right after deleting.",
        },
        (idx) => {
          if (idx === 1) onDelete(id);
        }
      );
    } else {
      Alert.alert(
        "Delete this job?",
        "You can Undo right after deleting.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(id) },
        ],
        { cancelable: true }
      );
    }
  };

  const onUndo = async () => {
    await undoDelete();
    setShowUndo(false);
  };

  const empty = sections.length === 0;

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
            {
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: "#E5E7EB",
            },
          ]}
        />
      </View>

      {/* Filter + Sort */}
      <View style={styles.toolbar}>
        <View style={styles.chipsRow}>
          {(["all", "low", "medium", "high"] as const).map((r) => {
            const active = risk === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRisk(r)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.chipsRow, { marginTop: 10 }]}>
          {(["score", "date", "title"] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() =>
                setSortKey((prev) =>
                  prev === key
                    ? (setSortDir((d) => (d === "asc" ? "desc" : "asc")), key)
                    : (setSortDir("desc"), key)
                )
              }
              style={styles.sortChip}
            >
              <Text style={styles.sortLabel}>
                {key[0].toUpperCase() + key.slice(1)}{" "}
                {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </Text>
            </Pressable>
          ))}
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
              reasons={item.result.reasons}
              bucket={item.bucket}
              onPress={() => nav.navigate("ReportDetail", { id: item.job.id })}
              onLongPress={() => confirmDelete(item.job.id)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Floating Add */}
      <View pointerEvents="box-none" style={styles.fabWrap}>
        <Pressable onPress={() => nav.navigate("AddContent")} style={styles.fab}>
          <Text style={styles.fabPlus}>＋</Text>
        </Pressable>
      </View>

      {/* Undo Snackbar (absolutely positioned above tab bar) */}
      <View pointerEvents="box-none" style={[styles.snackbarWrap, { bottom: insets.bottom + 70 }]}>
        <UndoBar
          visible={showUndo}
          message="Item deleted"
          actionLabel="Undo"
          onAction={onUndo}
          onHide={() => setShowUndo(false)}
          duration={2500}
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
    // bottom set dynamically using safe area + 70
  },
});
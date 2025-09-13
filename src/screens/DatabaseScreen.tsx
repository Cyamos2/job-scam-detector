import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SectionList,
  Pressable,
  Platform,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

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

  const {
    items,
    deleteJob,
    lastDeleted,
    restoreLastDeleted,
    clearUndoFlag,
  } = useJobs();

  // --- UI state
  const [query, setQuery] = React.useState("");
  const [risk, setRisk] = React.useState<RiskFilter>("all");

  const [sortKey, setSortKey] = React.useState<SortKey>("score");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // --- Prepare rows: score + reasons + bucket
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const scored = items.map((j) => {
      const result = scoreJob({
        title: j.title,
        company: j.company,
        url: j.url ?? undefined,
        notes: j.notes ?? undefined,
      });
      const bucket = visualBucket(result);
      return { job: j, result, bucket };
    });

    // filter by search
    const filteredByQuery = !q
      ? scored
      : scored.filter(({ job }) => {
          const blob = `${job.title} ${job.company} ${job.url ?? ""}`.toLowerCase();
          return blob.includes(q);
        });

    // filter by risk chip
    const filtered =
      risk === "all" ? filteredByQuery : filteredByQuery.filter((r) => r.bucket === risk);

    // sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = a.result.score - b.result.score;
      else if (sortKey === "date") cmp = (a.job.ts ?? 0) - (b.job.ts ?? 0);
      else if (sortKey === "title") cmp = a.job.title.localeCompare(b.job.title);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [items, query, risk, sortKey, sortDir]);

  // --- Group by visual bucket
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

  // --- Delete handlers
  const onDelete = (id: string) => deleteJob(id);
  const onUndo = () => restoreLastDeleted();
  const onUndoHide = () => clearUndoFlag();

  // --- Empty state?
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

      {/* Filter + Sort row */}
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
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.chipsRow, { marginTop: 10 }]}>
          <Pressable onPress={() => toggleSort("score")} style={styles.sortChip}>
            <Text style={styles.sortLabel}>
              Score {sortKey === "score" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </Text>
          </Pressable>
          <Pressable onPress={() => toggleSort("date")} style={styles.sortChip}>
            <Text style={styles.sortLabel}>
              Date {sortKey === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </Text>
          </Pressable>
          <Pressable onPress={() => toggleSort("title")} style={styles.sortChip}>
            <Text style={styles.sortLabel}>
              Title {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      {empty ? (
        <View style={styles.empty}>
          <Text style={{ color: "#6B7280" }}>No results.</Text>
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
              onLongPress={() => onDelete(item.job.id)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Bottom Undo snackbar */}
      <UndoBar
        visible={!!lastDeleted}
        message="Item deleted"
        actionLabel="Undo"
        onAction={onUndo}
        onHide={onUndoHide}
        duration={2500}
      />
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
});
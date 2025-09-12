import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  TextInput,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useJobs, type Job } from "../hooks/useJobs";
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import ScoreBadge from "../components/ScoreBadge";
import UndoBar from "../components/UndoBar";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type SortKey = "scoreDesc" | "scoreAsc" | "dateDesc" | "dateAsc" | "titleAsc" | "titleDesc";

export default function DatabaseScreen() {
  const nav = useNavigation<Nav>();
  const { colors } = useTheme();
  const { items, replaceAll } = useJobs();

  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("scoreDesc");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(j => {
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.url ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const sorted = React.useMemo(() => {
    const rows = filtered.map(j => {
      const r = scoreJob({
        title: j.title,
        company: j.company,
        url: j.url,
        notes: j.notes,
      });
      return { job: j, result: r, bucket: visualBucket(r) as Severity };
    });

    const key = sort;
    rows.sort((a, b) => {
      switch (key) {
        case "scoreDesc":
          return b.result.score - a.result.score;
        case "scoreAsc":
          return a.result.score - b.result.score;
        case "dateDesc":
          return (b.job.createdAt ?? 0) - (a.job.createdAt ?? 0);
        case "dateAsc":
          return (a.job.createdAt ?? 0) - (b.job.createdAt ?? 0);
        case "titleAsc":
          return a.job.title.localeCompare(b.job.title);
        case "titleDesc":
          return b.job.title.localeCompare(a.job.title);
      }
    });

    return rows;
  }, [filtered, sort]);

  const sections = React.useMemo(() => {
    const high = sorted.filter(r => r.bucket === "high");
    const med  = sorted.filter(r => r.bucket === "medium");
    const low  = sorted.filter(r => r.bucket === "low");
    const s: Array<{ title: string; color: string; data: typeof sorted }> = [];
    if (high.length) s.push({ title: "High Risk", color: "#FECACA", data: high });
    if (med.length)  s.push({ title: "Medium Risk", color: "#FDE68A", data: med });
    if (low.length)  s.push({ title: "Low Risk", color: "#D1FAE5", data: low });
    return s;
  }, [sorted]);

  // sort toggle labels
  const sortLabel = React.useMemo(() => {
    switch (sort) {
      case "scoreDesc": return "Score ↓";
      case "scoreAsc":  return "Score ↑";
      case "dateDesc":  return "Date ↓";
      case "dateAsc":   return "Date ↑";
      case "titleAsc":  return "Title A→Z";
      case "titleDesc": return "Title Z→A";
    }
  }, [sort]);

  const cycleScore = () => setSort(s => (s === "scoreDesc" ? "scoreAsc" : "scoreDesc"));
  const cycleDate  = () => setSort(s => (s === "dateDesc"  ? "dateAsc"  : "dateDesc"));
  const cycleTitle = () => setSort(s => (s === "titleAsc"  ? "titleDesc" : "titleAsc"));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by company or role"
        placeholderTextColor="#9aa0a6"
        style={[styles.search, { color: colors.text, backgroundColor: colors.card }]}
      />

      {/* Sort toggles */}
      <View style={styles.sortRow}>
        <Pressable style={styles.chip} onPress={cycleScore}><Text style={styles.chipText}>{sortLabel.startsWith("Score") ? sortLabel : "Score ↓"}</Text></Pressable>
        <Pressable style={styles.chip} onPress={cycleDate}><Text style={styles.chipText}>{sortLabel.startsWith("Date") ? sortLabel : "Date"}</Text></Pressable>
        <Pressable style={styles.chip} onPress={cycleTitle}><Text style={styles.chipText}>{sortLabel.startsWith("Title") ? sortLabel : "Title A→Z"}</Text></Pressable>
        <Pressable style={styles.chip} onPress={() => setQuery(q => q)}><Text style={styles.chipText}>Refresh</Text></Pressable>
      </View>

      {/* List */}
      {sections.length === 0 ? (
        <View style={styles.empty}><Text style={{ color: "#6B7280" }}>No results.</Text></View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.job.id}
          renderSectionHeader={({ section }) => (
            <View style={[styles.section, { backgroundColor: section.color }]}><Text style={styles.sectionText}>{section.title}</Text></View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => nav.navigate("ReportDetail", { id: item.job.id })}
              style={[styles.row, { backgroundColor: colors.card }]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.job.title}</Text>
                <Text style={[styles.meta, { color: colors.text }]} numberOfLines={1}>
                  {item.job.company}
                  {item.job.url ? `  ·  ${item.job.url}` : ""}
                </Text>
              </View>
              <ScoreBadge score={item.result.score} />
            </Pressable>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => nav.navigate("AddContent")}
        style={styles.fab}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>

      {/* Global Undo */}
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
  chipText: { fontWeight: "700", color: "#111" },

  section: { marginTop: 12, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sectionText: { color: "#7F1D1D", fontWeight: "800" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontSize: 16, fontWeight: "800" },
  meta: { marginTop: 2 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },

  fab: {
    position: "absolute", right: 20, bottom: 20,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  fabPlus: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "800" },
});
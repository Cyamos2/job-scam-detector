// src/screens/DatabaseScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SectionList,
  RefreshControl,
  Alert,
  Platform,
  ToastAndroid,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Screen from "../components/Screen";
import ScoreBadge from "../components/ScoreBadge";
import { scoreJob, type ScoreResult } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Risk = "low" | "medium" | "high";

type Row = { j: ReturnType<typeof useJobs>["items"][number]; s: ScoreResult };
type Section = { title: Risk; data: Row[] };

const toScoreInput = (j: ReturnType<typeof useJobs>["items"][number]) => ({
  title: j.title,
  company: j.company,
  url: j.url ?? undefined,
  notes: j.notes ?? undefined,
  risk: j.risk,
});

type SortBy = "date" | "title" | "score";
const sortRows = (rows: Row[], by: SortBy) => {
  const copy = rows.slice();
  switch (by) {
    case "title":
      copy.sort((a, b) => a.j.title.localeCompare(b.j.title));
      break;
    case "score":
      copy.sort((a, b) => b.s.score - a.s.score);
      break;
    case "date":
    default:
      // keep current order (assume newest first from store)
      break;
  }
  return copy;
};

export default function DatabaseScreen() {
  const nav = useNavigation<Nav>();
  const { colors, dark } = useTheme();
  const { items, remove } = useJobs();

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | Risk>("all");
  const [sortBy, setSortBy] = React.useState<SortBy>("score");
  const [refreshing, setRefreshing] = React.useState(false);

  const sections: Section[] = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows: Row[] = items.map((j) => ({ j, s: scoreJob(toScoreInput(j)) }));
    rows = rows.filter(({ j }) => (filter === "all" ? true : j.risk === filter));
    if (q) rows = rows.filter(({ j }) => `${j.title} ${j.company}`.toLowerCase().includes(q));
    rows = sortRows(rows, sortBy);

    const buckets: Record<Risk, Row[]> = { high: [], medium: [], low: [] };
    rows.forEach((r) => buckets[r.j.risk].push(r));

    const order: Risk[] = ["high", "medium", "low"];
    return order
      .map((title) => ({ title, data: buckets[title] }))
      .filter((s) => s.data.length > 0);
  }, [items, search, filter, sortBy]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const onDelete = React.useCallback(
    (id: string) => {
      Alert.alert("Delete", "Remove this entry?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await remove(id);
            if (Platform.OS === "android") ToastAndroid.show("Deleted", ToastAndroid.SHORT);
          },
        },
      ]);
    },
    [remove]
  );

  const renderItem = ({ item }: { item: Row }) => {
    const { j, s } = item;
    const tint =
      j.risk === "high" ? (dark ? "#3b1f1f" : "#FEF2F2") :
      j.risk === "medium" ? (dark ? "#3b2a1f" : "#FFF7ED") :
      (dark ? "#10291f" : "#F0FDF4");

    return (
      <Pressable
        onPress={() => nav.navigate("ReportDetail", { id: j.id })}
        onLongPress={() => onDelete(j.id)}
        style={[styles.row, { backgroundColor: tint, borderColor: colors.border }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {j.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            <Text style={{ color: "#6B7280" }}>{j.company}</Text>
            <Text style={{ color: "#9CA3AF" }}>
              {j.url ? ` • ${j.url}` : ""} • {j.risk.toUpperCase()}
            </Text>
          </Text>
        </View>
        <ScoreBadge score={s.score} />
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => {
    const map: Record<Risk, { label: string; color: string; bg: string }> = {
      high: { label: "High Risk", color: "#B91C1C", bg: "#FEF2F2" },
      medium: { label: "Medium Risk", color: "#B45309", bg: "#FFF7ED" },
      low: { label: "Low Risk", color: "#047857", bg: "#ECFDF5" },
    };
    const p = map[section.title];
    return (
      <View style={[styles.sectionHeader, { backgroundColor: p.bg, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: p.color }]}>{p.label}</Text>
      </View>
    );
  };

  const Pill = ({
    active,
    children,
    onPress,
  }: { active?: boolean; children: React.ReactNode; onPress?: () => void }) => (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && { color: "#111827" }]}>{children}</Text>
    </Pressable>
  );

  return (
    <Screen>
      {/* search */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by company or role"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.search,
            { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
          ]}
        />
      </View>

      {/* filters */}
      <View style={styles.filtersRow}>
        {(["all", "low", "medium", "high"] as const).map((f) => (
          <Pill key={f} active={filter === f} onPress={() => setFilter(f)}>
            {String(f).toUpperCase()}
          </Pill>
        ))}
        <Pressable onPress={() => setSearch("")}>
          <Text style={{ color: "#6B7280", fontWeight: "700" }}>Refresh</Text>
        </Pressable>
      </View>

      {/* sort */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        {(["score", "date", "title"] as const).map((s) => (
          <Pill key={s} active={sortBy === s} onPress={() => setSortBy(s)}>
            {s === "score" ? "Score ↓" : s === "date" ? "Date" : "Title A→Z"}
          </Pill>
        ))}
      </View>

      {/* list with sections */}
      <SectionList<Row, Section>
        sections={sections}
        keyExtractor={({ j }) => j.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12, paddingBottom: 96 }}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>No results.</Text>
          </View>
        }
      />

      {/* FAB: Add */}
      <Pressable
        accessibilityRole="button"
        onPress={() => nav.navigate("AddContent" as any)}
        style={[styles.fab, { backgroundColor: "#1f6cff", shadowColor: "#000" }]}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Add</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  filtersRow: {
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  sortRow: { paddingHorizontal: 16, paddingBottom: 6, flexDirection: "row", alignItems: "center", gap: 8 },
  sortLabel: { color: "#6B7280", fontWeight: "800", marginRight: 4 },

  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff",
  },
  pillActive: { borderWidth: 1.2 },
  pillText: { fontWeight: "800", color: "#6B7280" },

  sectionHeader: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "900" },

  row: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  title: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  sub: { fontSize: 13 },

  fab: {
    position: "absolute", right: 20, bottom: 24,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6,
    elevation: 5,
  },
});
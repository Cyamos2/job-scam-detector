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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../components/Screen";
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";
import { usePersistedState } from "../store/persist";
import JobRow from "../components/JobRow";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Row = {
  j: ReturnType<typeof useJobs>["items"][number];
  s: ReturnType<typeof scoreJob>;
  b: Severity;
};

type Section = { title: Severity; data: Row[] };

const toScoreInput = (j: ReturnType<typeof useJobs>["items"][number]) => ({
  title: j.title,
  company: j.company,
  url: j.url ?? undefined,
  notes: j.notes ?? undefined,
});

type SortBy = "date" | "title" | "score";
type SortDir = "desc" | "asc";

export default function DatabaseScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { colors, dark } = useTheme();
  const { items, remove } = useJobs();

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = usePersistedState<"all" | Severity>("db.filter", "all");
  const [sortBy, setSortBy] = usePersistedState<SortBy>("db.sort", "score");
  const [sortDir, setSortDir] = usePersistedState<SortDir>("db.sortDir", "desc");
  const [refreshing, setRefreshing] = React.useState(false);

  const sections: Section[] = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows: Row[] = items.map((j) => {
      const s = scoreJob(toScoreInput(j));
      const b = visualBucket(s);
      return { j, s, b };
    });

    if (filter !== "all") {
      rows = rows.filter((r) => r.b === filter);
    }

    if (q) {
      rows = rows.filter(({ j }) => `${j.title} ${j.company}`.toLowerCase().includes(q));
    }

    // Sort
    rows = rows.slice().sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "title":
          cmp = a.j.title.localeCompare(b.j.title);
          break;
        case "score":
          cmp = a.s.score - b.s.score;
          break;
        case "date":
        default:
          // keep insertion order; you can sort by createdAt if present
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    // Group by bucket
    const buckets: Record<Severity, Row[]> = { high: [], medium: [], low: [] };
    rows.forEach((r) => buckets[r.b].push(r));

    const order: Severity[] = ["high", "medium", "low"];
    return order
      .map((title) => ({ title, data: buckets[title] }))
      .filter((s) => s.data.length > 0);
  }, [items, search, filter, sortBy, sortDir]);

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
            if (Platform.OS === "android") {
              ToastAndroid.show("Deleted", ToastAndroid.SHORT);
            }
          },
        },
      ]);
    },
    [remove]
  );

  const onAdd = React.useCallback(() => {
    nav.navigate("AddContent"); // open create
  }, [nav]);

  const renderItem = ({ item }: { item: Row }) => {
    const { j, s } = item;
    return (
      <JobRow
        job={j}
        score={s.score}
        onPress={() => nav.navigate("ReportDetail", { id: j.id })}
        onLongPress={() => onDelete(j.id)}
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => {
    const map: Record<Severity, { label: string; color: string; bg: string }> = {
      high:   { label: "High Risk",   color: "#B91C1C", bg: "#FEF2F2" },
      medium: { label: "Medium Risk", color: "#B45309", bg: "#FFF7ED" },
      low:    { label: "Low Risk",    color: "#047857", bg: "#ECFDF5" },
    };
    const p = map[section.title];

    return (
      <View style={[styles.sectionHeader, { backgroundColor: p.bg, borderColor: colors.border, marginTop: 8 }]}>
        <Text style={[styles.sectionTitle, { color: p.color }]}>{p.label}</Text>
      </View>
    );
  };

  const Pill = ({
    active,
    children,
    onPress,
  }: {
    active?: boolean;
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && { color: "#111827" }]}>{children}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <View style={{ height: insets.top }} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
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

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        <Pill
          active={sortBy === "score"}
          onPress={() => {
            setSortBy("score");
            setSortDir(sortDir === "desc" ? "asc" : "desc");
          }}
        >
          Score {sortBy === "score" ? (sortDir === "desc" ? "↓" : "↑") : ""}
        </Pill>
        <Pill
          active={sortBy === "date"}
          onPress={() => {
            setSortBy("date");
            setSortDir(sortDir === "desc" ? "asc" : "desc");
          }}
        >
          Date
        </Pill>
        <Pill
          active={sortBy === "title"}
          onPress={() => {
            setSortBy("title");
            setSortDir(sortDir === "desc" ? "asc" : "desc");
          }}
        >
          Title {sortDir === "desc" ? "Z→A" : "A→Z"}
        </Pill>
      </View>

      <SectionList<Row, Section>
        sections={sections}
        keyExtractor={({ j }) => j.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 + insets.bottom + 80 }}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>No results.</Text>
          </View>
        }
      />

      {/* Floating Add button (restored) */}
      <Pressable
        onPress={onAdd}
        style={[styles.addBtn, { bottom: 24 + insets.bottom, shadowColor: "#000" }]}
        android_ripple={{ color: "#ffffff55", borderless: true }}
      >
        <Text style={styles.addBtnPlus}>＋</Text>
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

  addBtn: {
    position: "absolute",
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1f6cff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 50,
  },
  addBtnPlus: { color: "#fff", fontSize: 28, lineHeight: 30, fontWeight: "700" },
});
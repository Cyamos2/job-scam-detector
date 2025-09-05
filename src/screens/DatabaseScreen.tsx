// src/screens/DatabaseScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
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

// ---------- types ----------
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Risk = "low" | "medium" | "high";
type Job = ReturnType<typeof useJobs>["items"][number];

// A single row in the list (job + computed score)
type Row = {
  j: ReturnType<typeof useJobs>["items"][number];
  s: ScoreResult;
};

// ---------- helpers ----------
const toScoreInput = (j: ReturnType<typeof useJobs>["items"][number]) => ({
  title: j.title,
  company: j.company,
  url: j.url ?? undefined,     // normalize null -> undefined
  notes: j.notes ?? undefined, // normalize null -> undefined
  risk: j.risk,
});

export default function DatabaseScreen() {
  const nav = useNavigation<Nav>();
  const { colors, dark } = useTheme();
  const { items, remove } = useJobs();

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | Risk>("all");

  // compute rows (score + filter + sort) with correct typing
  const data: Row[] = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return items
      .map((j) => ({ j, s: scoreJob(toScoreInput(j)) }))
      .filter(({ j }) => (filter === "all" ? true : j.risk === filter))
      .filter(({ j }) =>
        q ? `${j.title} ${j.company}`.toLowerCase().includes(q) : true
      )
      // sort by score desc to surface riskiest first (tweak as you like)
      .sort((a, b) => b.s.score - a.s.score);
  }, [items, search, filter]);

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

  // simple row renderer without changing your existing RowItem API
  const renderItem = ({ item }: { item: Row }) => {
    const { j, s } = item;

    // subtle background tint by risk bucket
    const tint =
      j.risk === "high"
        ? (dark ? "#3b1f1f" : "#FEF2F2")
        : j.risk === "medium"
        ? (dark ? "#3b2a1f" : "#FFF7ED")
        : (dark ? "#10291f" : "#F0FDF4");

    return (
      <Pressable
        onPress={() => nav.navigate("ReportDetail", { id: j.id })}
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

      {/* filter pills */}
      <View style={styles.filters}>
        {(["all", "low", "medium", "high"] as const).map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.pill,
                active && styles.pillActive,
                active && f === "low" && { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
                active && f === "medium" && { borderColor: "#FED7AA", backgroundColor: "#FFF7ED" },
                active && f === "high" && { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
              ]}
            >
              <Text style={[styles.pillText, active && { color: "#111827" }]}>
                {String(f).toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setSearch("")}>
          <Text style={{ color: "#6B7280", fontWeight: "700" }}>Refresh</Text>
        </Pressable>
      </View>

      {/* list */}
      <FlatList<Row>
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12 }}
        data={data}
        keyExtractor={({ j }) => j.id}
        renderItem={renderItem}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  pillActive: { borderWidth: 1.2 },
  pillText: { fontWeight: "800", color: "#6B7280" },

  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  sub: { fontSize: 13 },
});
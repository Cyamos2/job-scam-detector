// src/screens/DatabaseScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Screen from "../components/Screen";
import { useJobs } from "../hooks/useJobs";
import { goToAddContent } from "../navigation/goTo";
import type { RootTabParamList, RootStackParamList } from "../navigation/types";
import ScoreBadge from "../components/ScoreBadge";
import { scoreJob } from "../lib/scoring";

type RiskFilter = "all" | "low" | "medium" | "high";
const ORANGE = "#FF5733";

export default function DatabaseScreen() {
  // Tab nav (for goToAddContent)
  const tabNav = useNavigation<NavigationProp<RootTabParamList>>();
  // Root stack nav (for pushing ReportDetail)
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { colors, dark } = useTheme();
  const { items, loading, refresh } = useJobs();

  const [filter, setFilter] = React.useState<RiskFilter>("all");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    let next = items ?? [];
    if (filter !== "all") next = next.filter((j) => j.risk === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q)
      );
    }
    return next;
  }, [items, filter, search]);

  const renderItem = ({ item }: any) => {
    const { score } = scoreJob(item);
    return (
      <Pressable
        onPress={() => rootNav.navigate("ReportDetail", { id: item.id })}
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={[styles.rowTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.rowMeta,
              { color: dark ? "#cbd5e1" : "#6B7280" },
            ]}
            numberOfLines={1}
          >
            {item.company} {item.url ? `• ${item.url}` : ""} •{" "}
            {item.risk?.toUpperCase()}
          </Text>
        </View>
        <ScoreBadge score={score} />
      </Pressable>
    );
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by company or role"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.search,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          returnKeyType="search"
        />

        <View style={styles.chips}>
          {(["all", "low", "medium", "high"] as const).map((r) => {
            const active = filter === r;
            return (
              <Pressable
                key={r}
                onPress={() => setFilter(r)}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && {
                    borderColor: ORANGE,
                    backgroundColor: dark ? "#261512" : "#fff4f1",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.text },
                    active && { color: ORANGE },
                  ]}
                >
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={refresh} style={styles.refresh}>
            <Text
              style={[
                styles.refreshText,
                { color: dark ? "#cbd5e1" : "#6B7280" },
              ]}
            >
              Refresh
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && { flex: 1, justifyContent: "center" },
        ]}
        refreshControl={
          <RefreshControl refreshing={!!loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No items
            </Text>
            <Pressable
              onPress={() => goToAddContent(tabNav)}
              style={[styles.addContentBtn, { backgroundColor: "#1f6cff" }]}
            >
              <Text style={styles.addContentText}>Add content</Text>
            </Pressable>
          </View>
        }
      />

      <Pressable onPress={() => goToAddContent(tabNav)} style={styles.fab}>
        <Text style={styles.fabText}>Add</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 0, gap: 10 },
  search: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontWeight: "700" },
  refresh: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 },
  refreshText: { fontWeight: "600" },

  listContent: { paddingVertical: 10, gap: 10 },
  row: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rowTitle: { fontWeight: "700", marginBottom: 4 },
  rowMeta: {},
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  addContentBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  addContentText: { color: "#fff", fontWeight: "700" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 28,
    backgroundColor: "#1f6cff",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "800" },
});
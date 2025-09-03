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
import Screen from "../components/Screen";
import { useJobs } from "../hooks/useJobs";
import { goToAddContent } from "../navigation/goTo";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootTabParamList } from "../navigation/types";

type RiskFilter = "all" | "low" | "medium" | "high";
const colors = { primary: "#FF5733" };

export default function DatabaseScreen() {
  // ✅ Type the navigation so it matches goToAddContent
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

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

  const renderItem = ({ item }: any) => (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{item.title}</Text>
      <Text style={styles.rowMeta}>
        {item.company} • {item.risk?.toUpperCase()}
      </Text>
    </View>
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by company or role"
          placeholderTextColor="#9aa0a6"
          style={styles.search}
          returnKeyType="search"
        />

        <View style={styles.chips}>
          {(["all", "low", "medium", "high"] as const).map((r) => {
            const active = filter === r;
            return (
              <Pressable
                key={r}
                onPress={() => setFilter(r)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={refresh} style={styles.refresh}>
            <Text style={styles.refreshText}>Refresh</Text>
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
            <Text style={styles.emptyTitle}>No items</Text>
            <Pressable
              onPress={() => goToAddContent(navigation)}
              style={styles.addContentBtn}
            >
              <Text style={styles.addContentText}>Add content</Text>
            </Pressable>
          </View>
        }
      />

      <Pressable
        onPress={() => goToAddContent(navigation)}
        style={styles.fab}
      >
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
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
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
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: colors.primary, backgroundColor: "#fff4f1" },
  chipText: { color: "#111", fontWeight: "700" },
  chipTextActive: { color: colors.primary },
  refresh: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 },
  refreshText: { color: "#6B7280", fontWeight: "600" },

  listContent: { paddingVertical: 10, gap: 10 },
  row: {
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowTitle: { fontWeight: "700", marginBottom: 4 },
  rowMeta: { color: "#6B7280" },

  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  addContentBtn: {
    backgroundColor: "#1f6cff",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
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
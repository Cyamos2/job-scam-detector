// src/screens/DatabaseScreen.tsx
import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useColors } from "../theme/useColors";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useSettings, type VerdictFilter, type SortOrder } from "../SettingsProvider";

type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseMain">;

export default function DatabaseScreen({ navigation }: Props) {
  const { colors, bg, card, text, muted } = useColors();
  const { items, hydrated } = useSavedItems();
  const {
    settings: { dbPrefs },
    setDbPrefs,
  } = useSettings();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: "Database" });
  }, [navigation]);

  const q = dbPrefs.search;
  const filter = dbPrefs.filter;
  const sort = dbPrefs.sort;

  const setSearch = (v: string) => setDbPrefs({ search: v });
  const setFilter = (v: VerdictFilter) => setDbPrefs({ filter: v });
  const setSort = (v: SortOrder) => setDbPrefs({ sort: v });

  const filtered = useMemo(() => {
    let arr = items.slice();
    if (q.trim()) {
      const needle = q.toLowerCase();
      arr = arr.filter((it) => {
        const hay = `${it.title} ${it.flags.join(" ")} ${it.inputPreview ?? ""}`.toLowerCase();
        return hay.includes(needle);
      });
    }
    if (filter !== "All") {
      arr = arr.filter((x) => x.verdict === filter);
    }
    arr.sort((a, b) => (sort === "Newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
    return arr;
  }, [items, q, filter, sort]);

  const goToAddContent = () => {
    (navigation.getParent() as any)?.navigate("HomeTab", { screen: "AddContent" });
  };

  if (!hydrated) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.muted, muted]}>Loading…</Text>
      </View>
    );
  }

  const emptyMsg =
    q.trim() || filter !== "All"
      ? `No ${filter === "All" ? "" : `${filter} `}items match your search`
      : "No saved analyses yet";

  return (
    <View style={[styles.container, bg]}>
      <TextInput
        value={q}
        onChangeText={setSearch}
        placeholder="Search title / flags / preview"
        placeholderTextColor={muted.color as string}
        style={[styles.search, card, { borderColor: colors.border }]}
      />

      <View style={styles.pillsRow}>
        {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((v) => (
          <Pressable
            key={v}
            onPress={() => setFilter(v)}
            style={[
              styles.pill,
              card,
              { borderColor: colors.border },
              filter === v && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.pillText, filter === v ? { color: "white" } : text]}>{v}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => setSort(sort === "Newest" ? "Oldest" : "Newest")}
          style={[styles.pill, card, { borderColor: colors.border }]}
        >
          <Text style={[styles.pillText, text]}>{sort}</Text>
        </Pressable>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, text]}>{emptyMsg}.</Text>
          <Pressable onPress={goToAddContent} style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>Add content</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList<SavedAnalysis>
          data={filtered}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
              style={[styles.row, card, { borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, text]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.rowMeta, styles.muted, muted]} numberOfLines={1}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                <Text style={[styles.rowSub, text]} numberOfLines={1}>
                  {item.verdict} · {item.score}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable onPress={goToAddContent} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  search: { margin: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },

  pillsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", paddingHorizontal: 16, paddingBottom: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillText: { fontWeight: "700" },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16 },
  cta: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  ctaText: { color: "white", fontWeight: "700" },

  row: { padding: 12, borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginBottom: 12 },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowMeta: { fontSize: 12, marginTop: 2, marginBottom: 4 },
  rowSub: { fontSize: 12, opacity: 0.85 },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabPlus: { color: "white", fontSize: 28, lineHeight: 30, fontWeight: "800" },

  // ✅ add this so the earlier reference compiles
  muted: { opacity: 0.7 },
});
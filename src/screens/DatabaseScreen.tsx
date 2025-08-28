// src/screens/DatabaseScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSavedItems } from "../store/savedItems";
import { useColors } from "../theme/useColors";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";

type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseList">;
type SortOrder = "Newest" | "Oldest";
type VerdictFilter = "All" | "Low" | "Medium" | "High";

export default function DatabaseScreen({ navigation }: Props) {
  const { items, hydrated } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  const [sort, setSort] = useState<SortOrder>("Newest");
  const [filter, setFilter] = useState<VerdictFilter>("All");

  const filtered = useMemo(() => {
    let arr = [...items];
    if (filter !== "All") arr = arr.filter((x) => x.verdict === filter);
    arr.sort((a, b) =>
      sort === "Newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
    return arr;
  }, [items, sort, filter]);

  if (!hydrated) {
    return (
      <View style={[styles.center, bg]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[text, { marginTop: 10 }]}>Loading database…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, bg]}>
      {/* Filters */}
      <View style={styles.filters}>
        {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.chip,
              card,
              filter === f && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                filter === f ? { color: "white" } : text,
              ]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Sorting */}
      <View style={styles.filters}>
        {(["Newest", "Oldest"] as SortOrder[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSort(s)}
            style={[
              styles.chip,
              card,
              sort === s && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.chipText, sort === s ? { color: "white" } : text]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.empty, text]}>No saved analyses yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
              style={[styles.card, card]}
            >
              <Text style={[styles.title, text]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.meta, muted]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={[styles.meta, muted]}>
                Risk: {item.verdict} | Score: {item.score}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontWeight: "600" },

  card: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 4 },
  empty: { fontSize: 16, fontWeight: "600" },
});
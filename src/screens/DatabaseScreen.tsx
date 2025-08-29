import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type VerdictFilter = "All" | "Low" | "Medium" | "High";
type SortOrder = "Newest" | "Oldest";
type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseList">;

export default function DatabaseScreen({ navigation }: Props) {
  const { items, hydrated, remove, clearAll } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();
  const borderColor = (colors as any).border ?? "#e6e6e6";

  const [filter, setFilter] = useState<VerdictFilter>("All");
  const [sort, setSort] = useState<SortOrder>("Newest");

  const list = useMemo(() => {
    let arr = items.slice();
    if (filter !== "All") arr = arr.filter((x) => x.verdict === filter);
    arr.sort((a, b) =>
      sort === "Newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
    return arr;
  }, [items, filter, sort]);

  function goToAddContent() {
    // Jump from Database tab -> Home tab -> AddContent screen
    const parent = navigation.getParent();
    (parent as any)?.navigate("HomeTab", { screen: "AddContent" });
  }

  if (!hydrated) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.muted, muted]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, bg]}>
      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.row}>
          {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setFilter(v)}
              style={[
                styles.chip,
                { borderColor },
                filter === v && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  filter === v ? { color: "white" } : text,
                ]}
              >
                {v}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          {(["Newest", "Oldest"] as SortOrder[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSort(s)}
              style={[
                styles.chip,
                { borderColor },
                sort === s && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  sort === s ? { color: "white" } : text,
                ]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Clear All (only if there are items) */}
      {list.length > 0 && (
        <Pressable
          onPress={() =>
            Alert.alert("Clear all?", "This removes every saved analysis.", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearAll },
            ])
          }
          style={styles.clearAll}
        >
          <Text style={{ color: "#c00", fontWeight: "700" }}>Clear All</Text>
        </Pressable>
      )}

      {/* List */}
      <FlatList<SavedAnalysis>
        data={list}
        keyExtractor={(it) => it.id}
        contentContainerStyle={list.length === 0 ? styles.center : { padding: 12 }}
        ListEmptyComponent={
          <Text style={[styles.empty, muted]}>No saved analyses yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
            onLongPress={() =>
              Alert.alert("Delete this?", item.title, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
              ])
            }
            style={[
              styles.card,
              card,
              { borderColor },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, text]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardSub, muted]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>

              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        item.verdict === "High"
                          ? "#ffd6d6"
                          : item.verdict === "Medium"
                          ? "#ffecc2"
                          : "#d9f3d9",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          item.verdict === "High"
                            ? "#a20000"
                            : item.verdict === "Medium"
                            ? "#8a5a00"
                            : "#1a6b1a",
                      },
                    ]}
                  >
                    {item.verdict}
                  </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: "#e8f0ff" }]}>
                  <Text style={[styles.badgeText, { color: "#1b72e8" }]}>
                    {item.score}
                  </Text>
                </View>
              </View>

              {item.inputPreview ? (
                <Text style={[styles.preview, muted]} numberOfLines={2}>
                  {item.inputPreview}
                </Text>
              ) : null}
            </View>

            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
            ) : null}
          </Pressable>
        )}
      />

      {/* FAB → AddContent in Home tab */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={goToAddContent}
        accessibilityLabel="Add to Database"
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { paddingHorizontal: 12, paddingTop: 10, gap: 10 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  chipText: { fontWeight: "700" },

  clearAll: { alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 6 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  empty: { fontSize: 16 },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "white",
    marginBottom: 10,
    borderWidth: 1,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  cardSub: { fontSize: 12, marginTop: 2 },
  preview: { fontSize: 12, marginTop: 6 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#ddd" },

  badgeRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabPlus: { color: "white", fontSize: 28, fontWeight: "700", lineHeight: 30 },
  muted: { opacity: 0.7 },
});
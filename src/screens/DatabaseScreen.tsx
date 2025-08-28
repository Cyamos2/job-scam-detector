// src/screens/DatabaseScreen.tsx
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

  const [filter, setFilter] = useState<VerdictFilter>("All");
  const [sort, setSort] = useState<SortOrder>("Newest");

  // Cross-tab: Database tab ➜ Home tab ➜ AddContent
  function goToAddContent() {
    navigation.getParent()?.navigate("HomeTab" as never, {
      screen: "AddContent",
    } as never);
  }

  const list = useMemo(() => {
    let arr = items.slice();
    if (filter !== "All") arr = arr.filter((x) => x.verdict === filter);
    arr.sort((a, b) =>
      sort === "Newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
    return arr;
  }, [items, filter, sort]);

  return (
    <View style={[styles.container, bg]}>
      {/* Filter + Sort */}
      <View style={styles.controls}>
        <View style={styles.row}>
          {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setFilter(v)}
              style={[
                styles.chip,
                card,
                filter === v && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
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
                card,
                sort === s && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
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

      {/* Clear All */}
      {hydrated && list.length > 0 && (
        <Pressable
          onPress={() =>
            Alert.alert("Clear all?", "This removes every saved report.", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear All", style: "destructive", onPress: clearAll },
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
        contentContainerStyle={
          list.length === 0 ? styles.emptyWrap : { padding: 12 }
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, muted]}>No saved analyses yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("ReportDetail", { id: item.id })
            }
            onLongPress={() =>
              Alert.alert("Delete?", `Remove “${item.title}”?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
              ])
            }
            style={[styles.card, card, { borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, text]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardSub, muted]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={[styles.cardInfo, text]}>
                Score {item.score} — {item.verdict} risk
              </Text>
              <Text style={[styles.cardFlags, muted]} numberOfLines={1}>
                Flags: {item.flags.length ? item.flags.join(", ") : "none"}
              </Text>
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

      {/* FAB ➜ AddContent (in Home stack) */}
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
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontWeight: "700" },

  clearAll: { alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 8 },

  emptyWrap: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16 },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "800", fontSize: 18, marginBottom: 2 },
  cardSub: { fontSize: 12, marginBottom: 6, opacity: 0.8 },
  cardInfo: { fontWeight: "700", marginBottom: 2 },
  cardFlags: { fontSize: 12, marginBottom: 4, opacity: 0.9 },
  preview: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#ddd" },

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
});
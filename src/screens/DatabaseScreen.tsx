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
  const { bg, card, text, colors } = useColors();

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

  function goToDetail(id: string) {
    navigation.navigate("ReportDetail", { id });
  }

  function goToAddContent() {
    (navigation.getParent() as any)?.navigate("HomeTab", { screen: "AddContent" });
  }

  if (!hydrated) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.mutedText, { color: colors.text }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, bg]}>
      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.rowWrap}>
          {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((v) => {
            const active = filter === v;
            return (
              <Pressable
                key={v}
                onPress={() => setFilter(v)}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? { color: "white" } : { color: colors.text },
                  ]}
                >
                  {v}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.rowWrap}>
          {(["Newest", "Oldest"] as SortOrder[]).map((s) => {
            const active = sort === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSort(s)}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? { color: "white" } : { color: colors.text },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {list.length > 0 && (
        <Pressable
          onPress={() =>
            Alert.alert("Clear all?", "This removes every saved report.", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearAll },
            ])
          }
          style={styles.clearAll}
        >
          <Text style={{ color: "#c00", fontWeight: "700" }}>Clear All</Text>
        </Pressable>
      )}

      <FlatList<SavedAnalysis>
        data={list}
        keyExtractor={(it) => it.id}
        contentContainerStyle={
          list.length === 0 ? styles.center : { padding: 12, paddingBottom: 96 }
        }
        ListEmptyComponent={
          <View style={styles.centerInner}>
            <Text style={[styles.emptyTitle, { color: colors.text, opacity: 0.8 }]}>
              No saved analyses yet.
            </Text>
            <Pressable
              onPress={goToAddContent}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryText}>Add content</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => goToDetail(item.id)}
            onLongPress={() =>
              Alert.alert("Delete?", `Remove “${item.title}”?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
              ])
            }
            style={[
              styles.card,
              card,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.cardSub, { color: colors.text, opacity: 0.6 }]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={[styles.cardInfo, { color: colors.text }]}>
                Score {item.score} — {item.verdict} risk
              </Text>
              <Text
                style={[styles.cardFlags, { color: colors.text, opacity: 0.6 }]}
                numberOfLines={1}
              >
                Flags: {item.flags.length ? item.flags.join(", ") : "none"}
              </Text>
              {item.inputPreview ? (
                <Text
                  style={[styles.preview, { color: colors.text, opacity: 0.6 }]}
                  numberOfLines={2}
                >
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

      <Pressable
        style={[
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: "#000" },
        ]}
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
  rowWrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontWeight: "700" },

  clearAll: { alignSelf: "flex-end", padding: 10 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerInner: { alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  mutedText: { opacity: 0.7 },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  cardSub: { fontSize: 12 },
  cardInfo: { fontWeight: "600" },
  cardFlags: { fontSize: 12 },
  preview: { fontSize: 12, marginTop: 4 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#ddd" },

  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryText: { color: "white", fontWeight: "700" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabPlus: { color: "white", fontSize: 28, fontWeight: "700", lineHeight: 30 },
});
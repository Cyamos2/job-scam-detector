import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

export default function DatabaseScreen() {
  const { items, hydrated, remove, clearAll } = useSavedItems();

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {items.length > 0 && (
        <Pressable onPress={clearAll} style={styles.clearAll}>
          <Text style={{ color: "#c00", fontWeight: "700" }}>Clear All</Text>
        </Pressable>
      )}

      <FlatList<SavedAnalysis>
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={items.length === 0 ? styles.center : { padding: 12 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.title}>Database</Text>
            <Text style={styles.muted}>No saved analyses yet.</Text>
          </View>
        }
        renderItem={({ item }: { item: SavedAnalysis }) => (
          <Pressable onLongPress={() => remove(item.id)} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.cardInfo}>
                Score {item.score} — {item.verdict} risk
              </Text>
              <Text style={styles.cardFlags} numberOfLines={1}>
                Flags: {item.flags.length ? item.flags.join(", ") : "none"}
              </Text>
              {item.inputPreview ? (
                <Text style={styles.preview} numberOfLines={2}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  muted: { opacity: 0.7 },
  clearAll: { alignSelf: "flex-end", padding: 10 },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "white",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontWeight: "700" },
  cardSub: { fontSize: 12, opacity: 0.6, marginBottom: 4 },
  cardInfo: { fontWeight: "600" },
  cardFlags: { fontSize: 12, opacity: 0.8 },
  preview: { fontSize: 12, opacity: 0.7, marginTop: 6 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#ddd" },
});
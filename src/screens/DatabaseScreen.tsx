// src/screens/DatabaseScreen.tsx
import React from "react";
import { View, TextInput, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { useColors } from "../theme/useColors";
import { useSavedItems } from "../store/savedItems";

type Props = { navigation: any };

export default function DatabaseScreen({ navigation }: Props) {
  const { colors, bg, card, text, muted } = useColors();
  const { items } = useSavedItems();
  const [query, setQuery] = React.useState("");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Database",
      headerShown: true,
    });
  }, [navigation]);

  const filtered = items.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      it.title.toLowerCase().includes(q) ||
      it.flags.join(" ").toLowerCase().includes(q) ||
      (it.inputPreview ?? "").toLowerCase().includes(q)
    );
  });

  const goAdd = () => navigation.getParent()?.navigate("HomeTab" as never, { screen: "AddContent" } as never);

  return (
    <View style={[styles.container, bg]}>
      {/* ⬇️ removed <Text>Database</Text> title */}
      <TextInput
        style={[styles.search, card, { borderColor: colors.border }, text]}
        placeholder="Search title/flags/preview"
        placeholderTextColor={muted.color as string}
        value={query}
        onChangeText={setQuery}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, text]}>No saved analyses yet.</Text>
          <Pressable onPress={goAdd} style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>Add content</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, card, { borderColor: colors.border }]}
              onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
            >
              <Text style={[styles.rowTitle, text]} numberOfLines={1}>{item.title}</Text>
              <Text style={muted} numberOfLines={1}>{item.flags.join(", ") || "—"}</Text>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={goAdd} accessibilityLabel="Add">
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10, gap: 4 },
  rowTitle: { fontWeight: "700" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16 },
  cta: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  ctaText: { color: "white", fontWeight: "700" },
  fab: {
    position: "absolute", right: 20, bottom: 24,
    width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  fabPlus: { color: "white", fontSize: 30, fontWeight: "700", lineHeight: 30 },
});
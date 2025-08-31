import React from "react";
import { View, Text, Pressable, StyleSheet, TextInput, FlatList } from "react-native";
import { useColors } from "../theme/useColors";
import { useSavedItems } from "../store/savedItems";
import { goToAddContent } from "../navigation/goTo";

type Props = { navigation: any };

export default function DatabaseScreen({ navigation }: Props) {
  const { colors, bg, card, text } = useColors();
  const { items, hydrated } = useSavedItems();
  const [q, setQ] = React.useState("");

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: "Database" });
  }, [navigation]);

  if (!hydrated) return null;

  const filtered = items.filter((it) => {
    if (!q.trim()) return true;
    const hay = `${it.title} ${it.flags.join(" ")} ${it.inputPreview ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <View style={[styles.container, bg]}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search title/flags/preview"
        placeholderTextColor="#9aa0a6"
        style={[styles.search, card, { borderColor: colors.border }]}
      />

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, text]}>
            {q.trim() ? "No results match your search." : "No saved analyses yet."}
          </Text>
          <Pressable
            onPress={() => goToAddContent(navigation)}
            style={[styles.cta, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.ctaText}>Add content</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("ReportDetail" as never, { id: item.id } as never)}
              style={[styles.row, card, { borderColor: colors.border }]}
            >
              <Text style={[styles.rowTitle, text]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.rowSub, text]} numberOfLines={1}>
                {item.verdict} · {item.score}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Pressable
        onPress={() => goToAddContent(navigation)}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        accessibilityLabel="Add content"
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 18 },
  cta: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  ctaText: { color: "white", fontWeight: "700" },
  row: { padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 12, opacity: 0.8 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  fabPlus: { color: "white", fontSize: 30, lineHeight: 30, fontWeight: "700" },
});
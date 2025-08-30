import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  FlatList,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useColors } from "../theme/useColors";
import { useSavedItems } from "../store/savedItems";
import { goToAddContent } from "../navigation/goTo";

type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseMain">;

export default function DatabaseScreen({ navigation }: Props) {
  const { colors, bg, card, text, muted } = useColors();
  const { items, hydrated } = useSavedItems();
  const [query, setQuery] = React.useState("");

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: "Database" });
  }, [navigation]);

  if (!hydrated) return null;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.title} ${it.flags.join(" ")} ${it.inputPreview}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const renderItem = ({ item }: { item: (typeof items)[number] }) => (
    <Pressable
      onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
      style={[styles.row, card, { borderColor: colors.border }]}
    >
      <Text style={[styles.rowTitle, text]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.rowSub, muted]} numberOfLines={1}>
        {item.verdict} • {item.score}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.screen, bg]}>
      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title / flags / preview"
          placeholderTextColor={muted.color as string}
          style={[styles.search, card, { borderColor: colors.border }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Content */}
      {filtered.length === 0 ? (
        <View style={[styles.emptyCardWrap]}>
          <View style={[styles.emptyCard, card, { borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, text]}>No saved analyses</Text>
            {query ? (
              <Text style={[styles.emptySub, muted]}>
                No results for “{query}”.
              </Text>
            ) : (
              <Text style={[styles.emptySub, muted]}>
                Add your first analysis to get started.
              </Text>
            )}
            <Pressable
              onPress={() => goToAddContent(navigation)}
              style={[styles.cta, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.ctaText}>Add content</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => goToAddContent(navigation)}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        hitSlop={10}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 12 },
  emptyCardWrap: { flex: 1, justifyContent: "center", padding: 16 },
  emptyCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptySub: { fontSize: 14 },
  cta: { marginTop: 4, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  ctaText: { color: "white", fontWeight: "700" },
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
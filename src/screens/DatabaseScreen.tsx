// src/screens/DatabaseScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  TextInput,
  Animated,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useColors } from "../theme/useColors";
import { appEvents } from "../lib/events";

type VerdictFilter = "All" | "Low" | "Medium" | "High";
type SortOrder = "Newest" | "Oldest";
type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseList">;

export default function DatabaseScreen({ navigation }: Props) {
  const { items, hydrated, remove, clearAll } = useSavedItems();
  const { bg, card, text, colors } = useColors();

  const [filter, setFilter] = useState<VerdictFilter>("All");
  const [sort, setSort] = useState<SortOrder>("Newest");
  const [query, setQuery] = useState("");

  // FlatList ref for auto-scroll
  const listRef = useRef<FlatList<SavedAnalysis>>(null);

  // Tiny toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastY = useRef(new Animated.Value(-40)).current;
  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.timing(toastY, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(toastY, { toValue: -40, duration: 160, useNativeDriver: true }).start(() =>
          setToastMsg(null)
        );
      }, 1400);
    });
  };

  useEffect(() => {
    const handler = (_p: { id: string }) => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      showToast("✓ Added to Database");
    };
    appEvents.on("db:saved", handler);
    return () => {
      appEvents.off("db:saved", handler);
    };
  }, []);

  const list = useMemo(() => {
    let arr = items.slice();

    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter((x) => {
        const hay = [x.title, x.inputPreview ?? "", (x.flags || []).join(" ")].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    if (filter !== "All") arr = arr.filter((x) => x.verdict === filter);

    arr.sort((a, b) =>
      sort === "Newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
    return arr;
  }, [items, filter, sort, query]);

  function goToAddContent() {
    const parent = navigation.getParent();
    if (!parent) return;
    (parent as any).navigate("HomeTab", { screen: "AddContent" });
  }

  if (!hydrated) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.muted, text]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, bg]}>
      {/* Toast */}
      {toastMsg ? (
        <Animated.View
          style={[
            styles.toast,
            { transform: [{ translateY: toastY }], backgroundColor: colors.card, borderColor: colors.border },
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.toastText, text]}>{toastMsg}</Text>
        </Animated.View>
      ) : null}

      {/* Search + filters */}
      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title, flags, preview…"
          placeholderTextColor="#999"
          style={[styles.search, card, { borderColor: colors.border }]}
        />

        <View style={styles.row}>
          {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setFilter(v)}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.card },
                filter === v && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.chipText, filter === v ? { color: "white" } : text]}>{v}</Text>
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
                { borderColor: colors.border, backgroundColor: colors.card },
                sort === s && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.chipText, sort === s ? { color: "white" } : text]}>{s}</Text>
            </Pressable>
          ))}

          {list.length > 0 && (
            <Pressable onPress={clearAll} style={styles.clearAll}>
              <Text style={{ color: "#c00", fontWeight: "700" }}>Clear All</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList<SavedAnalysis>
        ref={listRef}
        data={list}
        keyExtractor={(it) => it.id}
        contentContainerStyle={list.length === 0 ? styles.center : { padding: 12 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[styles.title, text]}>No saved analyses yet.</Text>
            <Text style={[styles.muted, { color: colors.text, opacity: 0.6, marginTop: 6 }]}>
              Try adding content from the Home tab or using the + button.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
            onLongPress={() => remove(item.id)}
            style={[styles.card, card, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, text]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardSub, { color: colors.text, opacity: 0.6 }]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={[styles.cardInfo, text]}>
                Score {item.score} — {item.verdict} risk
              </Text>
              <Text style={[styles.cardFlags, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
                Flags: {item.flags.length ? item.flags.join(", ") : "none"}
              </Text>
              {item.inputPreview ? (
                <Text style={[styles.preview, { color: colors.text, opacity: 0.7 }]} numberOfLines={2}>
                  {item.inputPreview}
                </Text>
              ) : null}
            </View>
            {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.thumb} /> : null}
          </Pressable>
        )}
      />

      {/* FAB */}
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
  controls: { paddingHorizontal: 12, paddingTop: 10, gap: 10 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },

  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontWeight: "700" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 18, fontWeight: "700" },
  muted: { fontSize: 14 },

  clearAll: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  cardSub: { fontSize: 12, marginBottom: 4 },
  cardInfo: { fontWeight: "600" },
  cardFlags: { fontSize: 12 },
  preview: { fontSize: 12, marginTop: 6 },
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

  // Toast
  toast: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 10,
  },
  toastText: { fontWeight: "700" },
});
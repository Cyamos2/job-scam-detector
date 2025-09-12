// src/screens/DatabaseScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SectionList,
  RefreshControl,
  Alert,
  Platform,
  ToastAndroid,
  Animated,
  Easing,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../components/Screen";
import JobRow from "../components/JobRow";
import { useJobs } from "../hooks/useJobs";
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortBy = "date" | "title_asc" | "title_desc" | "score_desc" | "score_asc";
type Row = { job: ReturnType<typeof useJobs>["items"][number]; score: number; bucket: Severity };
type Section = { title: Severity; data: Row[] };

export default function DatabaseScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { colors, dark } = useTheme();
  const { items, remove } = useJobs();

  // search / sort
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortBy>("score_desc");

  // pull-to-refresh shim
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // --- SOFT DELETE + UNDO ---
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());
  const [undoId, setUndoId] = React.useState<string | null>(null);
  const undoTimer = React.useRef<NodeJS.Timeout | null>(null);

  // banner/snack for Undo
  const snackY = React.useRef(new Animated.Value(-80)).current;
  const showUndoSnack = () => {
    Animated.sequence([
      Animated.timing(snackY, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(5000),
      Animated.timing(snackY, { toValue: -80, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const confirmDelete = React.useCallback(
    (id: string) => {
      Alert.alert("Delete", "Remove this entry?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // soft-hide in UI
            setHiddenIds((prev) => new Set(prev).add(id));
            setUndoId(id);
            showUndoSnack();

            // schedule actual remove in ~5s
            if (undoTimer.current) clearTimeout(undoTimer.current);
            undoTimer.current = setTimeout(async () => {
              setUndoId(null);
              setHiddenIds((prev) => {
                const next = new Set(prev);
                next.delete(id); // ensure not filtering after real remove (source list updates)
                return next;
              });
              try {
                await remove(id);
                if (Platform.OS === "android") {
                  ToastAndroid.show("Deleted", ToastAndroid.SHORT);
                }
              } catch (e) {
                Alert.alert("Delete failed", String(e ?? "Unknown error"));
              }
            }, 5000);
          },
        },
      ]);
    },
    [remove]
  );

  const undoDelete = React.useCallback(() => {
    if (!undoId) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(undoId);
      return next;
    });
    setUndoId(null);
    Animated.timing(snackY, { toValue: -80, duration: 160, useNativeDriver: true }).start();
    if (Platform.OS === "android") {
      ToastAndroid.show("Undo", ToastAndroid.SHORT);
    }
  }, [undoId, snackY]);

  // --- build sections (bucketed by computed visual bucket) ---
  const sections: Section[] = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows: Row[] = items
      .filter((j) => !hiddenIds.has(j.id))
      .map((j) => {
        const res = scoreJob({
          title: j.title,
          company: j.company,
          url: j.url ?? undefined,
          notes: j.notes ?? undefined,
        });
        return { job: j, score: res.score, bucket: visualBucket(res) };
      });

    if (q) {
      rows = rows.filter(({ job }) => `${job.title} ${job.company}`.toLowerCase().includes(q));
    }

    // sorting
    rows = rows.slice();
    switch (sortBy) {
      case "title_asc":
        rows.sort((a, b) => a.job.title.localeCompare(b.job.title));
        break;
      case "title_desc":
        rows.sort((a, b) => b.job.title.localeCompare(a.job.title));
        break;
      case "score_asc":
        rows.sort((a, b) => a.score - b.score);
        break;
      case "score_desc":
        rows.sort((a, b) => b.score - a.score);
        break;
      case "date":
      default:
        // assuming items are already chronological (persisted order),
        // leave as-is for "Date"
        break;
    }

    const buckets: Record<Severity, Row[]> = { high: [], medium: [], low: [] };
    rows.forEach((r) => buckets[r.bucket].push(r));

    const order: Severity[] = ["high", "medium", "low"];
    return order
      .map((title) => ({ title, data: buckets[title] }))
      .filter((s) => s.data.length > 0);
  }, [items, hiddenIds, search, sortBy]);

  const renderItem = ({ item }: { item: Row }) => {
    const { job, score } = item;
    return (
      <JobRow
        job={job}
        score={score}
        onPress={() => nav.navigate("ReportDetail", { id: job.id })}
        onLongPress={() => confirmDelete(job.id)}
      />
    );
  };

  const SectionHeader = ({ title }: { title: Severity }) => {
    const palette: Record<Severity, { label: string; color: string; bg: string }> = {
      high: { label: "High Risk", color: "#B91C1C", bg: "#FEF2F2" },
      medium: { label: "Medium Risk", color: "#B45309", bg: "#FFF7ED" },
      low: { label: "Low Risk", color: "#047857", bg: "#ECFDF5" },
    };
    const p = palette[title];
    return (
      <View style={[styles.sectionHeader, { backgroundColor: p.bg, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: p.color }]}>{p.label}</Text>
      </View>
    );
  };

  // tiny pill
  const Pill = ({
    active,
    children,
    onPress,
  }: {
    active?: boolean;
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && { color: "#111827" }]}>{children}</Text>
    </Pressable>
  );

  return (
    <Screen>
      {/* Undo banner (iOS + Android) */}
      <Animated.View style={[styles.snack, { transform: [{ translateY: snackY }] }]}>
        <View style={styles.snackInner}>
          <Text style={styles.snackText}>Deleted</Text>
          <Pressable onPress={undoDelete} style={styles.snackUndo}>
            <Text style={styles.snackUndoText}>UNDO</Text>
          </Pressable>
        </View>
      </Animated.View>

      <View style={{ height: insets.top }} />

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by company or role"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.search,
            { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
          ]}
        />
      </View>

      {/* Sort row */}
      <View style={styles.filtersRow}>
        <Text style={{ color: "#6B7280", fontWeight: "800", marginRight: 6 }}>Sort</Text>
        <Pill
          active={sortBy === "score_desc" || sortBy === "score_asc"}
          onPress={() => setSortBy((s) => (s === "score_desc" ? "score_asc" : "score_desc"))}
        >
          Score {sortBy === "score_desc" ? "↓" : "↑"}
        </Pill>
        <Pill active={sortBy === "date"} onPress={() => setSortBy("date")}>
          Date
        </Pill>
        <Pill
          active={sortBy === "title_asc" || sortBy === "title_desc"}
          onPress={() => setSortBy((s) => (s === "title_desc" ? "title_asc" : "title_desc"))}
        >
          {sortBy === "title_desc" ? "Title Z→A" : "Title A→Z"}
        </Pill>
        <Pressable onPress={() => setSearch("")}>
          <Text style={{ color: "#6B7280", fontWeight: "700" }}>Refresh</Text>
        </Pressable>
      </View>

      <SectionList<Row, Section>
        sections={sections}
        keyExtractor={({ job }) => job.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 + insets.bottom }}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>No results.</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => nav.navigate("AddContent")}
        style={[styles.addBtn, { bottom: 24 + insets.bottom, shadowColor: "#000" }]}
        android_ripple={{ color: "#ffffff55", borderless: true }}
      >
        <Text style={styles.addBtnPlus}>＋</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // snack
  snack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    zIndex: 20,
    alignItems: "center",
  },
  snackInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  snackText: { color: "#fff", fontWeight: "700", marginRight: 10 },
  snackUndo: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#2563EB" },
  snackUndoText: { color: "#fff", fontWeight: "800" },

  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },

  filtersRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  pillActive: { borderWidth: 1.2 },
  pillText: { fontWeight: "800", color: "#6B7280" },

  sectionHeader: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: 10, marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "900" },

  addBtn: {
    position: "absolute",
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1f6cff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  addBtnPlus: { color: "#fff", fontSize: 28, lineHeight: 30, fontWeight: "700" },
});
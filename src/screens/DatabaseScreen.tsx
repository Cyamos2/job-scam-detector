// src/screens/DatabaseScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import Screen from "../components/Screen";
import { useJobs } from "../hooks/useJobs";
import { goToAddContent } from "../navigation/goTo";
import type { RootTabParamList } from "../navigation/types";
import type { Job } from "../lib/api"; // types for the editor
import EditJobModal from "../components/EditJobModal";

type RiskFilter = "all" | "low" | "medium" | "high";
const ORANGE = "#FF5733";

export default function DatabaseScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { colors, dark } = useTheme();

  const { items, loading, refresh, update, remove } = useJobs();

  // local UI state
  const [filter, setFilter] = React.useState<RiskFilter>("all");
  const [search, setSearch] = React.useState("");
  const [editor, setEditor] = React.useState<{ visible: boolean; job: Job | null }>({
    visible: false,
    job: null,
  });

  const filtered = React.useMemo(() => {
    let next = items ?? [];
    if (filter !== "all") next = next.filter((j) => j.risk === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q)
      );
    }
    return next;
  }, [items, filter, search]);

  async function openEditor(job: Job) {
    setEditor({ visible: true, job });
  }

  async function onSaved(patch: Partial<Job>) {
    if (!editor.job) return;
    await update(editor.job.id, {
      title: patch.title ?? editor.job.title,
      company: patch.company ?? editor.job.company,
      url: patch.url ?? editor.job.url ?? undefined,
      risk: (patch as any).risk ?? editor.job.risk,
      notes: patch.notes ?? editor.job.notes ?? undefined,
    });
    await refresh();
    setEditor({ visible: false, job: null });
  }

  async function onDelete(job: Job) {
    await remove(job.id);
    await refresh();
  }

  const renderItem = ({ item }: { item: Job }) => (
    <Pressable onPress={() => openEditor(item)}>
      <View
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
          {/* simple risk badge */}
          <View
            style={[
              styles.badge,
              {
                borderColor:
                  item.risk === "high"
                    ? "#ef4444"
                    : item.risk === "medium"
                    ? "#f59e0b"
                    : "#10b981",
                backgroundColor:
                  item.risk === "high"
                    ? (dark ? "#3b0f10" : "#fee2e2")
                    : item.risk === "medium"
                    ? (dark ? "#3b2a10" : "#fef3c7")
                    : (dark ? "#0f2f26" : "#dcfce7"),
              },
            ]}
          >
            <Text
              style={{
                color:
                  item.risk === "high"
                    ? "#b91c1c"
                    : item.risk === "medium"
                    ? "#b45309"
                    : "#047857",
                fontWeight: "700",
                fontSize: 12,
              }}
            >
              {item.risk.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.rowMeta, { color: dark ? "#cbd5e1" : "#6B7280" }]}>
          {item.company} {item.url ? `• ${item.url}` : ""}
        </Text>

        {/* inline row actions */}
        <View style={styles.rowActions}>
          <Pressable onPress={() => openEditor(item)} style={styles.rowBtn}>
            <Text style={styles.rowBtnText}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => onDelete(item)} style={[styles.rowBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
            <Text style={[styles.rowBtnText, { color: "#b91c1c" }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by company or role"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.search,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          returnKeyType="search"
        />

        <View style={styles.chips}>
          {(["all", "low", "medium", "high"] as const).map((r) => {
            const active = filter === r;
            return (
              <Pressable
                key={r}
                onPress={() => setFilter(r)}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && {
                    borderColor: ORANGE,
                    backgroundColor: dark ? "#261512" : "#fff4f1",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.text },
                    active && { color: ORANGE },
                  ]}
                >
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={refresh} style={styles.refresh}>
            <Text
              style={[
                styles.refreshText,
                { color: dark ? "#cbd5e1" : "#6B7280" },
              ]}
            >
              Refresh
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && { flex: 1, justifyContent: "center" },
        ]}
        refreshControl={
          <RefreshControl refreshing={!!loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No items
            </Text>
            <Pressable
              onPress={() => goToAddContent(navigation)}
              style={[styles.addContentBtn, { backgroundColor: "#1f6cff" }]}
            >
              <Text style={styles.addContentText}>Add content</Text>
            </Pressable>
          </View>
        }
      />

      <Pressable
        onPress={() => goToAddContent(navigation)}
        style={styles.fab}
      >
        <Text style={styles.fabText}>Add</Text>
      </Pressable>

      {/* EDITOR MODAL */}
      <EditJobModal
        visible={editor.visible}
        job={editor.job}
        onClose={() => setEditor({ visible: false, job: null })}
        onSaved={onSaved} // ✅ correct prop name
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 0, gap: 10 },
  search: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontWeight: "700" },
  refresh: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 },
  refreshText: { fontWeight: "600" },

  listContent: { paddingVertical: 10, gap: 10 },
  row: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  rowTitle: { fontWeight: "700" },
  rowMeta: {},
  rowActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  rowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eff6ff",
  },
  rowBtnText: { color: "#1d4ed8", fontWeight: "700" },

  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  addContentBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  addContentText: { color: "#fff", fontWeight: "700" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 28,
    backgroundColor: "#1f6cff",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "800" },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
});
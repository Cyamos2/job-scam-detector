import * as React from "react";
import { View, FlatList, Text, Pressable, Alert, Image } from "react-native";
import { useJobs } from "../hooks/useJobs";
import { FilterBar } from "../components/FilterBar";
import EditJobModal from "../components/EditJobModal";
import ImageViewer from "../components/ImageViewer";
import { api } from "../lib/api";
import * as FileSystem from "expo-file-system";

export type EditPayload = {
  title?: string;
  company?: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  url?: string | null;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
};

function EmptyState({ risk, onAdd }: { risk: string; onAdd: () => void }) {
  return (
    <View style={{ padding: 28, alignItems: "center", gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: "700" }}>
        {risk !== "ALL" ? `No ${risk} items` : "No items"}
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          backgroundColor: "#2f6fed",
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 999,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Add content</Text>
      </Pressable>
    </View>
  );
}

export default function DatabaseScreen() {
  const { items, loading, error, risk, setRisk, search, setSearch, refresh } = useJobs();

  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const ids = React.useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const inSelectMode = ids.length > 0;

  const [editId, setEditId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [viewerUri, setViewerUri] = React.useState<string | null>(null);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const onLongPress = (id: string) => setSelected({ [id]: true });
  const onItemPress = (id: string) => (inSelectMode ? toggle(id) : setEditId(id));

  const onDelete = async () => {
    try {
      if (ids.length === 1) {
        await api.remove(ids[0]);
      } else {
        // remove many without relying on api.bulkDelete typings
        for (const id of ids) {
          // eslint-disable-next-line no-await-in-loop
          await api.remove(id);
        }
      }
      setSelected({});
      refresh();
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message ?? "Unknown error");
    }
  };

  const onSaveEdit = async (data: EditPayload) => {
    try {
      if (!editId) return;
      await api.update(editId, data);
      setEditId(null);
      refresh();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  };

  const onSaveCreate = async (data: EditPayload) => {
    try {
      await api.create({
        title: data.title!,
        company: data.company!,
        risk: data.risk,
        score: data.score,
        url: data.url ?? null,
        email: data.email ?? null,
        source: data.source ?? null,
        notes: data.notes ?? null,
        images: [],
      });
      setShowCreate(false);
      refresh();
    } catch (e: any) {
      Alert.alert("Add failed", e?.message ?? "Unknown error");
    }
  };

  const shareSelected = async () => {
    try {
      const picked = items.filter((j) => selected[j.id]);
      if (!picked.length) return;

      const text = picked
        .map(
          (j) =>
            `${j.title} — ${j.company}\nRisk: ${j.risk}  Score: ${j.score}\n${j.url ?? ""}\n${j.notes ?? ""}\n`
        )
        .join("\n");

      const path = FileSystem.cacheDirectory + "jobs.txt";
      await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });

      // optional dependency
      // @ts-ignore
      const Sharing = await import("expo-sharing").catch(() => null as any);
      if (Sharing?.isAvailableAsync && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert("Shared file", `Saved to: ${path}`);
      }
    } catch (e: any) {
      Alert.alert("Share failed", e?.message ?? "Unknown error");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FilterBar risk={risk} setRisk={setRisk} search={search} setSearch={setSearch} onRefresh={refresh} />

      {!!error && (
        <View style={{ padding: 12 }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 96 }}
        refreshing={loading}
        onRefresh={refresh}
        renderItem={({ item }) => {
          const isSel = !!selected[item.id];
          const thumb = item.images?.[0]?.uri;
          return (
            <Pressable
              onLongPress={() => onLongPress(item.id)}
              onPress={() => onItemPress(item.id)}
              style={{
                backgroundColor: isSel ? "#eaf0ff" : "white",
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: isSel ? "#2f6fed" : "#eee",
              }}
            >
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                {thumb ? (
                  <Pressable onPress={() => setViewerUri(thumb)}>
                    <Image
                      source={{ uri: thumb }}
                      style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: "#ddd" }}
                    />
                  </Pressable>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700" }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1}>{item.company}</Text>
                  <Text style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Risk: {item.risk} • Score: {item.score}
                  </Text>
                </View>
              </View>

              {inSelectMode && (
                <Text style={{ position: "absolute", right: 12, top: 12 }}>{isSel ? "☑︎" : "☐"}</Text>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={!loading ? <EmptyState risk={risk} onAdd={() => setShowCreate(true)} /> : null}
      />

      {/* Floating Add button */}
      <Pressable
        onPress={() => setShowCreate(true)}
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          backgroundColor: "#2f6fed",
          borderRadius: 28,
          paddingHorizontal: 20,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Add</Text>
      </Pressable>

      {/* Selection action bar */}
      {inSelectMode && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: "row",
            gap: 12,
            padding: 12,
            borderTopWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
          }}
        >
          <Pressable
            onPress={() => ids.length === 1 && setEditId(ids[0])}
            disabled={ids.length !== 1}
            style={{ opacity: ids.length === 1 ? 1 : 0.4 }}
          >
            <Text style={{ fontWeight: "600" }}>Edit</Text>
          </Pressable>
          <Pressable onPress={shareSelected} disabled={!ids.length} style={{ opacity: ids.length ? 1 : 0.4 }}>
            <Text style={{ fontWeight: "600" }}>Share</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert("Delete", `Delete ${ids.length} item(s)?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ])
            }
          >
            <Text style={{ color: "#d00", fontWeight: "600" }}>Delete</Text>
          </Pressable>
          <Pressable onPress={() => setSelected({})} style={{ marginLeft: "auto" }}>
            <Text>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* View/Edit modal — use jobId, no `job` prop */}
      <EditJobModal
        visible={!!editId}
        jobId={editId ?? undefined}
        onClose={() => setEditId(null)}
        onSave={onSaveEdit}
      />

      {/* Create modal — no `mode` prop required */}
      <EditJobModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={onSaveCreate}
      />

      <ImageViewer uri={viewerUri ?? ""} visible={!!viewerUri} onClose={() => setViewerUri(null)} />
    </View>
  );
}
import * as React from "react";
import { View, FlatList, Text, Pressable, Alert } from "react-native";
import { useJobs } from "../hooks/useJobs";
import { FilterBar } from "../components/FilterBar";
import { EditJobModal, EditPayload } from "../components/EditJobModal";
import { api } from "../lib/api";

export default function DatabaseScreen() {
  const { items, loading, error, risk, setRisk, search, setSearch, refetch } = useJobs();

  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [editId, setEditId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);

  const ids = React.useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected]);
  const inSelectMode = ids.length > 0;

  const toggle = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const onLongPress = (id: string) => setSelected({ [id]: true });

  const onItemPress = (id: string) => {
    if (inSelectMode) return toggle(id);
    setEditId(id); // open view/edit
  };

  const onDelete = async () => {
    try {
      if (ids.length === 1) await api.remove(ids[0]);
      else await api.bulkDelete(ids);
      setSelected({});
      refetch();
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message ?? "Unknown error");
    }
  };

  const onSaveEdit = async (data: EditPayload) => {
    try {
      if (!editId) return;
      await api.update(editId, data);
      setEditId(null);
      refetch();
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
      refetch();
    } catch (e: any) {
      Alert.alert("Add failed", e?.message ?? "Unknown error");
    }
  };

  const ActionBar = () => (
    <View style={{ flexDirection: "row", gap: 12, padding: 12, borderTopWidth: 1, borderColor: "#eee", backgroundColor: "#fff" }}>
      <Pressable onPress={() => ids.length === 1 && setEditId(ids[0])} disabled={ids.length !== 1} style={{ opacity: ids.length === 1 ? 1 : 0.4 }}>
        <Text style={{ fontWeight: "600" }}>Edit</Text>
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
  );

  return (
    <View style={{ flex: 1 }}>
      <FilterBar risk={risk} setRisk={setRisk} search={search} setSearch={setSearch} onRefresh={refetch} />

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
        onRefresh={refetch}
        renderItem={({ item }) => {
          const isSel = !!selected[item.id];
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
              <Text style={{ fontWeight: "700" }}>{item.title}</Text>
              <Text>{item.company}</Text>
              <Text style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                Risk: {item.risk} • Score: {item.score}
              </Text>
              {inSelectMode && (
                <Text style={{ position: "absolute", right: 12, top: 12 }}>
                  {isSel ? "☑︎" : "☐"}
                </Text>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text>No {risk !== "ALL" ? `${risk} ` : ""}items</Text>
            </View>
          ) : null
        }
      />

      {/* Add floating button */}
      <Pressable
        onPress={() => setShowCreate(true)}
        style={{
          position: "absolute", right: 20, bottom: 20,
          backgroundColor: "#2f6fed", borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14,
          shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Add</Text>
      </Pressable>

      {inSelectMode && <ActionBar />}

      {/* View/Edit modal */}
      <EditJobModal
        visible={!!editId}
        job={items.find((j) => j.id === editId)}
        onClose={() => setEditId(null)}
        onSave={onSaveEdit}
      />

      {/* Create modal */}
      <EditJobModal
        visible={showCreate}
        mode="create"
        onClose={() => setShowCreate(false)}
        onSave={onSaveCreate}
      />
    </View>
  );
}
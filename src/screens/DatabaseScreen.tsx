import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { analyzeText } from "../lib/analyzer";
import { useColors } from "../theme/useColors";

type VerdictFilter = "All" | "Low" | "Medium" | "High";
type SortOrder = "Newest" | "Oldest";
type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseList">;

export default function DatabaseScreen({ navigation }: Props) {
  const { items, hydrated, remove, clearAll, add } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  const [filter, setFilter] = useState<VerdictFilter>("All");
  const [sort, setSort] = useState<SortOrder>("Newest");

  // Submit Report modal state
  const [showForm, setShowForm] = useState(false);
  const [company, setCompany] = useState("");
  const [input, setInput] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    let arr = items.slice();
    if (filter !== "All") arr = arr.filter((x) => x.verdict === filter);
    arr.sort((a, b) => (sort === "Newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
    return arr;
  }, [items, filter, sort]);

  const pickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to pick a screenshot.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      selectionLimit: 1,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (asset?.uri) setImageUri(asset.uri);
  };

  const resetForm = () => {
    setCompany("");
    setInput("");
    setNotes("");
    setImageUri(null);
  };

  const submitReport = async () => {
    const raw = input.trim();
    if (!company.trim() && !raw && !imageUri) {
      Alert.alert("Add something first", "Enter text/link, company, or attach a screenshot.");
      return;
    }
    try {
      setBusy(true);
      const analysis = analyzeText(raw);
      const flags = notes.trim() ? [...analysis.flags, "note"] : analysis.flags;

      const entry: SavedAnalysis = {
        id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6),
        title: company.trim() ? company.trim() : imageUri ? "Screenshot report" : previewOf(raw) || "Text report",
        source: imageUri ? "image" : "text",
        inputPreview: previewOf(raw),
        imageUri,
        score: analysis.score,
        verdict: analysis.verdict,
        flags,
        createdAt: Date.now(),
      };
      add(entry);
      setShowForm(false);
      resetForm();
      Alert.alert("Saved", "Report submitted to your Database.");
    } finally {
      setBusy(false);
    }
  };

  if (!hydrated) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.muted, muted]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, bg]}>
      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.row}>
          {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((v) => (
            <Pressable key={v} onPress={() => setFilter(v)} style={[styles.chip, card, filter === v && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={[styles.chipText, filter === v ? { color: "white" } : text]}>{v}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          {(["Newest", "Oldest"] as SortOrder[]).map((s) => (
            <Pressable key={s} onPress={() => setSort(s)} style={[styles.chip, card, sort === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={[styles.chipText, sort === s ? { color: "white" } : text]}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {list.length > 0 && (
        <Pressable onPress={clearAll} style={styles.clearAll}>
          <Text style={{ color: "#c00", fontWeight: "700" }}>Clear All</Text>
        </Pressable>
      )}

      {/* List */}
      <FlatList<SavedAnalysis>
        data={list}
        keyExtractor={(it) => it.id}
        contentContainerStyle={list.length === 0 ? styles.center : { padding: 12 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[styles.title, text]}>Database</Text>
            <Text style={[styles.muted, muted]}>No saved analyses yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
            onLongPress={() => remove(item.id)}
            style={[styles.card, card]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, text]}>{item.title}</Text>
              <Text style={[styles.cardSub, muted]}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={[styles.cardInfo, text]}>
                Score {item.score} — {item.verdict} risk
              </Text>
              <Text style={[styles.cardFlags, muted]} numberOfLines={1}>
                Flags: {item.flags.length ? item.flags.join(", ") : "none"}
              </Text>
              {item.inputPreview ? <Text style={[styles.preview, muted]} numberOfLines={2}>{item.inputPreview}</Text> : null}
            </View>
            {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.thumb} /> : null}
          </Pressable>
        )}
      />

      {/* Floating Add button */}
      <Pressable accessibilityLabel="Add to Database" onPress={() => setShowForm(true)} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      {/* Submit Report modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, card]}>
            <Text style={[styles.modalTitle, text]}>Submit Report</Text>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <TextInput
                style={[styles.input, card, text]}
                placeholder="Company or title (optional)"
                placeholderTextColor={muted.color as string}
                value={company}
                onChangeText={setCompany}
              />
              <TextInput
                style={[styles.input, card, text, { height: 120, textAlignVertical: "top" }]}
                placeholder="Paste job text or a link (https://…)"
                placeholderTextColor={muted.color as string}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TextInput
                style={[styles.input, card, text, { height: 80, textAlignVertical: "top" }]}
                placeholder="Notes (optional, not used for scoring)"
                placeholderTextColor={muted.color as string}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              {imageUri ? (
                <View style={{ gap: 8 }}>
                  <Image source={{ uri: imageUri }} style={styles.formImage} />
                  <View style={styles.row}>
                    <Pressable onPress={() => setImageUri(null)} style={styles.linkBtn}>
                      <Text style={[styles.linkBtnText, { color: colors.primary }]}>Remove screenshot</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={pickScreenshot} style={styles.linkBtn}>
                  <Text style={[styles.linkBtnText, { color: colors.primary }]}>Attach screenshot</Text>
                </Pressable>
              )}

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  style={[styles.cancelBtn, card]}
                >
                  <Text style={[styles.cancelText, text]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={submitReport} style={[styles.submitBtn, { backgroundColor: colors.primary }]} disabled={busy}>
                  {busy ? <ActivityIndicator /> : <Text style={styles.submitText}>Save</Text>}
                </Pressable>
              </View>
              <Text style={[styles.muted, muted]}>Long-press an item in the list to delete it.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function previewOf(text: string, n: number = 120): string {
  const t = (text || "").trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: 12, paddingTop: 10, gap: 10 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  muted: { opacity: 0.7 },

  clearAll: { alignSelf: "flex-end", padding: 10 },

  card: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  cardSub: { fontSize: 12, opacity: 0.6, marginBottom: 4 },
  cardInfo: { fontWeight: "600" },
  cardFlags: { fontSize: 12, opacity: 0.8 },
  preview: { fontSize: 12, opacity: 0.7, marginTop: 6 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#ddd" },

  // FAB
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
    elevation: 4,
  },
  fabText: { color: "white", fontSize: 28, fontWeight: "700", lineHeight: 30 },

  // Modal form
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 12, borderWidth: 1, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, backgroundColor: "transparent" },
  linkBtn: { alignSelf: "flex-start", padding: 6 },
  linkBtnText: { fontWeight: "700" },
  formImage: { width: "100%", height: 220, borderRadius: 10, backgroundColor: "#ddd" },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  cancelText: { fontWeight: "600" },
  submitBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  submitText: { color: "white", fontWeight: "700" },
});
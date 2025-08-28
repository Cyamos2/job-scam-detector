import React, { useMemo, useState, useRef } from "react";
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
import { Swipeable } from "react-native-gesture-handler";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type VerdictFilter = "All" | "Low" | "Medium" | "High";
type SortOrder = "Newest" | "Oldest";
type Props = NativeStackScreenProps<DatabaseStackParamList, "DatabaseList">;

export default function DatabaseScreen({ navigation }: Props) {
  const { items, hydrated, remove, clearAll, add } = useSavedItems();
  const { bg, card, text, muted, colors, border } = useColors();

  const [filter, setFilter] = useState<VerdictFilter>("All");
  const [sort, setSort] = useState<SortOrder>("Newest");
  const [q, setQ] = useState("");

  // Submit Report modal state
  const [showForm, setShowForm] = useState(false);
  const [company, setCompany] = useState("");
  const [input, setInput] = useState("");
  theNotes;
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // counts for chips
  const counts = useMemo(() => {
    const c = { Low: 0, Medium: 0, High: 0 };
    for (const it of items) c[it.verdict as "Low" | "Medium" | "High"]++;
    return c;
  }, [items]);

  // filtered/sorted/searched list
  const list = useMemo(() => {
    let arr = items.slice();

    if (filter !== "All") arr = arr.filter((x) => x.verdict === filter);

    const query = q.trim().toLowerCase();
    if (query) {
      arr = arr.filter((x) => {
        const hay =
          `${x.title} ${x.flags.join(" ")} ${x.inputPreview ?? ""}`.toLowerCase();
        return hay.includes(query);
      });
    }

    arr.sort((a, b) =>
      sort === "Newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
    return arr;
  }, [items, filter, sort, q]);

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
      const analysis = analyzeTextLocal(raw);
      const flags = notes.trim() ? [...analysis.flags, "note"] : analysis.flags;

      const entry: SavedAnalysis = {
        id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6),
        title: company.trim()
          ? company.trim()
          : imageUri
          ? "Screenshot report"
          : previewOf(raw) || "Text report",
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
        <Text style={[styles.mutedCenter, muted]}>Loading…</Text>
      </View>
    );
  }

  const renderRightActions = (id: string) => (
    <Pressable
      onPress={() =>
        Alert.alert("Delete report?", "This cannot be undone.", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => remove(id) },
        ])
      }
      style={styles.swipeDelete}
    >
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </Pressable>
  );

  return (
    <View style={[{ flex: 1 }, bg]}>
      {/* Search */}
      <View style={[styles.searchRow]}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search reports, flags, notes…"
          placeholderTextColor={(muted.color as string) || "#999"}
          style={[styles.searchInput, card, text, border]}
        />
        {q ? (
          <Pressable onPress={() => setQ("")} style={[styles.clearChip, card, border]}>
            <Text style={text}>×</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Filter chips */}
      <View style={styles.controls}>
        <View style={styles.row}>
          {(["All", "Low", "Medium", "High"] as VerdictFilter[]).map((v) => {
            const num =
              v === "All" ? items.length : v === "Low" ? counts.Low : v === "Medium" ? counts.Medium : counts.High;
            const active = filter === v;
            return (
              <Pressable
                key={v}
                onPress={() => setFilter(v)}
                style={[styles.chip, card, border, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.chipText, active ? { color: "white" } : text]}>
                  {v} {num ? `(${num})` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.row}>
          {(["Newest", "Oldest"] as SortOrder[]).map((s) => {
            const active = sort === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSort(s)}
                style={[styles.chip, card, border, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.chipText, active ? { color: "white" } : text]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Clear All (only when items present and not searching) */}
      {items.length > 0 && !q && (
        <Pressable onPress={clearAll} style={styles.clearAll}>
          <Text style={{ color: "#c00", fontWeight: "700" }}>Clear All</Text>
        </Pressable>
      )}

      {/* List / Empty state */}
      {list.length === 0 ? (
        <View style={[styles.empty, bg]}>
          <Text style={[styles.emptyEmoji]}>🗂️</Text>
          <Text style={[styles.title, text]}>Database</Text>
          <Text style={[styles.emptySub, muted]}>
            No saved analyses yet{q ? " (after filtering)" : ""}.
          </Text>
          {!q && (
            <Pressable onPress={() => setShowForm(true)} style={[styles.ctaBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "white", fontWeight: "700" }}>Add your first report</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList<SavedAnalysis>
          data={list}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
              <Pressable
                onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
                onLongPress={() => remove(item.id)}
                style={[styles.card, card, border]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, text]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.cardSub, muted]}>{new Date(item.createdAt).toLocaleString()}</Text>
                  <Text style={[styles.cardInfo, text]}>
                    Score {item.score} — {item.verdict} risk
                  </Text>
                  <Text style={[styles.cardFlags, muted]} numberOfLines={1}>
                    Flags: {item.flags.length ? item.flags.join(", ") : "none"}
                  </Text>
                  {item.inputPreview ? (
                    <Text style={[styles.preview, muted]} numberOfLines={2}>
                      {item.inputPreview}
                    </Text>
                  ) : null}
                </View>
                {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.thumb} /> : null}
              </Pressable>
            </Swipeable>
          )}
        />
      )}

      {/* Floating Add button */}
      <Pressable accessibilityLabel="Add to Database" onPress={() => setShowForm(true)} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      {/* Submit Report modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, card, border]}>
            <Text style={[styles.modalTitle, text]}>Submit Report</Text>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <TextInput
                style={[styles.input, card, border, text]}
                placeholder="Company or title (optional)"
                placeholderTextColor={(muted.color as string) || "#999"}
                value={company}
                onChangeText={setCompany}
              />
              <TextInput
                style={[styles.input, card, border, text, { height: 120, textAlignVertical: "top" }]}
                placeholder="Paste job text or a link (https://…)"
                placeholderTextColor={(muted.color as string) || "#999"}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TextInput
                style={[styles.input, card, border, text, { height: 80, textAlignVertical: "top" }]}
                placeholder="Notes (optional, not used for scoring)"
                placeholderTextColor={(muted.color as string) || "#999"}
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
                <Pressable onPress={() => { setShowForm(false); resetForm(); }} style={[styles.cancelBtn, card, border]}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={submitReport} style={[styles.submitBtn, { backgroundColor: colors.primary }]} disabled={busy}>
                  {busy ? <ActivityIndicator /> : <Text style={styles.submitText}>Save</Text>}
                </Pressable>
              </View>
              <Text style={[styles.help, muted]}>Tip: long-press a row or swipe left to delete.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Analyzer (same heuristics as before) */
function analyzeTextLocal(raw: string) {
  const text = (raw || "").toLowerCase();
  const patterns: Array<[RegExp, number, string]> = [
    [/whats\s*app|telegram|signal/, 25, "whatsapp/telegram/signal contact"],
    [/gift\s*card|apple\s*card|steam\s*card/, 35, "gift card payment"],
    [/crypto|bitcoin|usdt|binance/, 20, "crypto payment"],
    [/wire\s*transfer|western\s*union|moneygram/, 15, "wire/transfer payment"],
    [/pay.*upfront|training\s*fee|equipment\s*fee|deposit\s*for\s*(kit|equipment)/, 30, "upfront/training/equipment fee"],
    [/\bearn\b.*\$\s?\d{3,}|\$\s?\d{3,}\s*per\s*(day|hour|90\s*minutes)/, 20, "unrealistic pay"],
    [/(no|little)\s*experience\s*required|work\s*60\s*to\s*90\s*minutes/i, 10, "too-easy workload"],
    [/gmail\.com|outlook\.com|yahoo\.com\s*(hr|recruit)/, 10, "non-corporate email"],
    [/\binterview\b.*(whatsapp|telegram|sms)/, 20, "chat-app interview"],
    [/\bverify\b.*(code|otp) via (sms|whatsapp)/, 15, "OTP via chat"],
  ];
  let score = 0;
  const flags: string[] = [];
  for (const [re, pts, label] of patterns) if (re.test(text)) { score += pts; flags.push(label); }
  const urlMatch = text.match(/https?:\/\/[^\s)]+/g);
  if (urlMatch)
    for (const url of urlMatch) {
      try {
        const u = new URL(url);
        if (/\.(top|xyz|live|shop|work|site)$/i.test(u.hostname) || /-career|careers?-?[0-9]{3,}/i.test(u.hostname)) {
          score += 10;
          flags.push("suspicious domain");
        }
      } catch {}
    }
  score = Math.max(0, Math.min(100, score));
  const verdict: SavedAnalysis["verdict"] = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
  return { score, verdict, flags: Array.from(new Set(flags)) };
}

function previewOf(text: string, n = 120) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}

const styles = StyleSheet.create({
  // top controls
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 10 },
  searchInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  clearChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },

  controls: { paddingHorizontal: 12, paddingTop: 10, gap: 10 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontWeight: "700" },

  // empty state
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  emptyEmoji: { fontSize: 44, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "800" },
  emptySub: { fontSize: 14, opacity: 0.7, marginBottom: 10 },
  ctaBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },

  // misc text helpers
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  mutedCenter: { opacity: 0.7 },

  clearAll: { alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 8 },

  // cards
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardTitle: { fontWeight: "800", fontSize: 16 },
  cardSub: { fontSize: 12, opacity: 0.7, marginBottom: 4 },
  cardInfo: { fontWeight: "700" },
  cardFlags: { fontSize: 12, opacity: 0.8 },
  preview: { fontSize: 12, opacity: 0.7, marginTop: 6 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#ddd" },

  // swipe to delete
  swipeDelete: {
    alignItems: "center",
    justifyContent: "center",
    width: 88,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: "#e53935",
  },
  swipeDeleteText: { color: "white", fontWeight: "800" },

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

  // modal form
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 12, borderWidth: 1, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, backgroundColor: "transparent" },
  linkBtn: { alignSelf: "flex-start", padding: 6 },
  linkBtnText: { fontWeight: "700" },
  formImage: { width: "100%", height: 220, borderRadius: 10, backgroundColor: "#ddd" },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  cancelText: { fontWeight: "700" },
  submitBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  submitText: { color: "white", fontWeight: "800" },
  help: { fontSize: 12, marginTop: 4 },
});
import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useSettings } from "../SettingsProvider";

type AnalysisResult = {
  score: number;
  verdict: "Low" | "Medium" | "High";
  flags: string[];
};

export default function AddContentScreen({ navigation }: { navigation: any }) {
  const [input, setInput] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { add } = useSavedItems();
  const { autoSave, setAutoSave, sensitivity, setSensitivity } = useSettings();
  const [showOptions, setShowOptions] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setShowOptions(true)}
          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: "700", color: "#1b72e8" }}>Options</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const onAnalyzeText = () => {
    const text = input.trim();
    if (!text)
      return Alert.alert("Nothing to analyze", "Paste a job post or link first.");
    const a = analyzeTextLocal(text);
    setResult(a);
    if (autoSave) saveEntry(a);
  };

  const onPickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert("Permission needed", "Allow photo access to pick a screenshot.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      selectionLimit: 1,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    setImageUri(asset.uri);
    setResult(null);
  };

  const analyzeScreenshot = async () => {
    if (!imageUri) return Alert.alert("No screenshot", "Pick a screenshot first.");
    try {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 250)); // stub “OCR”
      const fakeOCR =
        "Contact us via WhatsApp and pay for training with gift cards.";
      const a = analyzeTextLocal(fakeOCR + " " + (input ?? ""));
      setResult(a);
      if (autoSave) saveEntry(a);
    } finally {
      setBusy(false);
    }
  };

  const saveEntry = (a: AnalysisResult) => {
    const entry: SavedAnalysis = {
      id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6),
      title: buildTitle(input, imageUri),
      source: imageUri ? "image" : "text",
      inputPreview: previewOf(input),
      imageUri,
      score: a.score,
      verdict: a.verdict,
      flags: a.flags,
      createdAt: Date.now(),
    };
    add(entry);
  };

  const saveCurrentManually = () => {
    if (!result) return;
    saveEntry(result);
    Alert.alert("Saved", "Analysis added to your Database tab.");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.panelTitle}>Add Content</Text>

        <TextInput
          style={styles.input}
          placeholder="Paste job text or link (https://…)"
          value={input}
          onChangeText={(t) => {
            setInput(t);
            setResult(null);
          }}
          multiline
          scrollEnabled
        />

        <View style={styles.row}>
          <Pressable onPress={onAnalyzeText} style={styles.actionBtn}>
            <Text style={styles.actionText}>Analyze Text/Link</Text>
          </Pressable>
          <Pressable onPress={onPickScreenshot} style={styles.actionBtn}>
            <Text style={styles.actionText}>Pick Screenshot</Text>
          </Pressable>
        </View>

        {imageUri && (
          <View style={styles.previewBox}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <Pressable
              onPress={analyzeScreenshot}
              style={[styles.actionBtn, styles.primaryBtn]}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <Text style={[styles.actionText, styles.primaryText]}>
                  Analyze Screenshot
                </Text>
              )}
            </Pressable>
            <Pressable onPress={() => setImageUri(null)} style={styles.clearBtn}>
              <Text style={styles.clearText}>Remove screenshot</Text>
            </Pressable>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Analysis</Text>
            <Text style={styles.resultScore}>
              Score: {result.score} — {result.verdict} risk
            </Text>
            <Text style={styles.resultFlags}>
              Flags: {result.flags.length ? result.flags.join(", ") : "none"}
            </Text>

            {!autoSave && (
              <Pressable onPress={saveCurrentManually} style={[styles.actionBtn, styles.saveBtn]}>
                <Text style={[styles.actionText, styles.saveText]}>
                  Save to Database
                </Text>
              </Pressable>
            )}
            {autoSave && <Text style={styles.autoSaveNote}>Saved automatically ✓</Text>}
          </View>
        )}

        <Text style={styles.hint}>
          Tip: LinkedIn/Indeed URL or raw message text both work.
        </Text>
      </ScrollView>

      {/* Options modal */}
      <Modal
        visible={showOptions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Options</Text>

            <View style={styles.optRow}>
              <Text style={styles.optLabel}>Auto-save analyses</Text>
              <Switch value={autoSave} onValueChange={setAutoSave} />
            </View>

            <View style={styles.optBlock}>
              <Text style={styles.optLabel}>Sensitivity: {sensitivity}</Text>
              <View style={styles.row}>
                <Pressable
                  onPress={() => setSensitivity(Math.max(0, sensitivity - 10))}
                  style={styles.smallBtn}
                >
                  <Text style={styles.btnText}>-10</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSensitivity(Math.max(0, sensitivity - 5))}
                  style={styles.smallBtn}
                >
                  <Text style={styles.btnText}>-5</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSensitivity(Math.min(100, sensitivity + 5))}
                  style={styles.smallBtn}
                >
                  <Text style={styles.btnText}>+5</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSensitivity(Math.min(100, sensitivity + 10))}
                  style={styles.smallBtn}
                >
                  <Text style={styles.btnText}>+10</Text>
                </Pressable>
              </View>
              <Text style={styles.muted}>
                Higher = stricter risk flagging (used by future analyzers).
              </Text>
            </View>

            <Pressable
              onPress={() => setShowOptions(false)}
              style={[styles.actionBtn, styles.primaryBtn, { alignSelf: "flex-end" }]}
            >
              <Text style={[styles.actionText, styles.primaryText]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function buildTitle(text: string, imageUri: string | null): string {
  if (imageUri) return "Screenshot analysis";
  const first = previewOf(text);
  return first ? first : "Text analysis";
}

function previewOf(text: string, n: number = 120): string {
  const t = (text || "").trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function analyzeTextLocal(raw: string): AnalysisResult {
  const text = raw.toLowerCase();
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
        if (
          /\.(top|xyz|live|shop|work|site)$/i.test(u.hostname) ||
          /-career|careers?-?[0-9]{3,}/i.test(u.hostname)
        ) {
          score += 10;
          flags.push("suspicious domain");
        }
      } catch {}
    }
  score = Math.max(0, Math.min(100, score));
  const verdict: AnalysisResult["verdict"] =
    score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
  return { score, verdict, flags: Array.from(new Set(flags)) };
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 18, paddingBottom: 40 },
  panelTitle: { fontSize: 16, fontWeight: "700" },
  input: {
    height: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "white",
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: { backgroundColor: "#eee", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  actionText: { fontWeight: "600" },
  previewBox: { gap: 10, marginTop: 10 },
  preview: { width: "100%", height: 220, borderRadius: 10, backgroundColor: "#ddd" },
  primaryBtn: { backgroundColor: "#1b72e8" },
  primaryText: { color: "white", fontWeight: "700" },
  clearBtn: { alignSelf: "flex-start", padding: 6 },
  clearText: { color: "#c00", fontWeight: "600" },
  resultCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    gap: 6,
  },
  resultTitle: { fontSize: 16, fontWeight: "700" },
  resultScore: { fontSize: 14, fontWeight: "600" },
  resultFlags: { fontSize: 13, opacity: 0.8 },
  saveBtn: { backgroundColor: "#1b72e8" },
  saveText: { color: "white", fontWeight: "700" },
  autoSaveNote: { fontSize: 12, color: "#1b72e8", marginTop: 6 },

  // options modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "white", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  optRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optBlock: { gap: 8 },
  optLabel: { fontWeight: "600" },
  smallBtn: { backgroundColor: "#eee", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText: { fontWeight: "600" },
  muted: { fontSize: 12, opacity: 0.6 },
});
// src/screens/AddContentScreen.tsx
import * as React from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSettings } from "../SettingsProvider";
import { useColors } from "../theme/useColors";
import { analyzeTextLocal, type AnalysisResult } from "../lib/analyzer";
import { api } from "../lib/api";

function useDebounced<T extends (...a: any[]) => any>(fn: T, ms = 300) {
  const ref = React.useRef<NodeJS.Timeout | null>(null);
  return React.useCallback((...args: Parameters<T>) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]);
}

type Props = { navigation: any };

export default function AddContentScreen({ navigation }: Props) {
  const { colors, bg, card, text, muted } = useColors();
  const { sensitivity } = useSettings();

  const [input, setInput] = React.useState("");
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable onPress={() => navigation.getParent()?.navigate("HomeTab" as never)} hitSlop={10}
          style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>‹ Home</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => Alert.alert("Options", "More options coming soon.")}
          style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Options</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.primary]);

  const runAnalyzeText = React.useCallback(() => {
    const raw = input.trim();
    if (!raw) return Alert.alert("Nothing to analyze", "Paste a job post or link first.");
    const a = analyzeTextLocal(raw, sensitivity);
    setResult(a);
  }, [input, sensitivity]);
  const onAnalyzeText = useDebounced(runAnalyzeText, 250);

  const pickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Allow photo access to pick a screenshot.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1, selectionLimit: 1,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (asset?.uri) {
      setImageUri(asset.uri);
      setResult(null);
    }
  };

  const analyzeScreenshot = async () => {
    if (!imageUri) return Alert.alert("No screenshot", "Pick a screenshot first.");
    try {
      setBusy(true);
      // stub OCR
      await new Promise((r) => setTimeout(r, 200));
      const stub =
        "paid daily guaranteed monthly income 60 minutes training phone +123456789 whatsapp gift cards";
      const a = analyzeTextLocal(`${stub} ${input}`, sensitivity);
      setResult(a);
    } finally {
      setBusy(false);
    }
  };

  function extractUrl(t: string): string | null {
    const m = (t || "").match(/https?:\/\/\S+/i);
    return m ? m[0] : null;
  }
  function extractEmail(t: string): string | null {
    const m = (t || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m ? m[0] : null;
  }
  function titleFrom(text: string) {
    const t = (text || "").trim().replace(/\s+/g, " ");
    return t.length > 40 ? t.slice(0, 40) + "…" : t || (imageUri ? "Screenshot analysis" : "Text analysis");
  }

  const saveToDatabase = async () => {
    if (!result) return Alert.alert("No analysis", "Analyze text or screenshot first.");

    try {
      setSaving(true);
      const title = titleFrom(input);
      const company = "Unknown";
      const score = Number(result.score ?? 0);
      const risk = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
      const url = extractUrl(input);
      const email = extractEmail(input);
      const source = imageUri ? "Image" : "Text Message";
      const notes = result.flags.length ? result.flags.join(", ") : null;

      await api.create({
        title, company, score, risk, source, url, email, notes, images: [],
      });

      Alert.alert("Saved", "Added to database.");
      setInput(""); setImageUri(null); setResult(null);
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const canAnalyzeText = input.trim().length > 0 && !busy;
  const canAnalyzeShot = !!imageUri && !busy;
  const canSave = !!result && !saving;

  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, bg]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.h1, text]}>Add Content</Text>

        <TextInput
          style={[styles.input, card, { borderColor: colors.border }, text]}
          placeholder="Paste job text or link (https://…)"
          placeholderTextColor={muted.color as string}
          value={input}
          onChangeText={(t) => { setInput(t); setResult(null); }}
          multiline
          scrollEnabled
        />

        <View style={styles.row}>
          <Pressable onPress={onAnalyzeText} disabled={!canAnalyzeText}
            style={[styles.btn, { backgroundColor: canAnalyzeText ? colors.primary : "#9aa0a6" }]}>
            <Text style={styles.btnPrimaryText}>Analyze Text/Link</Text>
          </Pressable>
          <Pressable onPress={pickScreenshot} disabled={busy}
            style={[styles.btn, card, { borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}>
            <Text style={[styles.btnText, text]}>Pick Screenshot</Text>
          </Pressable>
        </View>

        {imageUri ? (
          <View style={{ gap: 10 }}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <View style={styles.row}>
              <Pressable onPress={analyzeScreenshot} disabled={!canAnalyzeShot}
                style={[styles.btn, { backgroundColor: canAnalyzeShot ? colors.primary : "#9aa0a6" }]}>
                {busy ? <ActivityIndicator color="white" /> : <Text style={styles.btnPrimaryText}>Analyze Screenshot</Text>}
              </Pressable>
              <Pressable onPress={() => setImageUri(null)} style={styles.linkBtn}>
                <Text style={{ color: "#c00", fontWeight: "600" }}>Remove screenshot</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {result && (
          <View style={[styles.panel, card, { borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, text]}>Analysis</Text>
            <Text style={[styles.cardInfo, text]}>Score: {result.score} — {result.verdict} risk</Text>
            <Text style={[styles.cardFlags, muted]}>
              Flags: {result.flags.length ? result.flags.join(", ") : "none"}
            </Text>
            <Pressable onPress={saveToDatabase} disabled={!canSave}
              style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : "#9aa0a6" }]}>
              <Text style={styles.btnPrimaryText}>{saving ? "Saving…" : "Save to Database"}</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.tip, muted]}>Tip: LinkedIn/Indeed URL or raw message text both work.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  h1: { fontSize: 18, fontWeight: "800" },
  input: { height: 220, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnText: { fontWeight: "700" },
  btnPrimaryText: { color: "white", fontWeight: "700" },
  preview: { width: "100%", height: 220, borderRadius: 12, backgroundColor: "#ddd" },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  panel: { padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardInfo: { fontSize: 14, fontWeight: "600" },
  cardFlags: { fontSize: 12 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
  tip: { fontSize: 12 },
});
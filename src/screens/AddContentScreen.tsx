import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { useColors } from "../theme/useColors";
import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { analyzeTextLocal, type AnalysisResult } from "../lib/analyzer";

type Props = { navigation: any };

export default function AddContentScreen({ navigation }: Props) {
  const { colors, bg, card, text, muted } = useColors();
  const { autoSave, sensitivity } = useSettings();
  const { add } = useSavedItems();

  const [input, setInput] = React.useState("");
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Add Content",
      // no custom headerLeft → system back arrow tints with theme
    });
  }, [navigation]);

  const onAnalyzeText = () => {
    const raw = input.trim();
    if (!raw) return Alert.alert("Nothing to analyze", "Paste a job post or link first.");
    const a = analyzeTextLocal(raw, sensitivity);
    setResult(a);
    if (autoSave) saveEntry(a);
  };

  const pickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert("Permission needed", "Allow photo access to pick a screenshot.");
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      selectionLimit: 1,
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
      // stub OCR for now
      const stub =
        "paid daily guaranteed monthly income; 60–90 min training; contact on WhatsApp; send gift cards.";
      const a = analyzeTextLocal(`${stub} ${input ?? ""}`, sensitivity);
      setResult(a);
      if (autoSave) saveEntry(a);
    } finally {
      setBusy(false);
    }
  };

  const saveEntry = (a: AnalysisResult) => {
    const entry: SavedAnalysis = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      title: imageUri ? "Screenshot analysis" : titleFrom(input),
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

  const saveManually = () => {
    if (!result) return;
    saveEntry(result);
    Alert.alert("Saved", "Analysis added to your Database.");
  };

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, bg]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.h1, text]}>Add Content</Text>

        <TextInput
          value={input}
          onChangeText={(t) => {
            setInput(t);
            setResult(null);
          }}
          placeholder="Paste job text or link (https://…)"
          placeholderTextColor={(muted.color as string) ?? "#9aa0a6"}
          style={[styles.input, card, { borderColor: colors.border }]}
          multiline
        />

        <View style={styles.row}>
          <Pressable onPress={onAnalyzeText} style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnPrimary}>Analyze Text/Link</Text>
          </Pressable>
          <Pressable onPress={pickScreenshot} style={[styles.btn, card, { borderColor: colors.border }]}>
            <Text style={[styles.btnLabel, text]}>Pick Screenshot</Text>
          </Pressable>
        </View>

        {imageUri ? (
          <View style={{ gap: 10 }}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <View style={styles.row}>
              <Pressable
                onPress={analyzeScreenshot}
                style={[styles.btn, { backgroundColor: colors.primary }]}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="white" /> : <Text style={styles.btnPrimary}>Analyze Screenshot</Text>}
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
            <Text style={[styles.cardInfo, text]}>
              Score: {result.score} — {result.verdict} risk
            </Text>
            <Text style={[styles.cardFlags, text]}>
              Flags: {result.flags.length ? result.flags.join(", ") : "none"}
            </Text>

            {!autoSave && (
              <Pressable onPress={saveManually} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.btnPrimary}>Save to Database</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* helpers */
function previewOf(s: string, n: number = 160) {
  const t = (s || "").trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}
function titleFrom(s: string) {
  const t = previewOf(s, 40);
  return t || "Text analysis";
}

/* styles */
const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  h1: { fontSize: 18, fontWeight: "800" },

  input: {
    height: 220,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
  },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnLabel: { fontWeight: "700" },
  btnPrimary: { color: "white", fontWeight: "700" },

  preview: { width: "100%", height: 220, borderRadius: 12, backgroundColor: "#ddd" },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 8 },

  panel: { padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardInfo: { fontSize: 14, fontWeight: "600" },
  cardFlags: { fontSize: 12 },

  saveBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
});
// AddContentScreen.tsx
import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useColors } from "../theme/useColors";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

type AnalysisResult = { score: number; verdict: "Low" | "Medium" | "High"; flags: string[] };

export default function AddContentScreen({ navigation }: any) {
  const { colors, bg, card, text } = useColors();
  const { add } = useSavedItems();

  const [input, setInput] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);

  const resetForm = useCallback(() => {
    setInput("");
    setImageUri(null);
    setResult(null);
    setBusy(false);
  }, []);

  // Reset whenever this screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => resetForm(); // on blur
    }, [resetForm])
  );

  // Back should go to Home tab's HomeMain
  // inside AddContentScreen
useLayoutEffect(() => {
  navigation.setOptions({
    headerBackVisible: false,
    headerLeft: () => (
      <Pressable
        onPress={() => {
          resetForm();           // keep clearing fields
          navigation.goBack();   // ✅ just pop to HomeMain in the Home stack
        }}
        hitSlop={12}
        style={{ paddingHorizontal: 8, paddingVertical: 6, flexDirection: "row", alignItems: "center" }}
      >
        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 17 }}>← Back</Text>
      </Pressable>
    ),
  });
}, [navigation, colors.primary, resetForm]);

  const onAnalyzeText = () => {
    const raw = input.trim();
    if (!raw) return Alert.alert("Nothing to analyze", "Paste a job post or link first.");
    const a = analyzeTextLocal(raw);
    setResult(a);
  };

  const onPickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Allow photo access to pick a screenshot.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      selectionLimit: 1,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  };

  const saveEntry = (a: AnalysisResult) => {
    const entry: SavedAnalysis = {
      id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6),
      title: imageUri ? "Screenshot analysis" : previewOf(input) || "Text analysis",
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

  const analyzeScreenshot = async () => {
    if (!imageUri) return Alert.alert("No screenshot", "Pick a screenshot first.");
    try {
      setBusy(true);
      // stub OCR:
      const fakeOCR = "Contact via WhatsApp and pay with gift cards. Earn $500/day.";
      const a = analyzeTextLocal(fakeOCR + " " + (input ?? ""));
      setResult(a);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, bg]} keyboardShouldPersistTaps="handled">
      <Text style={[styles.h1, text]}>Add Content</Text>

      <TextInput
        style={[styles.input, card, { borderColor: colors.border }]}
        placeholder="Paste job text or link (https://…)"
        placeholderTextColor="#999"
        value={input}
        onChangeText={(t) => {
          setInput(t);
          setResult(null);
        }}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.row}>
        <Pressable onPress={onAnalyzeText} style={[styles.btnPrimary, { backgroundColor: colors.primary }]}>
          <Text style={styles.btnPrimaryText}>Analyze Text/Link</Text>
        </Pressable>

        <Pressable onPress={onPickScreenshot} style={[styles.btn, card, { borderColor: colors.border }]}>
          <Text style={[styles.btnText, text]}>Pick Screenshot</Text>
        </Pressable>
      </View>

      {imageUri ? (
        <View style={{ gap: 10, marginTop: 10 }}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Pressable
            onPress={analyzeScreenshot}
            disabled={busy}
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          >
            {busy ? <ActivityIndicator /> : <Text style={styles.btnPrimaryText}>Analyze Screenshot</Text>}
          </Pressable>
          <Pressable onPress={() => setImageUri(null)} style={{ padding: 6 }}>
            <Text style={{ color: "#c00", fontWeight: "600" }}>Remove screenshot</Text>
          </Pressable>
        </View>
      ) : null}

      {result ? (
        <View style={[styles.result, card, { borderColor: colors.border }]}>
          <Text style={[styles.resultTitle, text]}>Analysis</Text>
          <Text style={[styles.resultLine, text]}>
            Score: {result.score} — {result.verdict} risk
          </Text>
          <Text style={{ color: "#666" }}>
            Flags: {result.flags.length ? result.flags.join(", ") : "none"}
          </Text>

          <Pressable
            onPress={() => {
              saveEntry(result);
              Alert.alert("Saved", "Analysis added to your Database.");
            }}
            style={[styles.btnPrimary, { backgroundColor: colors.primary, alignSelf: "flex-start" }]}
          >
            <Text style={styles.btnPrimaryText}>Save to Database</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={{ color: "#777", marginTop: 8 }}>
        Tip: LinkedIn/Indeed URL or raw message text both work.
      </Text>
    </ScrollView>
  );
}

/** simple local analyzer */
function analyzeTextLocal(raw: string): AnalysisResult {
  const text = (raw || "").toLowerCase();
  const rules: Array<[RegExp, number, string]> = [
    [/whats\s*app|telegram|signal/, 25, "chat app contact"],
    [/gift\s*card|apple\s*card|steam\s*card/, 35, "gift card payment"],
    [/earn\s*\$?\s?\d{3,}\s*per\s*(day|hour)|\$\s?\d{3,}\s*(daily|day)/, 25, "unrealistic pay"],
  ];
  let score = 0;
  const flags: string[] = [];
  for (const [re, pts, label] of rules) {
    if (re.test(text)) {
      score += pts;
      flags.push(label);
    }
  }
  score = Math.min(100, Math.max(0, score));
  const verdict: AnalysisResult["verdict"] = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
  return { score, verdict, flags: Array.from(new Set(flags)) };
}

function previewOf(s: string, n = 120) {
  const t = (s || "").trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  h1: { fontSize: 18, fontWeight: "800" },

  input: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },

  row: { flexDirection: "row", gap: 10, marginTop: 8 },

  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: { fontWeight: "700" },

  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnPrimaryText: { color: "white", fontWeight: "800" },

  preview: { width: "100%", height: 220, borderRadius: 10, backgroundColor: "#ddd" },

  result: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6, marginTop: 12 },
  resultTitle: { fontSize: 16, fontWeight: "800" },
  resultLine: { fontWeight: "700" },
});
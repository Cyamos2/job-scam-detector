import React, { useState } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function HomeScreen() {
  const [showOptions, setShowOptions] = useState(false);
  const [input, setInput] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onStart = () => setShowOptions((s) => !s);

  const onAnalyzeText = () => {
    if (!input.trim()) {
      Alert.alert("Nothing to analyze", "Paste a job post, message, or a link first.");
      return;
    }
    Alert.alert("Analyzing…", "This will run the text/link analyzer.");
  };

  const onPickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access to pick a screenshot.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    setImageUri(asset.uri);
  };

  const analyzeScreenshot = async () => {
    if (!imageUri) {
      Alert.alert("No screenshot", "Pick a screenshot first.");
      return;
    }
    try {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 800));
      const fakeOCR = "(stubbed) found: whatsapp, training, flexible schedule";
      const hasWhatsApp = /whatsapp/i.test(fakeOCR);
      Alert.alert(
        "Analysis (stub)",
        `OCR text: ${fakeOCR}\n\nFlags: ${hasWhatsApp ? "whatsapp" : "none"}`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Job Scam Detector</Text>
        <Text style={styles.subtitle}>Home</Text>
        <Text style={styles.body}>
          Tap Start to add text/links or pick a screenshot to analyze.
        </Text>

        <Pressable onPress={onStart} style={styles.startBtn}>
          <Text style={styles.startText}>{showOptions ? "Close" : "Start"}</Text>
        </Pressable>

        {showOptions && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Add Content</Text>

            <TextInput
              style={styles.input}
              placeholder="Paste job text or link (https://…)"
              value={input}
              onChangeText={setInput}
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
                    <Text style={[styles.actionText, styles.primaryText]}>Analyze Screenshot</Text>
                  )}
                </Pressable>

                <Pressable onPress={() => setImageUri(null)} style={styles.clearBtn}>
                  <Text style={styles.clearText}>Remove screenshot</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.hint}>
              Tip: LinkedIn/Indeed URL or raw message text both work.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 18, paddingBottom: 40 }, // extra bottom space so you can reach last items
  title: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 4 },
  body: { fontSize: 14, opacity: 0.8 },

  startBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#1b72e8",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startText: { color: "white", fontWeight: "700" },

  panel: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f4f6f8",
    gap: 12,
  },
  panelTitle: { fontSize: 16, fontWeight: "700" },
  input: {
    height: 200, // fixed height so the outer page can scroll
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "white",
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: {
    backgroundColor: "#eee",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { fontWeight: "600" },

  previewBox: { gap: 10, marginTop: 10 },
  preview: { width: "100%", height: 220, borderRadius: 10, backgroundColor: "#ddd" },

  primaryBtn: { backgroundColor: "#1b72e8" },
  primaryText: { color: "white", fontWeight: "700" },

  clearBtn: { alignSelf: "flex-start", padding: 6 },
  clearText: { color: "#c00", fontWeight: "600" },

  hint: { fontSize: 12, opacity: 0.6 },
});
import React, { useMemo, useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Alert, Share, TextInput, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems } from "../store/savedItems";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { items, remove, update } = useSavedItems();
  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const [text, setText] = useState(item?.inputPreview ?? ""); // we only stored a preview; this is the editable text
  const [score, setScore] = useState(item?.score ?? 0);
  const [verdict, setVerdict] = useState(item?.verdict ?? "Low");
  const [flags, setFlags] = useState<string[]>(item?.flags ?? []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Report",
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          {!editing ? (
            <Pressable onPress={doShare} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: "#1b72e8", fontWeight: "700" }}>Share</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => setEditing((e) => !e)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: "#1b72e8", fontWeight: "700" }}>{editing ? "Cancel" : "Edit"}</Text>
          </Pressable>
        </View>
      ),
    });
    // seed edit fields if item changes
    if (item) {
      setTitle(item.title);
      setText(item.inputPreview ?? "");
      setScore(item.score);
      setVerdict(item.verdict);
      setFlags(item.flags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, item?.id, editing]);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Report not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const doShare = async () => {
    const lines = [
      `📄 ${item.title}`,
      `🕒 ${new Date(item.createdAt).toLocaleString()}`,
      `🔎 Score: ${item.score} — ${item.verdict} risk`,
      `🚩 Flags: ${item.flags.length ? item.flags.join(", ") : "none"}`,
      item.inputPreview ? `📝 Preview: ${item.inputPreview}` : "",
      "",
      "Shared from Job Scam Detector",
    ].filter(Boolean);

    try {
      if (Platform.OS === "ios" && item.imageUri) {
        await Share.share({ message: lines.join("\n"), url: item.imageUri });
      } else {
        await Share.share({ message: lines.join("\n") + (item.imageUri ? `\n\nScreenshot: ${item.imageUri}` : "") });
      }
    } catch (e) {
      Alert.alert("Could not share", String(e));
    }
  };

  const onDelete = () => {
    Alert.alert("Delete report?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { remove(item.id); navigation.goBack(); } },
    ]);
  };

  const reAnalyze = () => {
    const a = analyzeTextLocal(text);
    setScore(a.score);
    setVerdict(a.verdict);
    setFlags(a.flags);
  };

  const save = () => {
    update(item.id, {
      title: title.trim() || "Untitled",
      inputPreview: text.trim() || null,
      score,
      verdict: verdict as typeof item.verdict,
      flags,
    });
    setEditing(false);
    Alert.alert("Saved", "Your changes have been updated.");
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {!editing ? (
        <>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>{new Date(item.createdAt).toLocaleString()}</Text>

          <View style={styles.card}>
            <Text style={styles.line}><Text style={styles.bold}>Score:</Text> {item.score}</Text>
            <Text style={styles.line}><Text style={styles.bold}>Risk:</Text> {item.verdict}</Text>
            <Text style={styles.line}>
              <Text style={styles.bold}>Flags:</Text> {item.flags.length ? item.flags.join(", ") : "none"}
            </Text>
          </View>

          {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" /> : null}

          {item.inputPreview ? (
            <View style={styles.card}>
              <Text style={styles.section}>Input Preview</Text>
              <Text style={styles.body}>{item.inputPreview}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Pressable onPress={() => navigation.goBack()} style={styles.neutralBtn}>
              <Text style={styles.neutralText}>Back</Text>
            </Pressable>
            <Pressable onPress={doShare} style={styles.shareBtn}>
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={styles.dangerBtn}>
              <Text style={styles.dangerText}>Delete</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.editLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Report title"
          />

          <Text style={styles.editLabel}>Text to analyze (optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 120, textAlignVertical: "top" }]}
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Paste job text/link here to re-analyze"
          />

          <View style={styles.card}>
            <Text style={styles.section}>Current Result</Text>
            <Text>Score: {score}</Text>
            <Text>Risk: {verdict}</Text>
            <Text>Flags: {flags.length ? flags.join(", ") : "none"}</Text>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Pressable onPress={reAnalyze} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>Re-analyze</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => setEditing(false)} style={[styles.neutralBtn, { alignSelf: "flex-end" }]}>
            <Text style={styles.neutralText}>Cancel</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

/** Same lightweight analyzer used elsewhere */
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
  let score = 0; const flags: string[] = [];
  for (const [re, pts, label] of patterns) if (re.test(text)) { score += pts; flags.push(label); }
  const urlMatch = text.match(/https?:\/\/[^\s)]+/g);
  if (urlMatch) for (const url of urlMatch) { try {
    const u = new URL(url);
    if (/\.(top|xyz|live|shop|work|site)$/i.test(u.hostname) || /-career|careers?-?[0-9]{3,}/i.test(u.hostname)) {
      score += 10; flags.push("suspicious domain");
    }
  } catch {} }
  score = Math.max(0, Math.min(100, score));
  const verdict: "Low" | "Medium" | "High" = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
  return { score, verdict, flags: Array.from(new Set(flags)) };
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { opacity: 0.7 },
  card: { gap: 6, padding: 12, backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "#eee" },
  image: { width: "100%", height: 260, borderRadius: 12, backgroundColor: "#ddd" },
  section: { fontWeight: "700", marginBottom: 6 },
  line: { fontSize: 16 },
  bold: { fontWeight: "700" },
  body: { lineHeight: 20 },

  row: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },

  primaryBtn: { backgroundColor: "#1b72e8", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  primaryText: { color: "white", fontWeight: "700" },

  neutralBtn: { backgroundColor: "#eee", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  neutralText: { fontWeight: "700" },

  saveBtn: { backgroundColor: "#16a34a", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: "white", fontWeight: "700" },

  shareBtn: { backgroundColor: "#e8f0ff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#cddcff" },
  shareText: { color: "#1b72e8", fontWeight: "700" },

  dangerBtn: { backgroundColor: "#ffe5e5", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#f3b3b3" },
  dangerText: { color: "#c00", fontWeight: "700" },

  muted: { opacity: 0.7 },

  editLabel: { fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, backgroundColor: "white" },
});
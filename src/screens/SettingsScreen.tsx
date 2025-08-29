import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { useSettings } from "../SettingsProvider";
import { useColors } from "../theme/useColors";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

/* ---------- validation helpers ---------- */

function isValidAnalysis(x: any): x is SavedAnalysis {
  if (!x || typeof x !== "object") return false;
  const verdictOk = x.verdict === "Low" || x.verdict === "Medium" || x.verdict === "High";
  return (
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.score === "number" &&
    verdictOk &&
    Array.isArray(x.flags) &&
    (typeof x.inputPreview === "string" || x.inputPreview === null || typeof x.inputPreview === "undefined") &&
    (typeof x.imageUri === "string" || x.imageUri === null || typeof x.imageUri === "undefined") &&
    (x.source === "text" || x.source === "image" || typeof x.source === "undefined") &&
    typeof x.createdAt === "number"
  );
}

function validateImportJson(raw: any): SavedAnalysis[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned: SavedAnalysis[] = [];
  for (const item of raw) {
    if (!isValidAnalysis(item)) return null;

    // Spread first, then normalize fields so we don't specify props twice
    const normalized: SavedAnalysis = {
      ...item,
      source: item.source ?? (item.imageUri ? "image" : "text"),
      inputPreview: item.inputPreview ?? null,
      imageUri: item.imageUri ?? null,
    };
    cleaned.push(normalized);
  }
  return cleaned;
}

/* ---------- screen ---------- */

export default function SettingsScreen() {
  const { theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset } = useSettings(); // <- use `reset`
  const { items, add } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  const idSet = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  const onExport = async () => {
    try {
      const payload = JSON.stringify(items, null, 2);
      const path = `${FileSystem.cacheDirectory}job-scam-detector-backup.json`;
      await FileSystem.writeAsStringAsync(path, payload, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: "application/json", dialogTitle: "Export Database" });
    } catch (e) {
      Alert.alert("Export failed", String(e instanceof Error ? e.message : e));
    }
  };

  const onImport = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (pick.canceled || !pick.assets?.length) return;

      const file = pick.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        Alert.alert("Invalid file", "The selected file is not valid JSON.");
        return;
      }

      const validated = validateImportJson(parsed);
      if (!validated) {
        Alert.alert(
          "Invalid backup",
          "Expected a JSON array of saved analyses (id, title, score, verdict, flags, inputPreview, createdAt)."
        );
        return;
      }

      const toImport = validated.filter((x) => !idSet.has(x.id));
      const skipped = validated.length - toImport.length;

      for (const entry of toImport) add(entry);

      if (toImport.length === 0) {
        Alert.alert("No new items", `${skipped} duplicate ${skipped === 1 ? "item" : "items"} skipped.`);
      } else if (skipped > 0) {
        Alert.alert("Imported with skips", `Imported ${toImport.length}. Skipped ${skipped} duplicate(s).`);
      } else {
        Alert.alert("Import complete", `Imported ${toImport.length} analyses.`);
      }
    } catch (e) {
      Alert.alert("Import failed", String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, bg]}>
      <Text style={[styles.h1, text]}>Settings</Text>

      {/* Theme */}
      <Text style={[styles.label, text]}>Theme</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setTheme("light")}
          style={[
            styles.segment,
            card,
            theme === "light" && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.segmentText, theme === "light" ? { color: "white" } : text]}>Light</Text>
        </Pressable>
        <Pressable
          onPress={() => setTheme("dark")}
          style={[
            styles.segment,
            card,
            theme === "dark" && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.segmentText, theme === "dark" ? { color: "white" } : text]}>Dark</Text>
        </Pressable>
      </View>

      {/* Auto-save */}
      <View style={styles.rowBetween}>
        <Text style={[styles.label, text]}>Auto-save analyses</Text>
        <Switch value={autoSave} onValueChange={setAutoSave} />
      </View>

      {/* Sensitivity */}
      <Text style={[styles.label, text]}>Sensitivity: {sensitivity}</Text>
      <View style={styles.row}>
        {[-10, -1, +1, +10].map((n) => (
          <Pressable
            key={n}
            onPress={() => setSensitivity(Math.max(0, Math.min(100, sensitivity + n)))}
            style={[styles.bumpBtn, card]}
          >
            <Text style={[styles.bumpText, text]}>{n > 0 ? `+${n}` : n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.help, muted]}>Higher = stricter risk flagging (used by analyzers).</Text>

      {/* Backups */}
      <View style={{ height: 8 }} />
      <Text style={[styles.label, text]}>Backups</Text>
      <View style={styles.row}>
        <Pressable onPress={onExport} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryText}>Export data</Text>
        </Pressable>
        <Pressable onPress={onImport} style={[styles.secondaryBtn, card]}>
          <Text style={[styles.secondaryText, text]}>Import data</Text>
        </Pressable>
      </View>

      {/* Reset */}
      <Pressable
        onPress={reset}
        style={[styles.resetBtn, { backgroundColor: "#f7d9d7", borderColor: "#f2c0bc" }]}
      >
        <Text style={{ color: "#c2392b", fontWeight: "700" }}>Reset to Defaults</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  h1: { fontSize: 26, fontWeight: "800" },
  label: { fontSize: 16, fontWeight: "700" },

  row: { flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  segment: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  segmentText: { fontWeight: "700" },

  bumpBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  bumpText: { fontWeight: "700" },
  help: { fontSize: 12 },

  primaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  primaryText: { color: "white", fontWeight: "700" },
  secondaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  secondaryText: { fontWeight: "700" },

  resetBtn: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 12,
  },
});
// src/screens/SettingsScreen.tsx
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useColors } from "../theme/useColors";

export default function SettingsScreen() {
  const { theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset } =
    useSettings();
  const { items, addMany } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  async function onExport() {
    try {
      const payload = JSON.stringify({ version: 1, items }, null, 2);
      const uri =
        (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "") +
        `job-scam-detector-${Date.now()}.json`;

      await FileSystem.writeAsStringAsync(uri, payload, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: "Export data",
        });
      } else {
        Alert.alert("Exported", `File saved at:\n${uri}`);
      }
    } catch (e: any) {
      Alert.alert("Export failed", String(e?.message ?? e));
    }
  }

  async function onImport() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      const raw = await FileSystem.readAsStringAsync(res.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const data = JSON.parse(raw);

      // basic validation
      const list = (Array.isArray(data?.items) ? data.items : data) as any[];
      if (!Array.isArray(list)) {
        Alert.alert("Invalid file", "JSON does not contain an 'items' array.");
        return;
      }

      const cleaned: SavedAnalysis[] = list
        .filter(
          (x) =>
            x &&
            typeof x.id === "string" &&
            typeof x.title === "string" &&
            (x.source === "text" || x.source === "image") &&
            typeof x.score === "number" &&
            typeof x.verdict === "string" &&
            typeof x.createdAt === "number" &&
            Array.isArray(x.flags)
        )
        .map((x) => ({
          id: String(x.id),
          title: String(x.title),
          source: x.source === "image" ? "image" : "text",
          inputPreview: x.inputPreview ?? null,
          imageUri: x.imageUri ?? null,
          score: Number(x.score),
          verdict: x.verdict as SavedAnalysis["verdict"],
          flags: Array.from(new Set<string>(x.flags.map(String))),
          createdAt: Number(x.createdAt),
        }));

      if (cleaned.length === 0) {
        Alert.alert("Nothing to import", "No valid items were found.");
        return;
      }

      addMany(cleaned);
      Alert.alert("Imported", `Merged ${cleaned.length} item(s) into your database.`);
    } catch (e: any) {
      Alert.alert("Import failed", String(e?.message ?? e));
    }
  }

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
            theme === "light" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              theme === "light" ? { color: "white" } : text,
            ]}
          >
            Light
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTheme("dark")}
          style={[
            styles.segment,
            card,
            theme === "dark" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              theme === "dark" ? { color: "white" } : text,
            ]}
          >
            Dark
          </Text>
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
            onPress={() =>
              setSensitivity(Math.max(0, Math.min(100, sensitivity + n)))
            }
            style={[styles.bumpBtn, card]}
          >
            <Text style={[styles.bumpText, text]}>{n > 0 ? `+${n}` : n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.help, muted]}>
        Higher = stricter risk flagging (used by analyzers).
      </Text>

      {/* Export / Import */}
      <Text style={[styles.label, text, { marginTop: 10 }]}>Backups</Text>
      <View style={styles.rowWrap}>
        <Pressable
          onPress={onExport}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryText}>Export data</Text>
        </Pressable>
        <Pressable onPress={onImport} style={[styles.primaryBtn, card]}>
          <Text style={[styles.primaryText, text]}>Import data</Text>
        </Pressable>
      </View>

      {/* Reset */}
      <Pressable
        onPress={() =>
          Alert.alert("Reset to defaults?", "This will reset theme, auto-save and sensitivity.", [
            { text: "Cancel", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: reset },
          ])
        }
        style={[styles.resetBtn, { backgroundColor: "#f7d9d7", borderColor: "#f2c0bc" }]}
      >
        <Text style={{ color: "#c2392b", fontWeight: "700" }}>
          Reset to Defaults
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  h1: { fontSize: 26, fontWeight: "800" },
  label: { fontSize: 16, fontWeight: "700" },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowWrap: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  segment: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  segmentText: { fontWeight: "700" },

  bumpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  bumpText: { fontWeight: "700" },
  help: { fontSize: 12 },

  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  primaryText: { color: "white", fontWeight: "700" },

  resetBtn: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 8,
  },
});
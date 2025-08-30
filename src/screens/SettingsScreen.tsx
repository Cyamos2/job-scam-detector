import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

import { useColors } from "../theme/useColors";
import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight(); // ✅ space under the stack header
  const { colors, text, card, bg } = useColors();
  const { theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset } =
    useSettings();
  const { items, addMany } = useSavedItems();

  const bumpSensitivity = (delta: number) =>
    setSensitivity(Math.max(0, Math.min(100, sensitivity + delta)));

  const exportData = async () => {
    try {
      const path = FileSystem.documentDirectory + "scamicide-backup.json";
      await FileSystem.writeAsStringAsync(path, JSON.stringify(items, null, 2));
      await Sharing.shareAsync(path);
    } catch (err) {
      Alert.alert("Export failed", String(err));
    }
  };

  const importData = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "application/json" });
    if (res.canceled) return;
    try {
      const raw = await FileSystem.readAsStringAsync(res.assets[0].uri);
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) throw new Error("Invalid backup: not an array");
      const cleaned: SavedAnalysis[] = parsed.filter((x: any) =>
        x &&
        typeof x.id === "string" &&
        typeof x.title === "string" &&
        typeof x.score === "number" &&
        typeof x.verdict === "string" &&
        Array.isArray(x.flags) &&
        typeof x.createdAt === "number"
      );
      if (!cleaned.length) throw new Error("No valid records found");

      // naive dedupe by id (keep existing)
      const existing = new Set(items.map((i) => i.id));
      const fresh = cleaned.filter((i) => !existing.has(i.id));
      addMany(fresh);
      Alert.alert(
        "Import complete",
        fresh.length === cleaned.length
          ? `${fresh.length} analyses imported.`
          : `${fresh.length} imported, ${cleaned.length - fresh.length} duplicates skipped.`
      );
    } catch (e) {
      Alert.alert("Import failed", String(e));
    }
  };

  return (
    <ScrollView
      style={[{ flex: 1 }, bg]}
      contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 8 }]} // ✅ push below header
    >
      {/* Theme */}
      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, text]}>Theme</Text>
        <View style={styles.row}>
          <Pressable
            style={[
              styles.chip,
              card,
              theme === "light" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setTheme("light")}
          >
            <Text style={[styles.chipText, theme === "light" ? { color: "white" } : text]}>Light</Text>
          </Pressable>
          <Pressable
            style={[
              styles.chip,
              card,
              theme === "dark" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setTheme("dark")}
          >
            <Text style={[styles.chipText, theme === "dark" ? { color: "white" } : text]}>Dark</Text>
          </Pressable>
        </View>
      </View>

      {/* Auto-save */}
      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, text]}>Auto-save analyses</Text>
        <Switch value={autoSave} onValueChange={setAutoSave} />
      </View>

      {/* Sensitivity */}
      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, text]}>Sensitivity: {sensitivity}</Text>
        <View style={styles.row}>
          {[-10, -1, +1, +10].map((d) => (
            <Pressable key={d} style={[styles.chip, card]} onPress={() => bumpSensitivity(d)}>
              <Text style={text}>{d > 0 ? `+${d}` : d}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.note, text]}>
          Higher = stricter risk flagging (used by analyzers).
        </Text>
      </View>

      {/* Backups */}
      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, text]}>Backups</Text>
        <View style={styles.row}>
          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={exportData}>
            <Text style={styles.btnText}>Export data</Text>
          </Pressable>
          <Pressable style={[styles.btn, card]} onPress={importData}>
            <Text style={text}>Import data</Text>
          </Pressable>
        </View>
      </View>

      {/* Reset */}
      <Pressable
        style={[styles.resetBtn]}
        onPress={() =>
          Alert.alert("Confirm reset", "Restore settings to defaults?", [
            { text: "Cancel", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: reset },
          ])
        }
      >
        <Text style={styles.resetText}>Reset to Defaults</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  row: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontWeight: "700" },
  note: { fontSize: 12, opacity: 0.8 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "700" },
  resetBtn: {
    marginTop: 4,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f55",
    alignItems: "center",
  },
  resetText: { color: "white", fontWeight: "800" },
});
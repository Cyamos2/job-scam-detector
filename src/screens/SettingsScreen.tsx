// src/screens/SettingsScreen.tsx
import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

import { useColors } from "../theme/useColors";
import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

export default function SettingsScreen({ navigation }: any) {
  const { colors, text, card, bg } = useColors();
  const { theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset } =
    useSettings();
  const { items, addMany } = useSavedItems();

  useEffect(() => {
    navigation.setOptions({ title: "Settings" });
  }, [navigation]);

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
      // Basic shape check
      const cleaned: SavedAnalysis[] = parsed.filter((x: any) =>
        x && typeof x.id === "string" && typeof x.title === "string" &&
        typeof x.score === "number" && typeof x.verdict === "string" &&
        Array.isArray(x.flags) && typeof x.createdAt === "number"
      );

      if (!cleaned.length) throw new Error("No valid records found");

      addMany(cleaned); // your SavedItems store exposes this
      Alert.alert("Import complete", `${cleaned.length} analyses imported.`);
    } catch (e) {
      Alert.alert("Import failed", String(e));
    }
  };

  return (
    <ScrollView style={[{ flex: 1 }, bg]} contentContainerStyle={styles.scroll}>
      {/* Theme */}
      <Text style={[styles.sectionTitle, text]}>Theme</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.chip, card, theme === "light" && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setTheme("light")}
        >
          <Text style={[styles.chipText, theme === "light" ? { color: "white" } : text]}>Light</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, card, theme === "dark" && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setTheme("dark")}
        >
          <Text style={[styles.chipText, theme === "dark" ? { color: "white" } : text]}>Dark</Text>
        </Pressable>
      </View>

      {/* Auto-save */}
      <Text style={[styles.sectionTitle, text]}>Auto-save analyses</Text>
      <Switch value={autoSave} onValueChange={setAutoSave} />

      {/* Sensitivity */}
      <Text style={[styles.sectionTitle, text]}>Sensitivity: {sensitivity}</Text>
      <View style={styles.row}>
        {[-10, -1, +1, +10].map((d) => (
          <Pressable key={d} style={[styles.chip, card]} onPress={() => bumpSensitivity(d)}>
            <Text style={text}>{d > 0 ? `+${d}` : d}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.note, text]}>Higher = stricter risk flagging (used by analyzers).</Text>

      {/* Backups */}
      <Text style={[styles.sectionTitle, text]}>Backups</Text>
      <View style={styles.row}>
        <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={exportData}>
          <Text style={styles.btnText}>Export data</Text>
        </Pressable>
        <Pressable style={[styles.btn, card]} onPress={importData}>
          <Text style={text}>Import data</Text>
        </Pressable>
      </View>

      {/* Reset */}
      <Pressable
        style={[styles.btn, { backgroundColor: "#f55" }]}
        onPress={() =>
          Alert.alert("Confirm reset", "Restore settings to defaults?", [
            { text: "Cancel", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: reset }, // ✅ use `reset`
          ])
        }
      >
        <Text style={styles.btnText}>Reset to Defaults</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontWeight: "700" },
  note: { fontSize: 12 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "700" },
});
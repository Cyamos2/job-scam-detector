// src/screens/SettingsScreen.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "../theme/useColors";
import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const { colors, text, card, bg } = useColors();
  const {
    theme,
    setTheme,
    autoSave,
    setAutoSave,
    sensitivity,
    setSensitivity,
    reset,
  } = useSettings();
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
      // Basic shape validation
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

      addMany(cleaned);
      Alert.alert("Import complete", `${cleaned.length} analyses imported.`);
    } catch (e) {
      Alert.alert("Import failed", String(e));
    }
  };

  return (
    <ScrollView
      style={[{ flex: 1 }, bg]}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: Math.max(12, insets.top + 8) },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Theme */}
      <View style={[styles.card, card, { borderColor: colors.border }]}>
        <Text style={[styles.h2, text]}>Theme</Text>
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
            <Text style={[styles.chipText, theme === "light" ? { color: "white" } : text]}>
              Light
            </Text>
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
            <Text style={[styles.chipText, theme === "dark" ? { color: "white" } : text]}>
              Dark
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Auto-save */}
      <View style={[styles.card, card, { borderColor: colors.border }]}>
        <Text style={[styles.h2, text]}>Auto-save analyses</Text>
        <Switch value={autoSave} onValueChange={setAutoSave} />
      </View>

      {/* Sensitivity */}
      <View style={[styles.card, card, { borderColor: colors.border }]}>
        <Text style={[styles.h2, text]}>Sensitivity: {sensitivity}</Text>
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
      <View style={[styles.card, card, { borderColor: colors.border }]}>
        <Text style={[styles.h2, text]}>Backups</Text>
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
        style={[styles.resetBtn, { backgroundColor: "#f55" }]}
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
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  h2: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" },

  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontWeight: "700" },

  note: { fontSize: 12, marginTop: 8 },

  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "700" },

  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  resetText: { color: "white", fontWeight: "800", fontSize: 16 },
});
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
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "../theme/useColors";
import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

type Props = { navigation: any };

export default function SettingsScreen({ navigation }: Props) {
  const { colors, bg, card, text } = useColors();
  const { theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset } =
    useSettings();
  const { items, addMany } = useSavedItems();
  const insets = useSafeAreaInsets();

  const bump = (d: number) =>
    setSensitivity(Math.max(0, Math.min(100, sensitivity + d)));

  const exportData = async () => {
    try {
      const path = FileSystem.documentDirectory + "scamicide-backup.json";
      await FileSystem.writeAsStringAsync(path, JSON.stringify(items, null, 2));
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert("Export failed", String(e));
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
        x && typeof x.id === "string" &&
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
    <SafeAreaView style={[{ flex: 1 }, bg]} edges={["top", "left", "right"]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, { paddingTop: Math.max(8, insets.top * 0.25) }]}
      >
        {/* Theme */}
        <View style={[styles.panel, card, { borderColor: colors.border }]}>
          <Text style={[styles.h, text]}>Theme</Text>
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
        </View>

        {/* Auto-save */}
        <View style={[styles.panel, card, { borderColor: colors.border }]}>
          <Text style={[styles.h, text]}>Auto-save analyses</Text>
          <Switch value={autoSave} onValueChange={setAutoSave} />
        </View>

        {/* Sensitivity */}
        <View style={[styles.panel, card, { borderColor: colors.border }]}>
          <Text style={[styles.h, text]}>Sensitivity: {sensitivity}</Text>
          <View style={styles.row}>
            {[-10, -1, +1, +10].map((d) => (
              <Pressable key={d} style={[styles.chip, card]} onPress={() => bump(d)}>
                <Text style={text}>{d > 0 ? `+${d}` : d}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.note, text]}>
            Higher = stricter risk flagging (used by analyzers).
          </Text>
        </View>

        {/* Backups */}
        <View style={[styles.panel, card, { borderColor: colors.border }]}>
          <Text style={[styles.h, text]}>Backups</Text>
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
          style={[styles.reset, { backgroundColor: "#f55" }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  panel: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  h: { fontSize: 18, fontWeight: "800" },
  row: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  chipText: { fontWeight: "700" },
  note: { fontSize: 12, opacity: 0.8 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  btnText: { color: "white", fontWeight: "700" },
  reset: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  resetText: { color: "white", fontWeight: "800" },
});
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
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

import { useColors } from "../theme/useColors";
import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

type Props = { navigation: any };

export default function SettingsScreen({ navigation }: Props) {
  const { colors, bg, card, text } = useColors();
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

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Settings",
      // no headerLeft override → system button tints automatically
    });
  }, [navigation]);

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
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });
    if (res.canceled) return;
    try {
      const raw = await FileSystem.readAsStringAsync(res.assets[0].uri);
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) throw new Error("Invalid backup format");

      // basic shape guard
      const cleaned: SavedAnalysis[] = parsed.filter((x: any) => {
        return (
          x &&
          typeof x.id === "string" &&
          typeof x.title === "string" &&
          typeof x.score === "number" &&
          typeof x.verdict === "string" &&
          Array.isArray(x.flags) &&
          typeof x.createdAt === "number"
        );
      });

      if (!cleaned.length) throw new Error("No valid records found");

      addMany(cleaned);
      Alert.alert("Import complete", `${cleaned.length} analyses imported.`);
    } catch (e) {
      Alert.alert("Import failed", String(e));
    }
  };

  return (
    <ScrollView style={[{ flex: 1 }, bg]} contentContainerStyle={styles.scroll}>
      {/* Theme */}
      <Text style={[styles.h2, text]}>Theme</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setTheme("light")}
          style={[
            styles.chip,
            card,
            theme === "light" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              theme === "light" ? { color: "white" } : text,
            ]}
          >
            Light
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTheme("dark")}
          style={[
            styles.chip,
            card,
            theme === "dark" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              theme === "dark" ? { color: "white" } : text,
            ]}
          >
            Dark
          </Text>
        </Pressable>
      </View>

      {/* Auto-save */}
      <Text style={[styles.h2, text]}>Auto-save analyses</Text>
      <Switch value={autoSave} onValueChange={setAutoSave} />

      {/* Sensitivity */}
      <Text style={[styles.h2, text]}>Sensitivity: {sensitivity}</Text>
      <View style={styles.row}>
        {[-10, -1, +1, +10].map((d) => (
          <Pressable
            key={d}
            onPress={() => bump(d)}
            style={[styles.chip, card]}
          >
            <Text style={text}>{d > 0 ? `+${d}` : d}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.note, text]}>
        Higher = stricter risk flagging (used by analyzers).
      </Text>

      {/* Backups */}
      <Text style={[styles.h2, text]}>Backups</Text>
      <View style={styles.row}>
        <Pressable
          onPress={exportData}
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.btnText}>Export data</Text>
        </Pressable>
        <Pressable onPress={importData} style={[styles.btn, card]}>
          <Text style={text}>Import data</Text>
        </Pressable>
      </View>

      {/* Reset */}
      <Pressable
        onPress={() =>
          Alert.alert("Confirm reset", "Restore settings to defaults?", [
            { text: "Cancel", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: reset },
          ])
        }
        style={[styles.resetBtn]}
      >
        <Text style={styles.resetText}>Reset to Defaults</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 20, paddingBottom: 40 },
  h2: { fontSize: 16, fontWeight: "800" },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontWeight: "700" },
  note: { fontSize: 12 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "700" },
  resetBtn: {
    backgroundColor: "#f55",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  resetText: { color: "white", fontWeight: "700", textAlign: "center" },
});
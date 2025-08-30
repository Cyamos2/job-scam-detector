// src/screens/SettingsScreen.tsx
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

import { useColors } from "../theme/useColors";
import { useSettings } from "../SettingsProvider";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";

type Props = { navigation: any };

export default function SettingsScreen({ navigation }: Props) {
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

  const goHome = React.useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent) {
      // Bottom tab navigator
      (parent as any).navigate("HomeTab", { screen: "HomeMain" });
    } else {
      // Fallback: if we’re already in the Home stack
      navigation.navigate("HomeMain" as never);
    }
  }, [navigation]);

  // Header (re-run when theme/colors change so the header matches)
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Settings",
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          hitSlop={10}
          style={{ paddingHorizontal: 8, paddingVertical: 6, flexDirection: "row", alignItems: "center" }}
        >
          <Text style={{ fontWeight: "700" }}>‹ Home</Text>
        </Pressable>
      ),
    });
  }, [navigation, goHome, colors.text, theme]);

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
      const uri = res.assets?.[0]?.uri;
      if (!uri) throw new Error("No file selected");

      const raw = await FileSystem.readAsStringAsync(uri);
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid backup format (expected an array).");
      }

      const incoming: SavedAnalysis[] = parsed.filter((x: any) =>
        x &&
        typeof x.id === "string" &&
        typeof x.title === "string" &&
        (x.source === "text" || x.source === "image") &&
        typeof x.score === "number" &&
        (x.verdict === "Low" || x.verdict === "Medium" || x.verdict === "High") &&
        Array.isArray(x.flags) &&
        typeof x.createdAt === "number"
      );

      if (incoming.length === 0) throw new Error("No valid records found.");

      const existingIds = new Set(items.map((i) => i.id));
      const deduped = incoming.filter((i) => !existingIds.has(i.id));
      const skipped = incoming.length - deduped.length;

      if (deduped.length === 0) {
        Alert.alert(
          "Nothing to import",
          skipped > 0 ? "All records were duplicates." : "No new records found."
        );
        return;
      }

      addMany(deduped);

      Alert.alert(
        skipped > 0 ? "Imported with warnings" : "Import complete",
        skipped > 0
          ? `${deduped.length} added, ${skipped} duplicates skipped.`
          : `${deduped.length} analyses imported.`
      );
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
          onPress={() => setTheme("light")}
          accessibilityRole="button"
          style={[
            styles.chip,
            card,
            theme === "light" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.chipText, theme === "light" ? { color: "white" } : text]}>
            Light
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTheme("dark")}
          accessibilityRole="button"
          style={[
            styles.chip,
            card,
            theme === "dark" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.chipText, theme === "dark" ? { color: "white" } : text]}>
            Dark
          </Text>
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
      <Text style={[styles.note, text]}>
        Higher = stricter risk flagging (used by analyzers).
      </Text>

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
            { text: "Reset", style: "destructive", onPress: reset },
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
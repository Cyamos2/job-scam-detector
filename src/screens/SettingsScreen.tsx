// src/screens/SettingsScreen.tsx
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Alert, ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useSettings } from "../SettingsProvider";
import { useColors } from "../theme/useColors";
import { useSavedItems } from "../store/savedItems";

function tsFilename() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `job-scam-detector-backup-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

export default function SettingsScreen() {
  const { theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity, reset } = useSettings();
  const { exportJSON, importJSON } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();
  const [busy, setBusy] = useState<null | "export" | "import">(null);

  const onExport = useCallback(async () => {
    try {
      setBusy("export");
      const json = exportJSON();
      const filename = tsFilename();
      const uri = FileSystem.cacheDirectory! + filename;
      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: "Export Backup",
          UTI: "public.json",
        });
      } else {
        Alert.alert("Backup saved", `Saved to: ${uri}`);
      }
    } catch (e: any) {
      Alert.alert("Export failed", e?.message ?? "Unknown error");
    } finally {
      setBusy(null);
    }
  }, [exportJSON]);

  const onImport = useCallback(async () => {
    try {
      setBusy("import");
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      const raw = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const { added, replaced, skipped } = importJSON(raw, "merge");
      Alert.alert("Import complete", `Added ${added}${replaced ? `, replaced ${replaced}` : ""}${skipped ? `, skipped ${skipped}` : ""}.`);
    } catch (e: any) {
      Alert.alert("Import failed", e?.message ?? "Unknown error");
    } finally {
      setBusy(null);
    }
  }, [importJSON]);

  return (
    <ScrollView contentContainerStyle={[styles.container, bg]}>
      <Text style={[styles.h1, text]}>Settings</Text>

      {/* Theme */}
      <Text style={[styles.label, text]}>Theme</Text>
      <View style={styles.row}>
        <Pressable onPress={() => setTheme("light")} style={[styles.segment, card, theme === "light" && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={[styles.segmentText, theme === "light" ? { color: "white" } : text]}>Light</Text>
        </Pressable>
        <Pressable onPress={() => setTheme("dark")} style={[styles.segment, card, theme === "dark" && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
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
          <Pressable key={n} onPress={() => setSensitivity(Math.max(0, Math.min(100, sensitivity + n)))} style={[styles.bumpBtn, card]}>
            <Text style={[styles.bumpText, text]}>{n > 0 ? `+${n}` : n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.help, muted]}>Higher = stricter risk flagging (used by analyzers).</Text>

      {/* Backup / Restore */}
      <Text style={[styles.label, text, { marginTop: 6 }]}>Backup & Restore</Text>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Pressable onPress={onExport} style={[styles.primaryBtn, { opacity: busy === "export" ? 0.7 : 1 }]} disabled={!!busy}>
          {busy === "export" ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Export backup</Text>}
        </Pressable>
        <Pressable onPress={onImport} style={[styles.secondaryBtn, card, { opacity: busy === "import" ? 0.7 : 1 }]} disabled={!!busy}>
          {busy === "import" ? <ActivityIndicator /> : <Text style={[styles.segmentText, text]}>Import backup</Text>}
        </Pressable>
      </View>

      <Pressable onPress={reset} style={[styles.resetBtn, { backgroundColor: "#f7d9d7", borderColor: "#f2c0bc" }]}>
        <Text style={{ color: "#c2392b", fontWeight: "700" }}>Reset to Defaults</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  h1: { fontSize: 26, fontWeight: "800" },
  label: { fontSize: 16, fontWeight: "700" },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  segment: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  segmentText: { fontWeight: "700" },

  bumpBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  bumpText: { fontWeight: "700" },
  help: { fontSize: 12 },

  primaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1b72e8" },
  primaryText: { color: "white", fontWeight: "700" },
  secondaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },

  resetBtn: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
});
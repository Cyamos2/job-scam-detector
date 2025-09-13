import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Share as RNShare,
} from "react-native";
import Screen from "../components/Screen";
import {
  useSettings,
  type ThemeName,
  type RiskFilter,
} from "../SettingsProvider";
import { useTheme } from "@react-navigation/native";
import { useJobs } from "../hooks/useJobs";

const ORANGE = "#FF5733";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, setSettings } = useSettings();
  const { exportJson, importJson, nukeStorage } = useJobs();

  const [importVisible, setImportVisible] = React.useState(false);
  const [importText, setImportText] = React.useState("");

  const setTheme = (theme: ThemeName) => setSettings({ theme });
  const setRisk = (risk: RiskFilter) => setSettings({ defaultRiskFilter: risk });

  const onExport = async () => {
    try {
      const json = await exportJson();
      await RNShare.share({ message: json });
    } catch (e) {
      Alert.alert("Export failed", String(e ?? "Unknown error"));
    }
  };

  const onImport = async () => {
    try {
      await importJson(importText, { merge: true });
      setImportVisible(false);
      setImportText("");
      Alert.alert("Import complete", "Imported (merged) successfully.");
    } catch (e) {
      Alert.alert("Import failed", String(e ?? "Invalid JSON"));
    }
  };

  const onClear = () => {
    Alert.alert("Clear all?", "This removes all saved posts.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: nukeStorage },
    ]);
  };

  return (
    <Screen>
      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.h1, { color: colors.text }]}>Appearance</Text>
        <View style={styles.row}>
          {(["system", "light", "dark"] as const).map((m) => {
            const active = settings.theme === m;
            return (
              <Pressable
                key={m}
                onPress={() => setTheme(m)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.text },
                    active && styles.chipTextActive,
                  ]}
                >
                  {m[0].toUpperCase() + m.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Default list filter */}
      <View style={styles.section}>
        <Text style={[styles.h1, { color: colors.text }]}>
          Risk Filter (default list)
        </Text>
        <View style={styles.row}>
          {(["all", "high", "medium", "low"] as const).map((r) => {
            const active = settings.defaultRiskFilter === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRisk(r)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.text },
                    active && styles.chipTextActive,
                  ]}
                >
                  {r[0].toUpperCase() + r.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.note, { color: colors.text }]}>
          Settings are saved automatically.
        </Text>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={[styles.h1, { color: colors.text }]}>Data</Text>
        <View style={styles.row}>
          <Pressable onPress={onExport} style={styles.chip}>
            <Text style={[styles.chipText, { color: colors.text }]}>
              Export JSON
            </Text>
          </Pressable>
          <Pressable onPress={() => setImportVisible(true)} style={styles.chip}>
            <Text style={[styles.chipText, { color: colors.text }]}>
              Import JSON
            </Text>
          </Pressable>
          <Pressable onPress={onClear} style={[styles.chip, { borderColor: "#fca5a5" }]}>
            <Text style={[styles.chipText, { color: "#b91c1c" }]}>Clear all</Text>
          </Pressable>
        </View>
        <Text style={[styles.note, { color: colors.text }]}>
          Export shares a JSON snapshot. Import merges into your database.
        </Text>
      </View>

      {/* Import Modal */}
      <Modal
        visible={importVisible}
        animationType="slide"
        onRequestClose={() => setImportVisible(false)}
      >
        <Screen>
          <Text style={[styles.h1, { marginTop: 8, color: colors.text }]}>
            Import JSON
          </Text>
          <TextInput
            value={importText}
            onChangeText={setImportText}
            placeholder="Paste JSON here..."
            placeholderTextColor={colors.border}
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              padding: 12,
              minHeight: 220,
              textAlignVertical: "top",
              color: colors.text,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={() => setImportVisible(false)}
              style={[styles.chip, { backgroundColor: "#F3F4F6" }]}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onImport}
              style={[styles.chip, { backgroundColor: "#1f6cff" }]}
            >
              <Text style={[styles.chipText, { color: "#fff" }]}>Import</Text>
            </Pressable>
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  h1: { fontSize: 24, fontWeight: "800", marginBottom: 12 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: ORANGE + "AA", backgroundColor: "#fff4f1" },
  chipText: { fontWeight: "700" },
  chipTextActive: { color: ORANGE },
  note: { marginTop: 14 },
});
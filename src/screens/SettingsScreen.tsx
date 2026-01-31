// src/screens/SettingsScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
  Share,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../components/Screen";
import {
  useSettings,
  resolveThemeName,
  type ThemeName,
  type RiskFilter,
} from "../SettingsProvider";

// If you later wire these helpers from your jobs/persist layer,
// keep the same names – UI already matches these calls.
import { useJobs } from "../hooks/useJobs";

const ORANGE = "#FF5733";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, setSettings } = useSettings();
  const { exportJson, importJson, nukeStorage } = useJobs(); // uses your hook-based persistence

  const [importVisible, setImportVisible] = React.useState(false);
  const [importText, setImportText] = React.useState("");

  const setTheme = (theme: ThemeName) => setSettings({ theme });
  const setRisk = (risk: RiskFilter) => setSettings({ defaultRiskFilter: risk });

  /** ------------------ Export / Import / Clear ------------------ */

  const onExport = async () => {
    try {
      // Share the export payload (stringified JSON) via the system share sheet
      const json = await exportJson(); // should return string
      await Share.share({ message: json });
    } catch (e) {
      Alert.alert("Export failed", String(e ?? "Unknown error"));
    }
  };

  const tryParse = (s: string): { ok: boolean; value: unknown | null } => {
    const trimmed = s.trim();
    if (!trimmed) return { ok: false, value: null };
    try {
      return { ok: true, value: JSON.parse(trimmed) };
    } catch {
      return { ok: false, value: null };
    }
  };

  const isImportable = React.useMemo(() => tryParse(importText).ok, [importText]);

  const onImport = async () => {
    const trimmed = importText.trim();
    if (!trimmed) {
      Alert.alert("Import", "Paste JSON first.");
      return;
    }
    try {
      // Let your hook validate/merge/replace; here we do a lightweight pre-parse to
      // avoid the generic “Unexpected end of input” error.
      const parsed = JSON.parse(trimmed);
      await importJson(parsed, { merge: true }); // merge keeps current items; change to { replace: true } if desired
      setImportVisible(false);
      setImportText("");
      Alert.alert("Import", "Imported (merged) successfully.");
    } catch (e) {
      Alert.alert("Import failed", String(e ?? "Invalid JSON"));
    }
  };

  const onClear = () => {
    Alert.alert("Clear all?", "This removes all saved posts.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await nukeStorage();
          } catch (e) {
            Alert.alert("Clear failed", String(e ?? "Unknown error"));
          }
        },
      },
    ]);
  };

  /** ------------------ UI ------------------ */

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
        <Text style={[styles.note, { color: colors.text }]}>
          Using: {resolveThemeName(settings.theme)}
        </Text>
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
          <Pressable onPress={onClear} style={[styles.chip, styles.destructive]}>
            <Text style={[styles.chipText, { color: "#B91C1C" }]}>Clear All</Text>
          </Pressable>

          {/* Dev-only: trigger a Sentry test capture */}
          {__DEV__ && (
            <Pressable
              onPress={async () => {
                try {
                  const crashReporting = (await import("../lib/crashReporting")).crashReporting;
                  await crashReporting.testCrash();
                  Alert.alert("Sentry", "Test event captured and flushed (if configured).");
                } catch (e) {
                  Alert.alert("Sentry", "Test capture failed: " + String(e));
                }
              }}
              style={[styles.chip, { backgroundColor: "#F3F4F6" }]}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>Trigger Sentry Test</Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.note, { color: colors.text }]}>
          Export shares a snapshot as JSON. Import merges with what you have.
        </Text>
      </View>

      {/* Import Modal (safe-area + keyboard-avoiding) */}
      <Modal
        visible={importVisible}
        animationType="slide"
        onRequestClose={() => setImportVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 16,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.h1, { color: colors.text }]}>Import JSON</Text>

            <TextInput
              value={importText}
              onChangeText={setImportText}
              placeholder="Paste JSON here…"
              placeholderTextColor={colors.border}
              multiline
              style={[
                styles.textarea,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: "#E5E7EB",
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  setImportVisible(false);
                  setImportText("");
                }}
                style={[styles.chip, { backgroundColor: "#F3F4F6" }]}
              >
                <Text style={[styles.chipText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={onImport}
                disabled={!isImportable}
                style={[
                  styles.chip,
                  { backgroundColor: isImportable ? "#1f6cff" : "#93C5FD" },
                ]}
              >
                <Text style={[styles.chipText, { color: "#fff" }]}>Import</Text>
              </Pressable>
            </View>

            <Text style={[styles.note, { color: colors.text }]}>
              Tip: Copy JSON first, then paste here. Import is enabled once the
              text looks like valid JSON.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
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
  destructive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  chipActive: { borderColor: ORANGE + "AA", backgroundColor: "#FFF4F1" },
  chipText: { fontWeight: "700" },
  chipTextActive: { color: ORANGE },
  note: { marginTop: 12 },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 220,
    textAlignVertical: "top",
  },
});
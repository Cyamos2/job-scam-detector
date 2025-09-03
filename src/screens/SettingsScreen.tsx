// src/screens/SettingsScreen.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import { useSettings, resolveThemeName, type ThemeName, type RiskFilter } from "../SettingsProvider";

const ORANGE = "#FF5733";

export default function SettingsScreen() {
  const { settings, setSettings } = useSettings();

  const setTheme = (theme: ThemeName) => setSettings({ theme });
  const setRisk = (risk: RiskFilter) => setSettings({ defaultRiskFilter: risk });

  return (
    <Screen>
      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.h1}>Appearance</Text>
        <View style={styles.row}>
          {(["system", "light", "dark"] as const).map((m) => {
            const active = settings.theme === m;
            return (
              <Pressable key={m} onPress={() => setTheme(m)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{m[0].toUpperCase() + m.slice(1)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Default list filter */}
      <View style={styles.section}>
        <Text style={styles.h1}>Risk Filter (default list)</Text>
        <View style={styles.row}>
          {(["all", "high", "medium", "low"] as const).map((r) => {
            const active = settings.defaultRiskFilter === r;
            return (
              <Pressable key={r} onPress={() => setRisk(r)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{r[0].toUpperCase() + r.slice(1)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>Settings are saved automatically.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  h1: { fontSize: 24, fontWeight: "800", marginBottom: 12, color: "#111" },
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
  chipText: { color: "#111", fontWeight: "700" },
  chipTextActive: { color: ORANGE },
  note: { marginTop: 14, color: "#6B7280" },
});
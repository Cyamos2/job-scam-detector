// src/screens/SettingsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from "react-native";
import { useSettings } from "../SettingsProvider";
import { useColors } from "../theme/useColors";

export default function SettingsScreen() {
  const { theme, setTheme, autoSave, setAutoSave, sensitivity, setSensitivity } = useSettings();
  const { bg, card, text, muted, colors } = useColors();

  // Local reset (don’t rely on a context method that may not exist)
  const onReset = () => {
    setTheme("light");
    setAutoSave(false);
    setSensitivity(50);
  };

  const bump = (n: number) =>
    setSensitivity(Math.max(0, Math.min(100, sensitivity + n)));

  return (
    <ScrollView contentContainerStyle={[styles.container, bg]}>
      <Text style={[styles.h1, text]}>Settings</Text>

      {/* Theme */}
      <Text style={[styles.label, text]}>Theme</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTheme("light")}
          style={[
            styles.segment,
            card,
            theme === "light" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.segmentText, theme === "light" ? { color: "white" } : text]}>
            Light
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTheme("dark")}
          style={[
            styles.segment,
            card,
            theme === "dark" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.segmentText, theme === "dark" ? { color: "white" } : text]}>
            Dark
          </Text>
        </Pressable>
      </View>

      {/* Auto-save */}
      <View style={styles.rowBetween}>
        <Text style={[styles.label, text]}>Auto-save analyses</Text>
        <Switch
          value={autoSave}
          onValueChange={setAutoSave}
          trackColor={{ false: "#bbb", true: colors.primary }}
          thumbColor={autoSave ? "white" : "#f4f3f4"}
        />
      </View>

      {/* Sensitivity */}
      <Text style={[styles.label, text]}>Sensitivity: {sensitivity}</Text>
      <View style={styles.row}>
        {[-10, -1, +1, +10].map((n) => (
          <Pressable key={n} onPress={() => bump(n)} style={[styles.bumpBtn, card]}>
            <Text style={[styles.bumpText, text]}>{n > 0 ? `+${n}` : n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.help, muted]}>
        Higher = stricter risk flagging (used by analyzers).
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={onReset}
        style={[styles.resetBtn, { backgroundColor: "#f7d9d7", borderColor: "#f2c0bc" }]}
      >
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

  resetBtn: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
});
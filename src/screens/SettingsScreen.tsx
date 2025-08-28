// src/screens/SettingsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import { useSettings } from "../SettingsProvider";

export default function SettingsScreen() {
  const {
    theme,
    setTheme,
    autoSave,
    setAutoSave,
    sensitivity,
    setSensitivity,
    loading,
    resetSettings,
  } = useSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {loading ? <Text style={styles.muted}>Loading…</Text> : null}

      {/* Theme */}
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => setTheme("light")}
            style={[styles.pill, theme === "light" && styles.pillActive]}
          >
            <Text
              style={[styles.pillText, theme === "light" && styles.pillTextActive]}
            >
              Light
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTheme("dark")}
            style={[styles.pill, theme === "dark" && styles.pillActive]}
          >
            <Text
              style={[styles.pillText, theme === "dark" && styles.pillTextActive]}
            >
              Dark
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Auto-save */}
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Auto-save analyses</Text>
        <Switch value={autoSave} onValueChange={setAutoSave} />
      </View>

      {/* Sensitivity (no slider, just +/-) */}
      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Sensitivity: {sensitivity}</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => setSensitivity(Math.max(0, sensitivity - 10))}
            style={styles.smallBtn}
          >
            <Text style={styles.smallBtnText}>-10</Text>
          </Pressable>
          <Pressable
            onPress={() => setSensitivity(Math.max(0, sensitivity - 1))}
            style={styles.smallBtn}
          >
            <Text style={styles.smallBtnText}>-1</Text>
          </Pressable>
          <Pressable
            onPress={() => setSensitivity(Math.min(100, sensitivity + 1))}
            style={styles.smallBtn}
          >
            <Text style={styles.smallBtnText}>+1</Text>
          </Pressable>
          <Pressable
            onPress={() => setSensitivity(Math.min(100, sensitivity + 10))}
            style={styles.smallBtn}
          >
            <Text style={styles.smallBtnText}>+10</Text>
          </Pressable>
        </View>
        <Text style={styles.muted}>
          Higher = stricter risk flagging (used by analyzers).
        </Text>
      </View>

      {/* Reset */}
      <Pressable onPress={resetSettings} style={[styles.btn, styles.danger]}>
        <Text style={[styles.btnText, styles.dangerText]}>Reset to Defaults</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 18 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  label: { fontWeight: "600" },
  muted: { opacity: 0.6 },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#eee" },
  pillActive: { backgroundColor: "#1b72e8" },
  pillText: { fontWeight: "600" },
  pillTextActive: { color: "white" },

  smallBtn: { backgroundColor: "#eee", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  smallBtnText: { fontWeight: "600" },

  btn: { marginTop: 8, alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  btnText: { fontWeight: "700" },
  danger: { backgroundColor: "#fee" },
  dangerText: { color: "#c00" },
});
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSettings } from "../SettingsProvider";

export default function SettingsScreen() {
  const { theme, sensitivity, setTheme, setSensitivity, resetSettings, isHydrated } = useSettings();

  const bump = (delta: number) => setSensitivity(Math.max(0, Math.min(100, sensitivity + delta)));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {!isHydrated && <Text style={styles.muted}>Loading saved settings…</Text>}

      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          <Choice label="System" active={theme === "system"} onPress={() => setTheme("system")} />
          <Choice label="Light" active={theme === "light"} onPress={() => setTheme("light")} />
          <Choice label="Dark"  active={theme === "dark"}  onPress={() => setTheme("dark")} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Sensitivity: {sensitivity}</Text>
        <View style={styles.row}>
          <Button label="-10" onPress={() => bump(-10)} />
          <Button label="-5"  onPress={() => bump(-5)} />
          <Button label="+5"  onPress={() => bump(+5)} />
          <Button label="+10" onPress={() => bump(+10)} />
        </View>
      </View>

      <Pressable onPress={resetSettings} style={[styles.resetBtn]}>
        <Text style={styles.resetText}>Reset to defaults</Text>
      </Pressable>
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 18 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  muted: { fontSize: 12, opacity: 0.6 },
  section: { gap: 10 },
  label: { fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  btnText: { fontWeight: "600" },

  choice: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
  },
  choiceActive: {
    backgroundColor: "#1b72e8",
    borderColor: "#1b72e8",
  },
  choiceText: { fontWeight: "600" },
  choiceTextActive: { color: "white" },

  resetBtn: { marginTop: 10, padding: 10, alignSelf: "flex-start" },
  resetText: { color: "#c00", fontWeight: "600" },
});
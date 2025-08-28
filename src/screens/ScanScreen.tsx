import React from "react";
import { View, Text, StyleSheet } from "react-native";
export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan</Text>
      <Text style={styles.body}>Deprecated — use Home → Start → Pick Screenshot.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  body: { fontSize: 14, opacity: 0.8, textAlign: "center" },
});
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Scam Detector</Text>
      <Text style={styles.subtitle}>Home</Text>
      <Text style={styles.body}>
        Welcome! Use the tabs below to open Database or Settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 12 },
  body: { fontSize: 14, textAlign: "center", opacity: 0.8 },
});
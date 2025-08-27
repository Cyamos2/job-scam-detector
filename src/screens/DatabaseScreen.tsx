import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function DatabaseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database</Text>
      <Text style={styles.body}>
        No saved analyses yet. This screen is a clean placeholder.
      </Text>
      <Text style={styles.small}>
        (We’ll wire the Saved Items store after Settings persistence.)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  body: { fontSize: 14, textAlign: "center", opacity: 0.85 },
  small: { marginTop: 6, fontSize: 12, opacity: 0.6 },
});
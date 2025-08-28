import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../navigation/HomeStack";

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Scam Detector</Text>
      <Text style={styles.subtitle}>Home</Text>
      <Text style={styles.body}>
        Tap Start to add text/links or pick a screenshot to analyze.
      </Text>

      <Pressable onPress={() => navigation.navigate("AddContent")} style={styles.startBtn}>
        <Text style={styles.startText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 18 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 4 },
  body: { fontSize: 14, opacity: 0.8 },
  startBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#1b72e8",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startText: { color: "white", fontWeight: "700" },
});
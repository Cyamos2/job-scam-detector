// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Scamicide</Text>
      <Text style={styles.sub}>Paste text or pick a screenshot to analyze.</Text>

      <Pressable
        onPress={() => navigation.navigate("AddContent")}
        style={styles.primaryBtn}
      >
        <Text style={styles.primaryText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  h1: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  sub: { opacity: 0.7, marginBottom: 20 },
  primaryBtn: { backgroundColor: "#1b72e8", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  primaryText: { color: "white", fontWeight: "700" },
});
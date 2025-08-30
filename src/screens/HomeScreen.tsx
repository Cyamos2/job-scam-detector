import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// HomeScreen.tsx
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.center}>
      {/* Keep only one header: the stack header. Avoid second big H1 to prevent “double titles”. */}
      <Text style={styles.title}>Scamicide</Text>
      <Text style={styles.subtitle}>Paste text or pick a screenshot to analyze.</Text>

      <Pressable
        onPress={() => navigation.navigate("AddContent")}
        style={styles.startBtn}
        accessibilityLabel="Start adding content"
      >
        <Text style={styles.startBtnText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 34, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 16, textAlign: "center" },
  startBtn: { backgroundColor: "#1E6DFF", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  startBtnText: { color: "white", fontWeight: "700" },
});
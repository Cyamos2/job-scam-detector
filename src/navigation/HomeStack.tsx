// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../theme/useColors";
import { goToAddContent } from "../navigation/goTo";

export default function HomeScreen({ navigation }: any) {
  const { colors, text, bg } = useColors();

  return (
    <View style={[{ flex: 1, justifyContent: "center", alignItems: "center" }, bg]}>
      {/* REMOVE any <Text> that says “Home” at top — header already shows it */}
      <Text style={[{ fontSize: 32, fontWeight: "800", marginBottom: 16 }, text]}>Scamicide</Text>
      <Text style={[{ marginBottom: 20 }, text]}>Paste text or pick a screenshot to analyze.</Text>
      <Pressable
        onPress={() => goToAddContent(navigation)}
        style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Start</Text>
      </Pressable>
    </View>
  );
}
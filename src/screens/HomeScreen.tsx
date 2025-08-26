import React from "react";
import { View, Text } from "react-native";
import AppButton from "../components/AppButton";
import { theme } from "../theme";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const nav = useNavigation<any>();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 20 }}>
      <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: "800", marginBottom: 10 }}>
        Scamicide
      </Text>
      <Text style={{ color: theme.colors.hint, marginBottom: 24 }}>
        Spray away job scams — stay safe, stay hired.
      </Text>

      <AppButton title="Verify Job Posting" onPress={() => nav.navigate("Verify")} />
      <View style={{ height: 12 }} />
      <AppButton title="Scan Screenshot" onPress={() => nav.navigate("Scan")} />
    </View>
  );
}
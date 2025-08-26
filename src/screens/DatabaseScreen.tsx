import React from "react";
import { View, Text } from "react-native";
import { theme } from "../theme";
import AppButton from "../components/AppButton";
import { useNavigation } from "@react-navigation/native";

export default function DatabaseScreen() {
  const nav = useNavigation<any>();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 20 }}>
      <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
        Saved Analyses
      </Text>
      <Text style={{ color: theme.colors.hint, marginBottom: 24 }}>
        No saved items yet. Analyze a job on the Verify tab and tap <Text style={{ fontWeight: "700" }}>Save</Text>.
      </Text>

      <AppButton title="Go to Settings" onPress={() => nav.navigate("Settings")} />
    </View>
  );
}
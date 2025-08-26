import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { useSettings } from "../hooks/useSettings";
import AppButton from "../components/AppButton";
import { useNavigation } from "@react-navigation/native";

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  const nav = useNavigation<any>();

  const toggleTheme = () => {
    update({ theme: settings.theme === "dark" ? "light" : "dark" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 20 }}>
      <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
        Settings
      </Text>

      <TouchableOpacity onPress={toggleTheme} style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Dark theme: {settings.theme === "dark" ? "On" : "Off"}
        </Text>
        <Text style={{ color: theme.colors.hint }}>Use dark colors throughout the app</Text>
      </TouchableOpacity>

      <AppButton title="View Database" onPress={() => nav.navigate("Database")} />
    </View>
  );
}
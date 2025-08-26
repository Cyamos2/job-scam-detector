import React, { useState } from "react";
import { View, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";

import AppButton from "../components/AppButton";
import { theme } from "../theme";
import { useSettings } from "../hooks/useSettings";
import { extractTextFromImage } from "../lib/ocr";
import { analyzeJobText } from "../lib/riskRules";

export default function ScanScreen() {
  const { settings } = useSettings();
  const [summary, setSummary] = useState<string>("Select a screenshot to analyze.");

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;

    const text = await extractTextFromImage(res.assets[0].uri);
    const r = analyzeJobText(text, settings);
    setSummary(`Score: ${r.score} — ${r.level}\n\nFlags: ${r.flags.join(", ") || "None"}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 20 }}>
      <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
        Scan Screenshot
      </Text>
      <AppButton title="Choose Image" onPress={pickImage} />
      <Text style={{ color: theme.colors.hint, marginTop: 16 }}>{summary}</Text>
    </View>
  );
}
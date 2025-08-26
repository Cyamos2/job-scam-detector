import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import AppTextInput from "../components/AppTextInput";
import AppButton from "../components/AppButton";
import RiskMeter from "../components/RiskMeter";
import { theme } from "../theme";
import { useSettings } from "../hooks/useSettings";
import { analyzeJobText } from "../lib/riskRules";
import { getDomainAgeBonus } from "../lib/domainAge";
import { explainFindings } from "../lib/explain";

export default function VerifyScreen() {
  const { settings } = useSettings();
  const [link, setLink] = useState("");
  const [desc, setDesc] = useState("");

  const analysis = useMemo(() => analyzeJobText(desc, settings), [desc, settings]);

  const adjusted = useMemo(() => {
    const bonus = getDomainAgeBonus(link);
    const score = Math.min(100, Math.max(0, analysis.score + bonus));
    const level: "Low" | "Medium" | "High" = score < 33 ? "Low" : score < 66 ? "Medium" : "High";
    return { score, level, bonus, base: analysis.score };
  }, [link, analysis.score]);

  async function onFetchLink() {
    if (!link.trim()) return;
    // Placeholder: if you implement fetching + parsing later, setDesc(fetchedText)
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: "800", marginBottom: 12 }}>
        Company Verification
      </Text>

      <AppTextInput
        value={link}
        onChangeText={setLink}
        placeholder="https://company.com/careers/…"
      />
      <View style={{ height: 10 }} />
      <AppButton title="Fetch & Analyze Link" onPress={onFetchLink} />

      <View style={{ height: 20 }} />
      <AppTextInput
        value={desc}
        onChangeText={setDesc}
        placeholder="Paste the job description here…"
        multiline
        style={{ minHeight: 140, textAlignVertical: "top" }}
      />

      <RiskMeter
        score={adjusted.score}
        level={adjusted.level}
        baseScore={adjusted.base}
        bonusLabel={adjusted.bonus ? `+${adjusted.bonus} domain-age bonus` : undefined}
      />

      <Text style={{ color: theme.colors.hint, marginTop: 12 }}>
        {explainFindings(analysis)}
      </Text>
    </ScrollView>
  );
}
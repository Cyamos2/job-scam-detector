// src/screens/AddContentScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
  useTheme,
} from "@react-navigation/native";
import Screen from "../components/Screen";
import { useJobs } from "../hooks/useJobs";
import type { Risk, JobInput } from "../lib/api";
import { scoreJob, bucket } from "../lib/scoring";
import { useSettings } from "../SettingsProvider";
import type { RootStackParamList } from "../navigation/types";

type Rt = RouteProp<RootStackParamList, "AddContent">;

const ORANGE = "#FF5733";

const RISK_LABEL: Record<Risk, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

// quick URL detector
const URL_RE = /^https?:\/\/[\w.-]+\.[a-z]{2,}.*$/i;

export default function AddContentScreen() {
  const { colors, dark } = useTheme();
  const nav = useNavigation();
  const route = useRoute<Rt>();
  const { create } = useJobs();
  const { settings } = useSettings();

  // default risk from Settings (fall back to "low" if "all")
  const defaultRisk: Risk =
    (["low", "medium", "high"] as const).includes(
      settings.defaultRiskFilter as Risk
    )
      ? (settings.defaultRiskFilter as Risk)
      : "low";

  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [risk, setRisk] = React.useState<Risk>(defaultRisk);
  const [notes, setNotes] = React.useState("");

  // Pre-fill from presetUri (if user picked a screenshot or link earlier)
  React.useEffect(() => {
    const u = route.params?.presetUri;
    if (!u) return;
    if (URL_RE.test(u)) setUrl(u);
    else setNotes((prev) => (prev ? prev + "\n" + u : u));
  }, [route.params?.presetUri]);

  const urlOk = !url || URL_RE.test(url.trim());
  const ready = title.trim().length > 0 && company.trim().length > 0 && urlOk;

  // live score preview from current inputs
  const previewScore = scoreJob({
    title,
    company,
    url,
    notes,
    risk,
  } as any).score;
  const b = bucket(previewScore);

  const onExtractUrl = () => {
    if (!notes) return;
    const match = notes.match(/https?:\/\/\S+/i);
    if (match && !url) setUrl(match[0]);
  };

  const onSubmit = async () => {
    if (!ready) {
      Alert.alert("Missing info", "Title and company are required.");
      return;
    }
    const input: JobInput = {
      title: title.trim(),
      company: company.trim(),
      url: url.trim() || undefined,
      risk,
      notes: notes.trim() || undefined,
    };
    try {
      await create(input);
      nav.goBack();
    } catch (e) {
      Alert.alert("Add failed", String(e ?? "Unknown error"));
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.h1, { color: colors.text }]}>Add Job</Text>

          {/* Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Job title (e.g., Payroll Assistant)"
            placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: !title.trim() ? "#FCA5A5" : colors.border,
                color: colors.text,
              },
            ]}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Company */}
          <TextInput
            value={company}
            onChangeText={setCompany}
            placeholder="Company (e.g., Fakester Ltd)"
            placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: !company.trim() ? "#FCA5A5" : colors.border,
                color: colors.text,
              },
            ]}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* URL */}
          <View style={{ gap: 6 }}>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="URL (optional)"
              placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: urlOk ? colors.border : "#FCA5A5",
                  color: colors.text,
                },
              ]}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={onExtractUrl} style={[styles.smallBtn, { borderColor: colors.border }]}>
                <Text style={{ fontWeight: "700", color: colors.text }}>Extract URL from notes</Text>
              </Pressable>
              {!urlOk && (
                <Text style={[styles.errorText]}>Enter a valid URL (https://…)</Text>
              )}
            </View>
          </View>

          {/* Risk selector + live score chip */}
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Risk</Text>
            <View style={styles.chips}>
              {(["low", "medium", "high"] as const).map((r) => {
                const active = r === risk;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRisk(r)}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      active && {
                        borderColor: ORANGE,
                        backgroundColor: dark ? "#261512" : "#fff4f1",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.text },
                        active && { color: ORANGE },
                      ]}
                    >
                      {RISK_LABEL[r]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={[
                styles.scorePill,
                b === "high"
                  ? { backgroundColor: "#FDE8E8" }
                  : b === "medium"
                  ? { backgroundColor: "#FFF4E6" }
                  : { backgroundColor: "#E7F8ED" },
              ]}
            >
              <Text style={{ fontWeight: "800", color: "#111" }}>{previewScore}</Text>
            </View>
          </View>

          {/* Notes */}
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (paste the message/recruiter text, etc.)"
            placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
            multiline
            textAlignVertical="top"
            style={[
              styles.textarea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
          />

          {/* Submit */}
          <Pressable
            disabled={!ready}
            onPress={onSubmit}
            style={[
              styles.submit,
              { backgroundColor: ready ? "#1f6cff" : "#93c5fd" },
            ]}
          >
            <Text style={styles.submitText}>Add</Text>
          </Pressable>

          {/* subtle helper */}
          <Text style={[styles.helper, { color: dark ? "#94a3b8" : "#6B7280" }]}>
            Tip: live score updates as you type. Higher = riskier.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  h1: { fontSize: 22, fontWeight: "900", marginBottom: 2 },
  label: { fontWeight: "800", marginBottom: 6 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textarea: {
    minHeight: 160,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    lineHeight: 20,
  },
  row: { gap: 8 },
  chips: { flexDirection: "row", gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontWeight: "800" },
  scorePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 2,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { alignSelf: "center", fontWeight: "700", color: "#DC2626" },
  submit: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  helper: { textAlign: "center", marginTop: 4 },
});
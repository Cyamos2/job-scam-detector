// src/screens/AddContentScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { api, type JobInput } from "../lib/api";

const ORANGE = "#FF5733";
type Risk = "low" | "medium" | "high";

export default function AddContentScreen() {
  const { colors, dark } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [url, setUrl] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [risk, setRisk] = React.useState<Risk>("low");
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit() {
    if (!title.trim() || !company.trim()) {
      Alert.alert("Missing info", "Title and company are required.");
      return;
    }
    try {
      setSubmitting(true);
      const payload: JobInput = {
        title: title.trim(),
        company: company.trim(),
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        risk,
      };
      await api.createJob(payload);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Add failed", e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={[styles.h1, { color: colors.text }]}>Add Job</Text>

        <TextInput placeholder="Title" placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"} value={title} onChangeText={setTitle} style={inputStyle} />
        <TextInput placeholder="Company" placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"} value={company} onChangeText={setCompany} style={inputStyle} />
        <TextInput placeholder="URL (optional)" placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"} autoCapitalize="none" keyboardType="url" value={url} onChangeText={setUrl} style={inputStyle} />

        <Text style={[styles.label, { color: colors.text }]}>Risk</Text>
        <View style={styles.row}>
          {(["low", "medium", "high"] as const).map((r) => {
            const active = risk === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRisk(r)}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { borderColor: ORANGE, backgroundColor: dark ? "#261512" : "#fff4f1" },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? ORANGE : colors.text }]}>{r.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          placeholder="Notes"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          value={notes}
          onChangeText={setNotes}
          style={[inputStyle, { minHeight: 120, textAlignVertical: "top" }]}
          multiline
        />

        <Pressable onPress={onSubmit} disabled={submitting} style={[styles.submit, { opacity: submitting ? 0.6 : 1 }]}>
          <Text style={styles.submitText}>{submitting ? "Adding…" : "Add"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  label: { marginTop: 6, marginBottom: 4, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontWeight: "700" },
  submit: { marginTop: 10, backgroundColor: "#1f6cff", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
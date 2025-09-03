import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Screen from "../components/Screen";
import api, { type JobInput, type Risk } from "../lib/api";

const ORANGE = "#FF5733";

export default function AddContentScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  // ✅ keep lowercase in state
  const [risk, setRisk] = React.useState<Risk>("low");

  const onSubmit = async () => {
    const payload: JobInput = {
      title: title.trim(),
      company: company.trim(),
      url: url.trim() || undefined,
      risk,               // <-- already lowercase
      notes: notes.trim() || undefined,
    };
    try {
      await api.createJob(payload);   // canonical method
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Add failed", String(e?.message ?? e));
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Add Job</Text>

        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Company" value={company} onChangeText={setCompany} />
        <TextInput style={styles.input} placeholder="URL" value={url} onChangeText={setUrl} autoCapitalize="none" />

        <Text style={styles.label}>Risk</Text>
        <View style={styles.row}>
          {(["low","medium","high"] as Risk[]).map(r => {
            const active = risk === r;
            return (
              <Pressable key={r} onPress={() => setRisk(r)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{r.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, { height: 140, textAlignVertical: "top" }]}
          placeholder="Notes"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <Pressable style={styles.submit} onPress={onSubmit}>
          <Text style={styles.submitText}>Add</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  h1: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: "700", color: "#111" },
  input: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#fff", marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff",
  },
  chipActive: { borderColor: ORANGE + "AA", backgroundColor: "#fff4f1" },
  chipText: { fontWeight: "700", color: "#111" },
  chipTextActive: { color: ORANGE },
  submit: {
    marginTop: 8, backgroundColor: "#1f6cff", paddingVertical: 14,
    borderRadius: 12, alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
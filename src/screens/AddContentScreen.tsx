import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Screen from "../components/Screen";
import { api, type JobInput } from "@/lib/api";
const colors = { primary: "#FF5733" }; // or inline your colors

export default function AddContentScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [risk, setRisk] = React.useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [submitting, setSubmitting] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "Add Content",
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>‹ Home</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  async function onSubmit() {
    try {
      setSubmitting(true);
      const payload: JobInput = {
        title: title.trim(),
        company: company.trim(),
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        // 🔽 Prisma expects lowercase: "low" | "medium" | "high"
        risk: risk.toLowerCase() as "low" | "medium" | "high",
      };
      await api.createJob(payload);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Add failed", String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} />

          <Text style={styles.label}>Company</Text>
          <TextInput value={company} onChangeText={setCompany} style={styles.input} />

          <Text style={styles.label}>URL</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            autoCapitalize="none"
            keyboardType="url"
            style={styles.input}
          />

          <Text style={styles.label}>Risk</Text>
          <View style={styles.pills}>
            {(["LOW", "MEDIUM", "HIGH"] as const).map((r) => {
              const active = r === risk;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRisk(r)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[styles.input, { height: 120, textAlignVertical: "top" }]}
          />

          <View style={{ height: 16 }} />
          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
          >
            <Text style={styles.primaryBtnText}>{submitting ? "Adding…" : "Add"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors?.primary ?? "#ff5a3c",
    fontWeight: "600",
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  label: { marginTop: 14, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  pills: { flexDirection: "row", gap: 10 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  pillActive: {
    borderColor: "#ff5a3c",
    backgroundColor: "#fff4f1",
  },
  pillText: { fontWeight: "600", color: "#111" },
  pillTextActive: { color: "#ff5a3c" },
  primaryBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#1f6cff",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
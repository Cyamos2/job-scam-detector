import * as React from "react";
import { Modal, View, Text, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView } from "react-native";

const risks = ["LOW", "MEDIUM", "HIGH"] as const;
type Risk = typeof risks[number];

export type EditPayload = {
  title?: string;
  company?: string;
  risk?: Risk;
  score?: number;
  notes?: string | null;
  url?: string | null;
  email?: string | null;
  source?: string | null;
};

export function EditJobModal({
  visible, job, mode = "edit", onClose, onSave
}: {
  visible: boolean;
  job?: any;
  mode?: "edit" | "create";
  onClose: () => void;
  onSave: (data: EditPayload) => void;
}) {
  const [title, setTitle] = React.useState(job?.title ?? "");
  const [company, setCompany] = React.useState(job?.company ?? "");
  const [risk, setRisk] = React.useState<Risk>(job?.risk ?? "LOW");
  const [score, setScore] = React.useState(String(job?.score ?? 0));
  const [url, setUrl] = React.useState(job?.url ?? "");
  const [email, setEmail] = React.useState(job?.email ?? "");
  const [source, setSource] = React.useState(job?.source ?? "");
  const [notes, setNotes] = React.useState(job?.notes ?? "");

  React.useEffect(() => {
    if (visible) {
      setTitle(job?.title ?? "");
      setCompany(job?.company ?? "");
      setRisk((job?.risk as Risk) ?? "LOW");
      setScore(String(job?.score ?? 0));
      setUrl(job?.url ?? "");
      setEmail(job?.email ?? "");
      setSource(job?.source ?? "");
      setNotes(job?.notes ?? "");
    }
  }, [job?.id, visible]);

  const disabled = !title.trim() || !company.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "white", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "90%" }}>
            <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
              {mode === "create" ? "Add Job" : "View / Edit Job"}
            </Text>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <TextInput value={title} onChangeText={setTitle} placeholder="Title"
                style={{ borderWidth: 1, borderColor: "#e3e3ea", borderRadius: 10, padding: 10 }} />
              <TextInput value={company} onChangeText={setCompany} placeholder="Company"
                style={{ borderWidth: 1, borderColor: "#e3e3ea", borderRadius: 10, padding: 10 }} />

              <View style={{ flexDirection: "row", gap: 8 }}>
                {risks.map(r => {
                  const active = risk === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRisk(r)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                        borderWidth: 1, borderColor: active ? "#2f6fed" : "#d9dbe3",
                        backgroundColor: active ? "#eaf0ff" : "white"
                      }}>
                      <Text style={{ color: active ? "#2f6fed" : "#333" }}>{r}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput value={score} onChangeText={setScore} keyboardType="numeric" placeholder="Score (0–100)"
                style={{ borderWidth: 1, borderColor: "#e3e3ea", borderRadius: 10, padding: 10 }} />
              <TextInput value={url} onChangeText={setUrl} placeholder="URL"
                style={{ borderWidth: 1, borderColor: "#e3e3ea", borderRadius: 10, padding: 10 }} />
              <TextInput value={email} onChangeText={setEmail} placeholder="Email"
                style={{ borderWidth: 1, borderColor: "#e3e3ea", borderRadius: 10, padding: 10 }} />
              <TextInput value={source} onChangeText={setSource} placeholder="Source"
                style={{ borderWidth: 1, borderColor: "#e3e3ea", borderRadius: 10, padding: 10 }} />
              <TextInput value={notes} onChangeText={setNotes} placeholder="Notes" multiline
                style={{ borderWidth: 1, borderColor: "#e3e3ea", borderRadius: 10, padding: 10, minHeight: 60 }} />
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
              <Pressable onPress={onClose}><Text>Cancel</Text></Pressable>
              <Pressable
                disabled={disabled}
                onPress={() =>
                  onSave({
                    title: title.trim(),
                    company: company.trim(),
                    risk,
                    score: Number(score) || 0,
                    url: url || null,
                    email: email || null,
                    source: source || null,
                    notes: notes || null,
                  })
                }
                style={{ opacity: disabled ? 0.4 : 1 }}
              >
                <Text style={{ color: "#2f6fed", fontWeight: "600" }}>
                  {mode === "create" ? "Add" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
// src/components/EditJobModal.tsx
import * as React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export type EditPayload = {
  title?: string;
  company?: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  url?: string | null;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
};

type Props = {
  /** Show/hide the modal */
  visible: boolean;
  /** When provided, we’re in “edit” mode */
  jobId?: string;
  /** Initial values to prefill the form (useful for edit) */
  initial?: Partial<EditPayload> & { title?: string; company?: string };
  /** Close the modal (no save) */
  onClose: () => void;
  /** Called with the payload when user taps Save */
  onSave: (data: EditPayload) => Promise<void> | void;
};

export default function EditJobModal({
  visible,
  jobId,
  initial,
  onClose,
  onSave,
}: Props) {
  const isEdit = !!jobId;

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [company, setCompany] = React.useState(initial?.company ?? "");
  const [risk, setRisk] = React.useState<"LOW" | "MEDIUM" | "HIGH">(initial?.risk ?? "LOW");
  const [score, setScore] = React.useState(String(initial?.score ?? 0));
  const [url, setUrl] = React.useState(initial?.url ?? "");
  const [email, setEmail] = React.useState(initial?.email ?? "");
  const [source, setSource] = React.useState(initial?.source ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");

  // Reset fields whenever modal opens or initial changes
  React.useEffect(() => {
    if (!visible) return;
    setTitle(initial?.title ?? "");
    setCompany(initial?.company ?? "");
    setRisk((initial?.risk as any) ?? "LOW");
    setScore(String(initial?.score ?? 0));
    setUrl((initial?.url as string) ?? "");
    setEmail((initial?.email as string) ?? "");
    setSource((initial?.source as string) ?? "");
    setNotes((initial?.notes as string) ?? "");
  }, [visible, jobId, initial?.title, initial?.company, initial?.risk, initial?.score, initial?.url, initial?.email, initial?.source, initial?.notes]);

  const disabled = !title.trim() || !company.trim();

  const handleSave = async () => {
    const payload: EditPayload = {
      title: title.trim(),
      company: company.trim(),
      risk,
      score: Number.isFinite(Number(score)) ? Number(score) : 0,
      url: url.trim() ? url.trim() : null,
      email: email.trim() ? email.trim() : null,
      source: source.trim() ? source.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    };
    await onSave(payload);
  };

  const RiskChip = ({ v }: { v: "LOW" | "MEDIUM" | "HIGH" }) => (
    <Pressable
      onPress={() => setRisk(v)}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: risk === v ? "#2f6fed" : "#ddd",
        backgroundColor: risk === v ? "#eaf0ff" : "white",
      }}
    >
      <Text style={{ fontWeight: "700" }}>{v}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            maxHeight: "85%",
            padding: 16,
            paddingBottom: 24,
            backgroundColor: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
            {isEdit ? "Edit Job" : "Add Job"}
          </Text>

          <ScrollView contentContainerStyle={{ gap: 10 }}>
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Company"
              value={company}
              onChangeText={setCompany}
              style={styles.input}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <RiskChip v="LOW" />
              <RiskChip v="MEDIUM" />
              <RiskChip v="HIGH" />
            </View>

            <TextInput
              placeholder="Score"
              keyboardType="number-pad"
              value={score}
              onChangeText={setScore}
              style={styles.input}
            />
            <TextInput placeholder="URL" value={url ?? ""} onChangeText={setUrl} style={styles.input} />
            <TextInput placeholder="Email" value={email ?? ""} onChangeText={setEmail} style={styles.input} />
            <TextInput placeholder="Source" value={source ?? ""} onChangeText={setSource} style={styles.input} />
            <TextInput
              placeholder="Notes"
              value={notes ?? ""}
              onChangeText={setNotes}
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
            />
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <Pressable
              onPress={onClose}
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#ddd" }}
            >
              <Text>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={disabled}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: disabled ? "#9aa0a6" : "#2f6fed",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>{isEdit ? "Save" : "Add"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  } as const,
};
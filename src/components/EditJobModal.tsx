// src/components/EditJobModal.tsx
import * as React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import type { Job, Risk } from "../lib/api";

type Props = {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  /** will receive only the changed fields */
  onSaved: (patch: Partial<Job>) => void | Promise<void>;
  /** optional delete handler */
  onDelete?: (job: Job) => void | Promise<void>;
};

const ORANGE = "#FF5733";
const RISKS: Risk[] = ["low", "medium", "high"];

export default function EditJobModal({
  visible,
  job,
  onClose,
  onSaved,
  onDelete,
}: Props) {
  const { colors, dark } = useTheme();

  // form state mirrors the selected job
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [url, setUrl] = React.useState<string | undefined>(undefined);
  const [risk, setRisk] = React.useState<Risk>("low");
  const [notes, setNotes] = React.useState<string | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!job) return;
    setTitle(job.title ?? "");
    setCompany(job.company ?? "");
    setUrl(job.url ?? undefined);
    setRisk(job.risk ?? "low");
    setNotes(job.notes ?? undefined);
  }, [job]);

  function buildPatch(): Partial<Job> {
    if (!job) return {};
    const patch: Partial<Job> = {};
    if (title !== job.title) patch.title = title;
    if (company !== job.company) patch.company = company;
    if ((url ?? null) !== (job.url ?? null)) patch.url = url ?? null;
    if (risk !== job.risk) patch.risk = risk;
    if ((notes ?? null) !== (job.notes ?? null)) patch.notes = notes ?? null;
    return patch;
  }

  async function handleSave() {
    if (!job) return;
    const patch = buildPatch();
    // nothing changed, just close
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    try {
      setSaving(true);
      await onSaved(patch);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!job || !onDelete) return;
    Alert.alert(
      "Delete entry",
      `Delete “${job.title}” at ${job.company}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              await onDelete(job);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.header, { color: colors.text }]}>
          {job ? "Edit Entry" : "Edit"}
        </Text>

        <Text style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Job title"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
          ]}
        />

        <Text style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}>Company</Text>
        <TextInput
          value={company}
          onChangeText={setCompany}
          placeholder="Company"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
          ]}
        />

        <Text style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}>URL</Text>
        <TextInput
          value={url ?? ""}
          onChangeText={(v) => setUrl(v || undefined)}
          placeholder="https://example.com"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          autoCapitalize="none"
          keyboardType="url"
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
          ]}
        />

        <Text style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}>Risk</Text>
        <View style={styles.riskRow}>
          {RISKS.map((r) => {
            const active = r === risk;
            return (
              <Pressable
                key={r}
                onPress={() => setRisk(r)}
                style={[
                  styles.riskChip,
                  {
                    borderColor: active ? ORANGE : colors.border,
                    backgroundColor: active
                      ? (dark ? "#261512" : "#fff4f1")
                      : colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.riskText,
                    { color: active ? ORANGE : colors.text },
                  ]}
                >
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}>Notes</Text>
        <TextInput
          value={notes ?? ""}
          onChangeText={(v) => setNotes(v || undefined)}
          placeholder="Optional notes"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          multiline
          style={[
            styles.notes,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
          ]}
        />

        <View style={styles.actions}>
          {onDelete && (
            <Pressable
              onPress={handleDelete}
              disabled={saving}
              style={[styles.btn, styles.btnDanger]}
            >
              <Text style={styles.btnDangerText}>Delete</Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }} />
          <Pressable onPress={onClose} disabled={saving} style={[styles.btn, styles.btnGhost]}>
            <Text style={[styles.btnGhostText, { color: dark ? "#e5e7eb" : "#111827" }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Text style={styles.btnPrimaryText}>{saving ? "Saving…" : "Save"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000077",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  header: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "700", marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notes: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  riskRow: { flexDirection: "row", gap: 8 },
  riskChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  riskText: { fontWeight: "700", fontSize: 12 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: ORANGE, borderColor: ORANGE },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { fontWeight: "700" },
  btnDanger: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  btnDangerText: { color: "#b91c1c", fontWeight: "800" },
});
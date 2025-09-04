import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { api, type Job } from "../lib/api";

type Props = {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  onSaved: () => void;    // refresh list after save
  onDeleted: () => void;  // refresh list after delete
};

export default function EditJobModal({
  visible,
  job,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setCompany(job.company);
      setNotes(job.notes ?? "");
    } else {
      setTitle("");
      setCompany("");
      setNotes("");
    }
  }, [job]);

  const save = async () => {
    if (!job) return;
    try {
      setBusy(true);
      await api.updateJob(job.id, { title, company, notes });
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!job) return;
    Alert.alert(
      "Delete job",
      `Remove “${job.title}”?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await api.deleteJob(job.id);
              onDeleted();
              onClose();
            } catch (e: any) {
              console.error(e);
              Alert.alert("Delete failed", e?.message ?? "Unknown error");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.h1}>Edit Job</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Job title"
            style={styles.input}
          />
          <TextInput
            value={company}
            onChangeText={setCompany}
            placeholder="Company"
            style={styles.input}
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes"
            multiline
            style={[styles.input, { height: 92 }]}
          />

          <View style={styles.actionsRow}>
            <Pressable
              disabled={busy}
              onPress={confirmDelete}
              style={[styles.btn, styles.delete]}
            >
              <Text style={[styles.btnText, { color: "#fff" }]}>Delete</Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                disabled={busy}
                onPress={onClose}
                style={[styles.btn, styles.cancel]}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={save}
                style={[styles.btn, styles.save]}
              >
                <Text style={[styles.btnText, { color: "#fff" }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  h1: { fontSize: 18, fontWeight: "800", marginBottom: 12, color: "#111" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  cancel: { backgroundColor: "#f3f4f6" },
  save: { backgroundColor: "#1f6cff" },
  delete: { backgroundColor: "#ef4444" },
  btnText: { fontWeight: "800", color: "#111" },
});
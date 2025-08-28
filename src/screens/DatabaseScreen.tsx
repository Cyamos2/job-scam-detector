import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { items, remove, update } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  // edit mode state
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const [preview, setPreview] = useState(item?.inputPreview ?? "");

  useEffect(() => {
    // refresh form values if the item changes (e.g., after store hydration)
    if (item) {
      setTitle(item.title ?? "");
      setPreview(item.inputPreview ?? "");
    }
  }, [item?.id]);

  // header share button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        !editing ? (
          <Pressable onPress={onShare} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Share</Text>
          </Pressable>
        ) : null,
      title: "Report",
    });
  }, [navigation, colors.primary, editing, item]);

  if (!item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.muted, muted]}>Report not found.</Text>
      </View>
    );
  }

  const onShare = async () => {
    const body =
      `${item.title}\n` +
      `${new Date(item.createdAt).toLocaleString()}\n\n` +
      `Score: ${item.score}\nRisk: ${item.verdict}\nFlags: ${item.flags.join(", ") || "none"}\n\n` +
      (item.inputPreview ? `Input Preview:\n${item.inputPreview}` : "");
    try {
      await Share.share({ message: body });
    } catch {}
  };

  const onDelete = () => {
    Alert.alert("Delete report?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          remove(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const onSave = () => {
    const newTitle = title.trim() || "Untitled";
    update(item.id, { title: newTitle, inputPreview: preview });
    setEditing(false);
  };

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, bg]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Title + timestamp card */}
        <View style={[styles.card, card]}>
          {editing ? (
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              style={[styles.titleInput, text]}
              placeholderTextColor={muted.color as string}
              autoFocus
            />
          ) : (
            <Text style={[styles.title, text]}>{item.title}</Text>
          )}
          <Text style={[styles.timestamp, muted]}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>

        {/* Score card */}
        <View style={[styles.card, card]}>
          <Text style={[styles.key, text]}>Score: <Text style={styles.value}>{item.score}</Text></Text>
          <Text style={[styles.key, text]}>Risk: <Text style={styles.value}>{item.verdict}</Text></Text>
          <Text style={[styles.key, text]}>Flags: <Text style={styles.value}>{item.flags.join(", ") || "none"}</Text></Text>
        </View>

        {/* Input Preview */}
        <View style={[styles.card, card]}>
          <Text style={[styles.sectionTitle, text]}>Input Preview</Text>

          {editing ? (
            <TextInput
              value={preview}
              onChangeText={setPreview}
              placeholder="Original text or link..."
              style={[styles.previewInput, text]}
              placeholderTextColor={muted.color as string}
              multiline
              textAlignVertical="top"
            />
          ) : item.inputPreview ? (
            <Text style={[styles.preview, text]}>{item.inputPreview}</Text>
          ) : (
            <Text style={[styles.preview, muted]}>No preview available.</Text>
          )}

          {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.image} /> : null}
        </View>

        {/* Buttons */}
        <View style={styles.row}>
          {!editing ? (
            <>
              <Pressable onPress={() => navigation.goBack()} style={[styles.btn, styles.ghostBtn]}>
                <Text style={[styles.btnGhostText, text]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setEditing(true)} style={[styles.btn, styles.neutralBtn]}>
                <Text style={styles.neutralText}>Edit</Text>
              </Pressable>
              <Pressable onPress={onShare} style={[styles.btn, { backgroundColor: colors.primary }]}>
                <Text style={styles.primaryText}>Share</Text>
              </Pressable>
              <Pressable onPress={onDelete} style={[styles.btn, styles.dangerBtn]}>
                <Text style={styles.dangerText}>Delete</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => { setEditing(false); setTitle(item.title ?? ""); setPreview(item.inputPreview ?? ""); }} style={[styles.btn, styles.ghostBtn]}>
                <Text style={[styles.btnGhostText, text]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onSave} style={[styles.btn, { backgroundColor: colors.primary }]}>
                <Text style={styles.primaryText}>Save</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { opacity: 0.7 },

  card: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  title: { fontSize: 28, fontWeight: "800" },
  titleInput: { fontSize: 24, fontWeight: "800", paddingVertical: 6 },
  timestamp: { fontSize: 12, opacity: 0.6 },

  key: { fontSize: 16, fontWeight: "700" },
  value: { fontWeight: "400" },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  preview: { fontSize: 15, lineHeight: 22 },
  previewInput: { minHeight: 120, borderWidth: 1, borderRadius: 10, padding: 10 },

  image: { width: "100%", height: 220, borderRadius: 10, backgroundColor: "#ddd", marginTop: 8 },

  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  ghostBtn: { borderWidth: 1 },
  btnGhostText: { fontWeight: "700" },
  neutralBtn: { backgroundColor: "#eee" },
  neutralText: { fontWeight: "700" },
  dangerBtn: { backgroundColor: "#ef4444" },
  dangerText: { color: "white", fontWeight: "700" },
  primaryText: { color: "white", fontWeight: "700" },
});
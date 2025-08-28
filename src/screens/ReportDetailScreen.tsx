import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  Alert,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ navigation, route }: Props) {
  const { items, remove, update } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();
  const border = { borderColor: colors.border, borderWidth: 1 };

  const id = route?.params?.id ?? "";
  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const [inputPreview, setInputPreview] = useState(item?.inputPreview ?? "");

  // Header share button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        item ? (
          <Pressable onPress={onShare} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Share</Text>
          </Pressable>
        ) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, item, colors.primary, title, inputPreview]);

  if (!id || !item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.title, text]}>Report not found</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card, border]}>
          <Text style={[styles.btnText, text]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  // From here on, treat as non-null for TS
  const it = item as NonNullable<typeof item>;

  const onShare = async () => {
    const body =
      `${it.title}\n${new Date(it.createdAt).toLocaleString()}\n` +
      `Score: ${it.score}\nRisk: ${it.verdict}\n` +
      `Flags: ${it.flags.length ? it.flags.join(", ") : "none"}` +
      (it.inputPreview ? `\n\nInput Preview:\n${it.inputPreview}` : "");
    try {
      await Share.share({ message: body });
    } catch (e) {
      Alert.alert("Share failed", String(e));
    }
  };

  const onDelete = () => {
    Alert.alert("Delete report?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          remove(it.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const startEdit = () => {
    setTitle(it.title ?? "");
    setInputPreview(it.inputPreview ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setTitle(it.title ?? "");
    setInputPreview(it.inputPreview ?? "");
  };

  const saveEdit = () => {
    update(it.id, { title: title.trim() || it.title, inputPreview });
    setEditing(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, bg]}>
      {/* Title card */}
      <View style={[styles.card, card, border]}>
        {editing ? (
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[styles.h1Input, text]}
            placeholder="Title"
          />
        ) : (
          <Text style={[styles.h1, text]}>{it.title}</Text>
        )}
        <Text style={[styles.sub, muted]}>{new Date(it.createdAt).toLocaleString()}</Text>
      </View>

      {/* Stats card */}
      <View style={[styles.card, card, border]}>
        <Text style={[styles.kv, text]}>
          <Text style={styles.k}>Score: </Text>
          {it.score}
        </Text>
        <Text style={[styles.kv, text]}>
          <Text style={styles.k}>Risk: </Text>
          {it.verdict}
        </Text>
        <Text style={[styles.kv, text]}>
          <Text style={styles.k}>Flags: </Text>
          {it.flags.length ? it.flags.join(", ") : "none"}
        </Text>
      </View>

      {/* Preview card */}
      <View style={[styles.card, card, border]}>
        <Text style={[styles.sectionTitle, text]}>Input Preview</Text>
        {editing ? (
          <TextInput
            value={inputPreview}
            onChangeText={setInputPreview}
            style={[styles.previewInput, text]}
            multiline
            textAlignVertical="top"
            placeholder="Notes or original text preview…"
          />
        ) : (
          <Text style={[styles.preview, text]} numberOfLines={6}>
            {it.inputPreview || "—"}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.row}>
        {editing ? (
          <>
            <Pressable onPress={cancelEdit} style={[styles.btn, card, border]}>
              <Text style={[styles.btnText, text]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEdit} style={[styles.btn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.btnText, { color: "white", fontWeight: "700" }]}>Save</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card, border]}>
              <Text style={[styles.btnText, text]}>Back</Text>
            </Pressable>
            <Pressable onPress={startEdit} style={[styles.btn, card, border]}>
              <Text style={[styles.btnText, text]}>Edit</Text>
            </Pressable>
            <Pressable onPress={onShare} style={[styles.btn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.btnText, { color: "white", fontWeight: "700" }]}>Share</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={[styles.btn, styles.danger]}>
              <Text style={[styles.btnText, styles.dangerText]}>Delete</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "700" },

  card: { padding: 12, borderRadius: 12, gap: 8 },
  h1: { fontSize: 28, fontWeight: "800" },
  h1Input: { fontSize: 24, fontWeight: "700", padding: 0 },
  sub: { fontSize: 12, opacity: 0.7 },

  kv: { fontSize: 16, marginVertical: 2 },
  k: { fontWeight: "800" },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  preview: { opacity: 0.9 },
  previewInput: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 6 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { fontWeight: "600" },
  danger: { backgroundColor: "#ef4444" },
  dangerText: { color: "white", fontWeight: "700" },
});
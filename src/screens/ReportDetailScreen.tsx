// src/screens/ReportDetailScreen.tsx
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Share,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { items, hydrated, remove, update } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  // Edit state (title only)
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // When item changes, sync draft
  useEffect(() => {
    if (item) setTitleDraft(item.title);
  }, [item]);

  // Header Share button only when we have an item
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        item ? (
          <Pressable
            onPress={() => onShare(item)}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Share</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, item, colors.primary]);

  if (!hydrated) {
    return (
      <View style={[styles.center, bg]}>
        <ActivityIndicator />
        <Text style={[styles.muted, muted]}>Loading…</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.title, text]}>Report not found</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card]}>
          <Text style={[styles.btnText, text]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  // ----- handlers that take a concrete SavedAnalysis -----

  function onShare(it: SavedAnalysis) {
    const lines = [
      `📄 ${it.title}`,
      new Date(it.createdAt).toLocaleString(),
      `Score: ${it.score}`,
      `Risk: ${it.verdict}`,
      `Flags: ${it.flags.length ? it.flags.join(", ") : "none"}`,
      it.inputPreview ? `\nPreview:\n${it.inputPreview}` : "",
      it.imageUri ? `\nScreenshot: ${it.imageUri}` : "",
    ].filter(Boolean);
    Share.share({ message: lines.join("\n") }).catch(() =>
      Alert.alert("Share failed", "Unable to open the system share sheet.")
    );
  }

  function onDelete(it: SavedAnalysis) {
    Alert.alert("Delete Report", "This cannot be undone.", [
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
  }

  function startEdit(it: SavedAnalysis) {
    setTitleDraft(it.title);
    setEditing(true);
  }

  function saveEdit(it: SavedAnalysis) {
    const next = titleDraft.trim();
    if (!next) {
      Alert.alert("Title required", "Please enter a title.");
      return;
    }
    update(it.id, { title: next });
    setEditing(false);
  }

  // ----- render -----

  return (
    <ScrollView style={[{ flex: 1 }, bg]} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Title */}
      <View style={[styles.headerCard, card]}>
        {editing ? (
          <TextInput
            value={titleDraft}
            onChangeText={setTitleDraft}
            style={[styles.titleInput, text]}
            placeholder="Title"
          />
        ) : (
          <Text style={[styles.screenTitle, text]}>{item.title}</Text>
        )}
        <Text style={[styles.date, muted]}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>

      {/* Score/Risk/Flags */}
      <View style={[styles.block, card]}>
        <Text style={[styles.rowKey, text]}>
          Score: <Text style={styles.rowVal}>{item.score}</Text>
        </Text>
        <Text style={[styles.rowKey, text]}>
          Risk: <Text style={styles.rowVal}>{item.verdict}</Text>
        </Text>
        <Text style={[styles.rowKey, text]}>
          Flags:{" "}
          <Text style={styles.rowVal}>
            {item.flags.length ? item.flags.join(", ") : "none"}
          </Text>
        </Text>
      </View>

      {/* Input Preview */}
      {item.inputPreview ? (
        <View style={[styles.block, card]}>
          <Text style={[styles.blockTitle, text]}>Input Preview</Text>
          <Text style={[styles.preview, text]}>{item.inputPreview}</Text>
        </View>
      ) : null}

      {/* Screenshot */}
      {item.imageUri ? (
        <View style={[styles.block, card, { padding: 8 }]}>
          <Image source={{ uri: item.imageUri }} style={styles.image} />
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.row}>
        {!editing ? (
          <>
            <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card]}>
              <Text style={[styles.btnText, text]}>Back</Text>
            </Pressable>
            <Pressable onPress={() => startEdit(item)} style={[styles.btn, card]}>
              <Text style={[styles.btnText, text]}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => onShare(item)}
              style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.btnPrimaryText}>Share</Text>
            </Pressable>
            <Pressable onPress={() => onDelete(item)} style={styles.btnDanger}>
              <Text style={styles.btnDangerText}>Delete</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => setEditing(false)} style={[styles.btn, card]}>
              <Text style={[styles.btnText, text]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => saveEdit(item)}
              style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.btnPrimaryText}>Save</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  headerCard: { padding: 12, borderRadius: 14, borderWidth: 1 },
  screenTitle: { fontSize: 26, fontWeight: "800" },
  titleInput: { fontSize: 22, fontWeight: "700", paddingVertical: 8 },
  date: { marginTop: 4, fontSize: 12 },
  block: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 8 },
  blockTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  rowKey: { fontSize: 16, fontWeight: "700" },
  rowVal: { fontWeight: "600" },
  preview: { fontSize: 14, opacity: 0.9 },
  image: { width: "100%", height: 240, borderRadius: 12, backgroundColor: "#222" },

  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnText: { fontWeight: "700" },

  btnPrimary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnPrimaryText: { color: "white", fontWeight: "700" },

  btnDanger: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f24a3d",
  },
  btnDangerText: { color: "white", fontWeight: "700" },

  title: { fontSize: 20, fontWeight: "700" },
  muted: { opacity: 0.7 },
});
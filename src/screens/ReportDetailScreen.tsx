import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { id } = route.params ?? ({} as any);
  const { items, update, remove } = useSavedItems();
  const { bg, card, text, colors } = useColors();

  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item?.title ?? "");
  const [draftNotes, setDraftNotes] = useState(item?.notes ?? "");
  const [draftFlags, setDraftFlags] = useState(item ? item.flags.join(", ") : "");

  useEffect(() => {
    setDraftTitle(item?.title ?? "");
    setDraftNotes(item?.notes ?? "");
    setDraftFlags(item ? item.flags.join(", ") : "");
  }, [item?.id]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Pressable onPress={onShare} hitSlop={8}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Share</Text>
          </Pressable>
          <Pressable onPress={() => (editing ? onSave() : setEditing(true))} hitSlop={8}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {editing ? "Save" : "Edit"}
            </Text>
          </Pressable>
        </View>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, colors.primary, editing, draftTitle, draftNotes, draftFlags, id]);

  if (!id) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.title, text]}>Missing report id</Text>
      </View>
    );
  }
  if (!item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.title, text]}>Report not found</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontWeight: "700" }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  // From here on, TS knows 'item' exists
  const i: SavedAnalysis = item;

  function onSave() {
    const cleanedFlags = draftFlags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const uniqueFlags = Array.from(new Set(cleanedFlags));

    const partial: Partial<SavedAnalysis> = {};
    if (draftTitle !== i.title) partial.title = draftTitle;
    if ((i.notes ?? "") !== draftNotes) partial.notes = draftNotes;
    if (uniqueFlags.join("|") !== i.flags.join("|")) partial.flags = uniqueFlags;

    if (Object.keys(partial).length === 0) {
      setEditing(false);
      return;
    }
    update(i.id, partial);
    setEditing(false);
  }

  async function onShare() {
    const shareText = [
      i.title,
      new Date(i.createdAt).toLocaleString(),
      `Score: ${i.score} — ${i.verdict} risk`,
      `Flags: ${i.flags.length ? i.flags.join(", ") : "none"}`,
      i.notes ? `Notes: ${i.notes}` : "",
      i.inputPreview ? `\nPreview:\n${i.inputPreview}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await Share.share({ message: shareText });
    } catch {}
  }

  function onDelete() {
    Alert.alert("Delete report?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          remove(i.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView style={[{ flex: 1 }, bg]} contentContainerStyle={styles.container}>
      {/* Title + timestamp */}
      <View style={[styles.card, card]}>
        {editing ? (
          <TextInput
            style={[styles.bigTitleInput, text]}
            placeholder="Title"
            value={draftTitle}
            onChangeText={setDraftTitle}
          />
        ) : (
          <Text style={[styles.bigTitle, text]}>{i.title}</Text>
        )}
        <Text style={[styles.sub, { opacity: 0.7 }]}>
          {new Date(i.createdAt).toLocaleString()}
        </Text>
      </View>

      {/* Score & flags */}
      <View style={[styles.card, card]}>
        <Text style={[styles.h2, text]}>
          Score: <Text style={styles.bold}>{i.score}</Text>
        </Text>
        <Text style={[styles.h2, text]}>
          Risk: <Text style={styles.bold}>{i.verdict}</Text>
        </Text>

        <View style={{ marginTop: 8 }}>
          <Text style={[styles.h2, text]}>Flags</Text>
          {editing ? (
            <TextInput
              style={[styles.input, text]}
              placeholder="Comma-separated e.g. whatsapp, high pay"
              placeholderTextColor={"#999"}
              value={draftFlags}
              onChangeText={setDraftFlags}
              autoCorrect={false}
              autoCapitalize="none"
            />
          ) : (
            <Text style={[styles.pre, { opacity: 0.8 }]}>
              {i.flags.length ? i.flags.join(", ") : "none"}
            </Text>
          )}
        </View>
      </View>

      {/* Notes */}
      <View style={[styles.card, card]}>
        <Text style={[styles.h2, text]}>Notes</Text>
        {editing ? (
          <TextInput
            style={[styles.textArea, text]}
            placeholder="Add your notes (not used for scoring)"
            placeholderTextColor={"#999"}
            value={draftNotes}
            onChangeText={setDraftNotes}
            multiline
          />
        ) : (
          <Text style={[styles.pre, { opacity: 0.9 }]}>
            {i.notes?.trim() ? i.notes : "—"}
          </Text>
        )}
      </View>

      {/* Input preview */}
      {i.inputPreview ? (
        <View style={[styles.card, card]}>
          <Text style={[styles.h2, text]}>Input Preview</Text>
          <Text style={[styles.pre, { opacity: 0.9 }]}>{i.inputPreview}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.row}>
        <Pressable onPress={() => navigation.goBack()} style={styles.btn}>
          <Text style={styles.btnText}>Back</Text>
        </Pressable>

        <Pressable
          onPress={editing ? onSave : () => setEditing(true)}
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.btnText, { color: "white", fontWeight: "700" }]}>
            {editing ? "Save" : "Edit"}
          </Text>
        </Pressable>

        <Pressable onPress={onDelete} style={[styles.btn, styles.destructiveBtn]}>
          <Text style={[styles.btnText, { color: "#c53030", fontWeight: "700" }]}>
            Delete
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 12, paddingBottom: 30 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    padding: 12,
    gap: 8,
  },

  bigTitle: { fontSize: 28, fontWeight: "800" },
  bigTitleInput: { fontSize: 24, fontWeight: "800", paddingVertical: 6 },
  sub: { fontSize: 12 },

  h2: { fontSize: 16, fontWeight: "700" },
  bold: { fontWeight: "800" },
  pre: { fontSize: 15, lineHeight: 20 },

  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10 },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },

  row: { flexDirection: "row", gap: 10, justifyContent: "flex-start" },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  destructiveBtn: {
    backgroundColor: "#fdecec",
    borderWidth: 1,
    borderColor: "#f6caca",
  },
  btnText: { fontWeight: "700" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 10 },

  // ⬅️ added to fix missing style
  backBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
});
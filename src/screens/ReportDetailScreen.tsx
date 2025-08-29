import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Share,
  ScrollView,
  TextInput,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems, type SavedAnalysis } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

const FLAG_LIBRARY = [
  "whatsapp/telegram/signal contact",
  "gift card payment",
  "crypto payment",
  "wire/transfer payment",
  "upfront/training/equipment fee",
  "unrealistic pay",
  "too-easy workload",
  "non-corporate email",
  "chat-app interview",
  "OTP via chat",
  "suspicious domain",
  "note", // keep last so it’s easy to hide in view mode if desired
];

export default function ReportDetailScreen({ navigation, route }: Props) {
  const { id } = route.params || ({} as any);
  const { items, remove, update } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  // locate the item; if missing, bail gracefully
  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  // edit state
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const [notes, setNotes] = useState(extractNote(item));
  const [flagSet, setFlagSet] = useState<Set<string>>(new Set(item?.flags ?? []));

  // keep local state in sync if navigating between items
  React.useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setNotes(extractNote(item));
    setFlagSet(new Set(item.flags ?? []));
  }, [item?.id]);

  // header: Share button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        item ? (
          <Pressable onPress={() => shareItem(item)} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Share</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, item, colors.primary]);

  if (!item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.muted, muted]}>This report no longer exists.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.btnPrimaryText}>Back</Text>
        </Pressable>
      </View>
    );
  }

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

  const onToggleFlag = (flag: string) => {
    setFlagSet((prev) => {
      const next = new Set(prev);
      next.has(flag) ? next.delete(flag) : next.add(flag);
      return next;
    });
  };

  const onCancelEdit = () => {
    setEditing(false);
    setTitle(item.title);
    setNotes(extractNote(item));
    setFlagSet(new Set(item.flags ?? []));
  };

  const onSaveEdit = () => {
    // We store notes separately if your SavedAnalysis has `notes` (add it if you prefer).
    // If not, we’ll keep the legacy behavior: ensure "note" tag remains when notes exist.
    const flags = Array.from(flagSet);
    const cleanedFlags = notes.trim()
      ? Array.from(new Set([...flags, "note"]))
      : flags.filter((f) => f !== "note");

    const patch: Partial<SavedAnalysis> = {
      title: title.trim() || item.title,
      flags: cleanedFlags,
    };

    // If you have `notes` in SavedAnalysis, include: patch.notes = notes.trim();
    // Otherwise you could keep notes in a metadata flag like `note: <text>`.
    // The example below writes `note: …` as a synthetic flag. Comment out if you added real `notes`.
    const withoutNoteText = cleanedFlags.filter((f) => !f.startsWith("note:"));
    const withNoteText =
      notes.trim().length > 0 ? [...withoutNoteText.filter((f) => f !== "note"), `note:${notes.trim()}`] : withoutNoteText;

    patch.flags = withNoteText;

    update(item.id, patch);
    setEditing(false);
  };

  return (
    <ScrollView style={bg} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Title */}
      <View style={[styles.card, card]}>
        {editing ? (
          <TextInput
            style={[styles.titleInput, text]}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={(muted.color as string) || "#888"}
          />
        ) : (
          <Text style={[styles.title, text]}>{item.title}</Text>
        )}
        <Text style={[styles.sub, muted]}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>

      {/* Stats */}
      <View style={[styles.card, card]}>
        <Text style={[styles.rowL, text]}>Score: <Text style={styles.rowR}>{item.score}</Text></Text>
        <Text style={[styles.rowL, text]}>Risk: <Text style={styles.rowR}>{item.verdict}</Text></Text>

        {/* Flags */}
        <Text style={[styles.rowL, text, { marginTop: 8 }]}>Flags:</Text>
        {editing ? (
          <View style={styles.flagWrap}>
            {FLAG_LIBRARY.map((f) => {
              const active = flagSet.has(f) || (f === "note" && notes.trim().length > 0);
              return (
                <Pressable
                  key={f}
                  onPress={() => onToggleFlag(f)}
                  style={[
                    styles.flagChip,
                    active && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.flagText, active ? { color: "white" } : text]}>
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.mono, muted]}>
            {renderFlagsForView(item.flags)}
          </Text>
        )}
      </View>

      {/* Preview */}
      {item.inputPreview ? (
        <View style={[styles.card, card]}>
          <Text style={[styles.label, text]}>Input Preview</Text>
          <Text style={[styles.body, text]}>{item.inputPreview}</Text>
        </View>
      ) : null}

      {/* Notes (inline) */}
      <View style={[styles.card, card]}>
        <Text style={[styles.label, text]}>Notes</Text>
        {editing ? (
          <TextInput
            style={[styles.notesInput, text]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes (not used for scoring)"
            placeholderTextColor={(muted.color as string) || "#888"}
            multiline
          />
        ) : (
          <Text style={[styles.body, muted]}>{notes ? notes : "—"}</Text>
        )}
      </View>

      {/* Buttons */}
      {editing ? (
        <View style={styles.row}>
          <Pressable onPress={onCancelEdit} style={[styles.btn, styles.btnGhost]}>
            <Text style={styles.btnGhostText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onSaveEdit} style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnPrimaryText}>Save</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.btn, styles.btnGhost]}>
            <Text style={styles.btnGhostText}>Back</Text>
          </Pressable>
          <Pressable onPress={() => setEditing(true)} style={[styles.btn, styles.btnGhost]}>
            <Text style={styles.btnGhostText}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => shareItem(item)} style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnPrimaryText}>Share</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.btn, styles.btnDestructive]}>
            <Text style={styles.btnDestructiveText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

/** ————— helpers ————— */

function renderFlagsForView(flags: string[] = []) {
  // Hide any "note:..." synthetic flag in view; show plain 'note' if no text.
  const shown = flags.filter((f) => !f.startsWith("note:"));
  return shown.length ? shown.join(", ") : "none";
}

function extractNote(item?: SavedAnalysis): string {
  if (!item?.flags) return "";
  const noteFlag = item.flags.find((f) => f.startsWith("note:"));
  if (noteFlag) return noteFlag.slice("note:".length).trim();
  // Legacy ‘note’ tag without text → show empty
  return "";
}

async function shareItem(item: SavedAnalysis) {
  try {
    const bodyLines = [
      `Title: ${item.title}`,
      `Date: ${new Date(item.createdAt).toLocaleString()}`,
      `Score: ${item.score}`,
      `Risk: ${item.verdict}`,
      `Flags: ${renderFlagsForView(item.flags)}`,
      item.inputPreview ? `\nInput Preview:\n${item.inputPreview}` : "",
    ].filter(Boolean);
    await Share.share({
      title: `Report: ${item.title}`,
      message: bodyLines.join("\n"),
    });
  } catch {}
}

/** ————— styles ————— */

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  card: { borderRadius: 12, padding: 12, borderWidth: 1 },
  title: { fontSize: 28, fontWeight: "800" },
  titleInput: { fontSize: 24, fontWeight: "700", paddingVertical: 4 },
  sub: { fontSize: 12, marginTop: 6, opacity: 0.7 },
  rowL: { fontSize: 16, fontWeight: "700", marginTop: 6 },
  rowR: { fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  body: { fontSize: 16, lineHeight: 22 },
  mono: { fontSize: 13 },
  notesInput: { minHeight: 80, paddingVertical: 8 },

  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 2 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: "#eee" },
  btnGhostText: { fontWeight: "700" },
  btnPrimaryText: { color: "white", fontWeight: "700" },
  btnDestructive: { backgroundColor: "#f3d2d0" },
  btnDestructiveText: { color: "#c23a2f", fontWeight: "700" },

  flagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  flagChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  flagText: { fontWeight: "600" },

  muted: { opacity: 0.7 },
});
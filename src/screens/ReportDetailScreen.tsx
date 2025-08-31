// src/screens/ReportDetailScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { useColors } from "../theme/useColors";
import { useSavedItems } from "../store/savedItems";

type Props = { navigation: any; route: { params: { id: string } } };

export default function ReportDetailScreen({ navigation, route }: Props) {
  const { colors, bg, card, text, muted } = useColors();
  const { items, update, remove } = useSavedItems();
  const item = items.find((i) => i.id === route.params.id);

  const [editing, setEditing] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState(item?.title ?? "");
  const [flagsInput, setFlagsInput] = React.useState(
    item?.flags?.join(", ") ?? ""
  );

  React.useEffect(() => {
    // keep inputs in sync if item changes (e.g., after import/merge)
    if (item) {
      setTitleInput(item.title ?? "");
      setFlagsInput(Array.isArray(item.flags) ? item.flags.join(", ") : "");
    }
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Report",
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>‹ Back</Text>
        </Pressable>
      ),
      headerRight: () =>
        item ? (
          <Pressable
            onPress={() => {
              if (editing) {
                // Save & exit
                const cleanedTitle = titleInput.trim() || "Untitled";
                const cleanedFlags = flagsInput
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const dedup = Array.from(new Set(cleanedFlags));

                update(item.id, { title: cleanedTitle, flags: dedup });
              }
              setEditing((e) => !e);
            }}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {editing ? "Done" : "Edit"}
            </Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, colors.primary, editing, titleInput, flagsInput, item?.id]); // eslint-disable-line

  if (!item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={text}>This report no longer exists.</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const shareOne = async () => {
    try {
      const body = [
        `Scamicide report: ${item.title}`,
        `Created: ${new Date(item.createdAt).toLocaleString()}`,
        `Risk: ${item.verdict} (${item.score})`,
        item.flags.length ? `Flags: ${item.flags.join(", ")}` : "",
        item.inputPreview ? `Preview: ${item.inputPreview}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const path = `${FileSystem.cacheDirectory}report-${item.id}.txt`;
      await FileSystem.writeAsStringAsync(path, body, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(path, {
        mimeType: "text/plain",
        UTI: "public.plain-text",
        dialogTitle: "Share report",
      } as any);

      try {
        await FileSystem.deleteAsync(path, { idempotent: true });
      } catch {}
    } catch (e) {
      Alert.alert("Share failed", String(e));
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete report?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            remove(item.id);
            navigation.goBack();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={bg} contentContainerStyle={styles.scroll}>
      <View style={[styles.card, card, { borderColor: colors.border }]}>
        {/* Title (inline edit) */}
        {editing ? (
          <TextInput
            value={titleInput}
            onChangeText={setTitleInput}
            placeholder="Title"
            placeholderTextColor={muted.color as string}
            style={[styles.titleInput, text, { borderColor: colors.border }]}
          />
        ) : (
          <Text style={[styles.title, text]} numberOfLines={2}>
            {item.title}
          </Text>
        )}

        <Text style={[styles.sub, muted]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>

        <Text style={[styles.row, text]}>
          Score: <Text style={{ fontWeight: "800" }}>{item.score}</Text> —{" "}
          {item.verdict} risk
        </Text>

        {/* Flags (inline edit as comma list) */}
        <Text style={[styles.sectionLabel, muted]}>Flags</Text>
        {editing ? (
          <TextInput
            value={flagsInput}
            onChangeText={setFlagsInput}
            placeholder="Comma-separated (e.g. whatsapp, gift card, daily pay)"
            placeholderTextColor={muted.color as string}
            style={[styles.flagsInput, text, { borderColor: colors.border }]}
            multiline
          />
        ) : (
          <Text style={[styles.flags, muted]}>
            {item.flags.length ? item.flags.join(", ") : "none"}
          </Text>
        )}

        {/* Preview */}
        {item.inputPreview ? (
          <>
            <Text style={[styles.sectionLabel, muted]}>Preview</Text>
            <Text style={[styles.preview, text]}>{item.inputPreview}</Text>
          </>
        ) : null}

        {/* Actions */}
        <View style={styles.rowBtns}>
          {!editing && (
            <Pressable
              onPress={shareOne}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.btnText}>Share</Text>
            </Pressable>
          )}
          {!editing && (
            <Pressable
              onPress={confirmDelete}
              style={[styles.btn, { backgroundColor: "#c62828" }]}
            >
              <Text style={styles.btnText}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 10 },

  title: { fontSize: 20, fontWeight: "800" },
  titleInput: {
    fontSize: 20,
    fontWeight: "800",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sub: { fontSize: 12, opacity: 0.7 },

  row: { fontSize: 14 },

  sectionLabel: { fontSize: 12, marginTop: 6, marginBottom: -2 },

  flags: { fontSize: 13, opacity: 0.85 },
  flagsInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    minHeight: 48,
  },

  preview: { marginTop: 4, fontSize: 13, opacity: 0.95 },

  rowBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "700" },
});
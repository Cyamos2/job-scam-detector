// src/screens/ReportDetailScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { useColors } from "../theme/useColors";
import { useSavedItems } from "../store/savedItems";

type Props = { navigation: any; route: { params: { id: string } } };

export default function ReportDetailScreen({ navigation, route }: Props) {
  const { colors, bg, card, text, muted } = useColors();
  const { items } = useSavedItems();
  const item = items.find((i) => i.id === route.params.id);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Report",
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>‹ Back</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.primary]);

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
      await FileSystem.writeAsStringAsync(path, body, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(path, {
        mimeType: "text/plain",
        UTI: "public.plain-text",
        dialogTitle: "Share report",
      } as any);
      
      // optional cleanup
      try { await FileSystem.deleteAsync(path, { idempotent: true }); } catch {}
    } catch (e) {
      Alert.alert("Share failed", String(e));
    }
  };

  return (
    <ScrollView style={bg} contentContainerStyle={styles.scroll}>
      <View style={[styles.card, card, { borderColor: colors.border }]}>
        <Text style={[styles.title, text]}>{item.title}</Text>
        <Text style={[styles.sub, text]}>{new Date(item.createdAt).toLocaleString()}</Text>

        <Text style={[styles.row, text]}>
          Score: <Text style={{ fontWeight: "800" }}>{item.score}</Text> — {item.verdict} risk
        </Text>
        <Text style={[styles.row, muted]}>
          Flags: {item.flags.length ? item.flags.join(", ") : "none"}
        </Text>

        {item.inputPreview ? (
          <Text style={[styles.preview, text]}>{item.inputPreview}</Text>
        ) : null}

        <View style={styles.rowBtns}>
          <Pressable onPress={shareOne} style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnText}>Share</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card, { borderColor: colors.border }]}>
            <Text style={text}>Close</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  title: { fontSize: 18, fontWeight: "800" },
  sub: { fontSize: 12, opacity: 0.7 },
  row: { fontSize: 14 },
  preview: { marginTop: 6, fontSize: 13, opacity: 0.85 },
  rowBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  btnText: { color: "white", fontWeight: "700" },
});
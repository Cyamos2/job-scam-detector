import React, { useLayoutEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, Share, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { items, remove } = useSavedItems();
  const { bg, card, text, muted, colors } = useColors();

  const item = items.find((x) => x.id === id);

  // Guard first so `item` is non-null below
  if (!item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={[styles.muted, muted]}>Not found.</Text>
      </View>
    );
  }

  const share = () => {
    const body =
`📄 ${item.title}
Score: ${item.score} — ${item.verdict} risk
Flags: ${item.flags.join(", ") || "none"}
Preview: ${item.inputPreview || "(no text)"} 
#JobScamDetector`;
    Share.share({ message: body }).catch(() => {});
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={share} style={{ paddingHorizontal: 10 }}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Share</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.primary, item.id]); // item is safe here

  const onDelete = () => {
    Alert.alert("Delete", "Remove this report?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { remove(item.id); navigation.goBack(); } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, bg]}>
      <Text style={[styles.title, text]}>{item.title}</Text>
      <Text style={[styles.muted, muted]}>{new Date(item.createdAt).toLocaleString()}</Text>

      <View style={[styles.box, card]}>
        <Text style={[styles.rowText, text]}><Text style={styles.bold}>Score:</Text> {item.score}</Text>
        <Text style={[styles.rowText, text]}><Text style={styles.bold}>Risk:</Text> {item.verdict}</Text>
        <Text style={[styles.rowText, text]}><Text style={styles.bold}>Flags:</Text> {item.flags.join(", ") || "none"}</Text>
      </View>

      {item.inputPreview ? (
        <View style={[styles.box, card]}>
          <Text style={[styles.subTitle, text]}>Input Preview</Text>
          <Text style={[styles.body, text]}>{item.inputPreview}</Text>
        </View>
      ) : null}

      {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" /> : null}

      <View style={styles.actions}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card]}>
          <Text style={[styles.btnText, text]}>Back</Text>
        </Pressable>
        <Pressable onPress={share} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.btnText, { color: "white", fontWeight: "700" }]}>Share</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.btn, styles.destructive]}>
          <Text style={[styles.btnText, { color: "white", fontWeight: "700" }]}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800" },
  subTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  body: { fontSize: 14 },
  muted: { opacity: 0.7 },
  box: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  rowText: { fontSize: 14 },
  bold: { fontWeight: "700" },
  image: { width: "100%", height: 260, borderRadius: 12, backgroundColor: "#ddd" },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnText: { fontSize: 14 },
  destructive: { backgroundColor: "#e5534b" },
});
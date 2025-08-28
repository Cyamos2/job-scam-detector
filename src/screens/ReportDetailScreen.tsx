import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems } from "../store/savedItems";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { items, remove } = useSavedItems();
  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Report not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const onDelete = () => {
    Alert.alert("Delete report?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { remove(item.id); navigation.goBack(); } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.sub}>{new Date(item.createdAt).toLocaleString()}</Text>

      <View style={styles.card}>
        <Text style={styles.line}><Text style={styles.bold}>Score:</Text> {item.score}</Text>
        <Text style={styles.line}><Text style={styles.bold}>Risk:</Text> {item.verdict}</Text>
        <Text style={styles.line}><Text style={styles.bold}>Flags:</Text> {item.flags.length ? item.flags.join(", ") : "none"}</Text>
      </View>

      {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" /> : null}

      {item.inputPreview ? (
        <View style={styles.card}>
          <Text style={styles.section}>Input Preview</Text>
          <Text style={styles.body}>{item.inputPreview}</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable onPress={() => navigation.goBack()} style={styles.neutralBtn}>
          <Text style={styles.neutralText}>Back</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.dangerBtn}>
          <Text style={styles.dangerText}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { opacity: 0.7 },
  card: { gap: 6, padding: 12, backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "#eee" },
  image: { width: "100%", height: 260, borderRadius: 12, backgroundColor: "#ddd" },
  section: { fontWeight: "700", marginBottom: 6 },
  line: { fontSize: 16 },
  bold: { fontWeight: "700" },
  body: { lineHeight: 20 },
  row: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  primaryBtn: { backgroundColor: "#1b72e8", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  primaryText: { color: "white", fontWeight: "700" },
  neutralBtn: { backgroundColor: "#eee", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  neutralText: { fontWeight: "700" },
  dangerBtn: { backgroundColor: "#ffe5e5", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#f3b3b3" },
  dangerText: { color: "#c00", fontWeight: "700" },
  muted: { opacity: 0.7 },
});
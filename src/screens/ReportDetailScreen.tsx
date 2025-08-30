import React from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { items, remove } = useSavedItems();
  const { colors, bg, card, text, muted } = useColors();

  const item = items.find((x) => x.id === id);

  if (!item) {
    return (
      <View style={[styles.center, bg]}>
        <Text style={text}>Report not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const onDelete = () =>
    Alert.alert("Delete", "Remove this report?", [
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

  return (
    <ScrollView style={[{ flex: 1 }, bg]} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={[styles.panel, card, { borderColor: colors.border }]}>
        <Text style={[styles.big, text]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={muted}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>

      <View style={[styles.panel, card, { borderColor: colors.border }]}>
        <Text style={[styles.label, text]}>Score: {item.score}</Text>
        <Text style={[styles.label, text]}>Risk: {item.verdict}</Text>
        <Text style={muted}>Flags: {item.flags?.join(", ") || "none"}</Text>
      </View>

      <View style={[styles.panel, card, { borderColor: colors.border }]}>
        <Text style={[styles.label, text]}>Input Preview</Text>
        <Text style={text}>{item.inputPreview}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card]}>
          <Text style={text}>Back</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.btn, { backgroundColor: "#f55" }]}>
          <Text style={{ color: "white", fontWeight: "700" }}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  backBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  panel: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  big: { fontSize: 22, fontWeight: "800" },
  label: { fontWeight: "700" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
});
// src/screens/ReportDetailScreen.tsx
import React from "react";
import { View, Text, Alert, Pressable, StyleSheet, TextInput, Share, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatabaseStackParamList } from "../navigation/DatabaseStack";
import { useSavedItems } from "../store/savedItems";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<DatabaseStackParamList, "ReportDetail">;

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { id } = route.params ?? { id: "" };
  const { items, update, remove } = useSavedItems();
  const { text, card, colors } = useColors();

  const item = items.find(x => x.id === id);
  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Text style={[{ fontSize: 16, opacity: 0.7 }, text]}>This report no longer exists.</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 12, padding: 10 }}>
          <Text style={[{ color: colors.primary, fontWeight: "700" }, text]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const onShare = () =>
    Share.share({
      title: item.title,
      message:
        `Title: ${item.title}\n` +
        `When: ${new Date(item.createdAt).toLocaleString()}\n` +
        `Score: ${item.score} — ${item.verdict} risk\n` +
        `Flags: ${item.flags.join(", ") || "none"}\n\n` +
        (item.inputPreview || ""),
    });

  const onDelete = () =>
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={[styles.card, card]}>
        <TextInput
          style={[styles.title, text]}
          value={item.title}
          onChangeText={(t) => update(item.id, { title: t })}
        />
        <Text style={[{ opacity: 0.6, marginTop: 6 }, text]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>

      <View style={[styles.card, card]}>
        <Text style={[styles.kv, text]}>Score: {item.score}</Text>
        <Text style={[styles.kv, text]}>Risk: {item.verdict}</Text>
        <Text style={[styles.kv, text]}>Flags: {item.flags.length ? item.flags.join(", ") : "none"}</Text>
      </View>

      <View style={[styles.card, card]}>
        <Text style={[styles.sectionTitle, text]}>Input Preview</Text>
        <TextInput
          style={[styles.body, text]}
          multiline
          value={item.inputPreview ?? ""}
          onChangeText={(t) => update(item.id, { inputPreview: t })}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.btn, card]}>
          <Text style={text}>Back</Text>
        </Pressable>
        <Pressable onPress={onShare} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: "white", fontWeight: "700" }}>Share</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.btn, { backgroundColor: "#e64b3a" }]}>
          <Text style={{ color: "white", fontWeight: "700" }}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6, borderColor: "#ddd" },
  title: { fontSize: 24, fontWeight: "800" },
  kv: { fontSize: 16, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  body: { minHeight: 96 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
});
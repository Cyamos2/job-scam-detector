// src/components/RowItem.tsx
import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@react-navigation/native";
import type { Job } from "../lib/api";

type Props = {
  item: Job;
  onPress?: (item: Job) => void;
  onEdit?: (item: Job) => void;
  onDelete?: (item: Job) => void;
};

export default function RowItem({ item, onPress, onEdit, onDelete }: Props) {
  const { colors, dark } = useTheme();
  const swipeRef = React.useRef<Swipeable>(null);

  const close = () => swipeRef.current?.close();

  const RightActions = () => (
    <View style={styles.actionsWrap}>
      <Pressable
        onPress={() => { close(); onEdit?.(item); }}
        style={[styles.actionBtn, { backgroundColor: "#2563eb" }]} // Edit (blue)
      >
        <Text style={styles.actionText}>Edit</Text>
      </Pressable>
      <Pressable
        onPress={() => { close(); onDelete?.(item); }}
        style={[styles.actionBtn, { backgroundColor: "#dc2626" }]} // Delete (red)
      >
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={RightActions} overshootRight={false}>
      <Pressable
        onPress={() => onPress?.(item)}
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: dark ? "#cbd5e1" : "#6B7280" }]} numberOfLines={1}>
          {item.company} • {item.risk?.toUpperCase()}
        </Text>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  title: { fontWeight: "700", marginBottom: 4 },
  meta: {},
  actionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    gap: 8,
    paddingRight: 10,
    paddingLeft: 8,
  },
  actionBtn: {
    minWidth: 78,
    height: "70%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  actionText: { color: "#fff", fontWeight: "800" },
});
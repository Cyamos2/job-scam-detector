// src/components/RowItem.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@react-navigation/native";
import ScoreBadge from "./ScoreBadge";
import { bucket, type Severity } from "../lib/scoring";

export type RowItemProps = {
  id: string;
  title: string;
  company: string;
  url?: string | null;
  risk: Severity;
  score: number;
  onPress: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
};

export default function RowItem({
  id,
  title,
  company,
  url,
  risk,
  score,
  onPress,
  onEdit,
  onDelete,
}: RowItemProps) {
  const { colors } = useTheme();
  const b = bucket(score);
  const [swiping, setSwiping] = React.useState(false);
  const swipeRef = React.useRef<Swipeable>(null);

  const handleDelete = () => {
    Alert.alert("Delete", "Remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await onDelete(id);
          swipeRef.current?.close();
        },
      },
    ]);
  };

  const RightActions = () => (
    <View style={styles.actionsRow}>
      <Pressable style={[styles.actionBtn, styles.edit]} onPress={() => { onEdit(id); swipeRef.current?.close(); }}>
        <Text style={styles.actionText}>Edit</Text>
      </Pressable>
      <Pressable style={[styles.actionBtn, styles.delete]} onPress={handleDelete}>
        <Text style={[styles.actionText, { color: "#fff" }]}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      renderRightActions={RightActions}
      onSwipeableWillOpen={() => setSwiping(true)}
      onSwipeableWillClose={() => setSwiping(false)}
    >
      <Pressable
        onPress={() => !swiping && onPress(id)}
        style={[
          styles.row,
          { borderColor: colors.border, backgroundColor: colors.card },
          tint(b),
        ]}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {company}
            {url ? ` · ${url}` : ""} · {risk.toUpperCase()}
          </Text>
        </View>
        <ScoreBadge score={score} />
      </Pressable>
    </Swipeable>
  );
}

const tint = (b: ReturnType<typeof bucket>) => {
  switch (b) {
    case "high":   return { backgroundColor: "#FEF2F2" };
    case "medium": return { backgroundColor: "#FFF7ED" };
    default:       return { backgroundColor: "#F0FDF4" };
  }
};

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  sub: { fontSize: 13, color: "#6B7280" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    gap: 8,
    paddingRight: 8,
  },
  actionBtn: {
    height: "80%",
    alignSelf: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  edit:   { backgroundColor: "#F3F4F6" },
  delete: { backgroundColor: "#EF4444" },
  actionText: { fontWeight: "800", color: "#111" },
});
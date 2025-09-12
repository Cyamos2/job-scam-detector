import * as React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useJobs } from "../hooks/useJobs";

export default function UndoBar() {
  const { pendingDelete, undoDelete } = useJobs();

  if (!pendingDelete) return null;

  const secondsLeft = Math.max(0, Math.ceil((pendingDelete.expiresAt - Date.now()) / 1000));

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        <Text style={styles.text} numberOfLines={1}>
          Deleted “{pendingDelete.job.title}”
          {Platform.OS === "ios" ? "" : `  (${secondsLeft}s)`}
        </Text>
        <Pressable onPress={undoDelete} style={styles.btn}>
          <Text style={styles.btnText}>Undo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    maxWidth: 520,
    width: "94%",
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  text: { color: "#fff", fontWeight: "600", marginRight: 12, flex: 1 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#374151",
    borderRadius: 999,
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
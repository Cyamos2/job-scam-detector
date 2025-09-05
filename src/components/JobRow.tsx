// src/components/JobRow.tsx
import * as React from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import ScoreBadge from "./ScoreBadge";
import type { Job } from "../lib/api";

type Props = {
  job: Job;
  score: number;
  onPress?: () => void;
  onDelete?: (id: string) => void; // NEW
};

export default function JobRow({ job, score, onPress, onDelete }: Props) {
  const { colors, dark } = useTheme();

  const tint =
    job.risk === "high"
      ? (dark ? "#3b1f1f" : "#FEF2F2")
      : job.risk === "medium"
      ? (dark ? "#3b2a1f" : "#FFF7ED")
      : (dark ? "#10291f" : "#F0FDF4");

  // right swipe action (Delete)
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-120, -60, 0],
      outputRange: [1, 0.95, 0.8],
      extrapolate: "clamp",
    });
    return (
      <Animated.View style={[styles.rightAction, { transform: [{ scale }] }]}>
        <Pressable
          onPress={() => onDelete?.(job.id)}
          style={styles.deleteBtn}
          accessibilityLabel="Delete"
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        onPress={onPress}
        style={[styles.row, { backgroundColor: tint, borderColor: colors.border }]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {job.company?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            <Text style={{ color: "#374151" }}>{job.company}</Text>
            {job.url ? <Text style={{ color: "#6B7280" }}> • {job.url}</Text> : null}
          </Text>
          <View style={styles.riskPill}>
            <Text
              style={[
                styles.riskText,
                job.risk === "high"
                  ? { color: "#B91C1C" }
                  : job.risk === "medium"
                  ? { color: "#B45309" }
                  : { color: "#047857" },
              ]}
            >
              {job.risk.toUpperCase()}
            </Text>
          </View>
        </View>

        <ScoreBadge score={score} />
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#E5E7EB",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontWeight: "700", fontSize: 16, color: "#374151" },
  title: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  sub: { fontSize: 13 },

  riskPill: {
    alignSelf: "flex-start", marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  riskText: { fontWeight: "700", fontSize: 12 },

  rightAction: {
    justifyContent: "center", alignItems: "flex-end",
    marginVertical: 2, // match row corner radius perception
  },
  deleteBtn: {
    backgroundColor: "#EF4444", paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 12, marginRight: 12,
  },
  deleteText: { color: "#fff", fontWeight: "800" },
});
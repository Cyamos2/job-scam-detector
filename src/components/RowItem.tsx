// src/components/RowItem.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { bucket, type Severity } from "../lib/scoring";

type Props = {
  title: string;
  subtitle?: string;
  score: number;
  onPress?: () => void;
  onLongPress?: () => void;
};

type Palette = { bg: string; bgPressed: string; text: string; border: string };

const riskPalette: Record<Severity, Palette> = {
  low:    { bg: "#ECFDF5", bgPressed: "#E1F7EC", text: "#047857", border: "#A7F3D0" },
  medium: { bg: "#FFF7ED", bgPressed: "#FFEEDA", text: "#B45309", border: "#FBD38D" },
  high:   { bg: "#FEF2F2", bgPressed: "#FDE8E8", text: "#B91C1C", border: "#FCA5A5" },
} as const;

export default function RowItem({ title, subtitle, score, onPress, onLongPress }: Props) {
  const sev: Severity = bucket(score);
  const pal = riskPalette[sev];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? pal.bgPressed : pal.bg,
          borderColor: pal.border,
        },
      ]}
      android_ripple={{ color: "#00000014", borderless: false }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: pal.text }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.badge, { borderColor: pal.border }]}>
        <Text style={{ color: pal.text, fontWeight: "800" }}>{score}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { marginTop: 2, color: "#6B7280" },
  badge: {
    minWidth: 44,
    height: 32,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});
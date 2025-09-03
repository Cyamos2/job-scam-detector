import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function Chip({ label, selected, onPress, style }: Props) {
  const { colors } = useTheme();
  const bg = selected ? colors.primary : colors.card;
  const border = selected ? colors.primary : colors.border;
  const text = selected ? colors.background : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 20,
          borderWidth: 1,
          backgroundColor: bg,
          borderColor: border,
          marginRight: 10,
          marginBottom: 10,
        },
        style,
      ]}
    >
      <Text style={{ color: text, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
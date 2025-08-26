import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";
import { theme } from "../theme";

export default function AppTextInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.hint}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border
  }
});
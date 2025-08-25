import React from 'react';
import { TextInput, StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

type Props = {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  label?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
};

export default function AppTextInput({
  value,
  onChangeText,
  placeholder,
  label,
  style,
  inputStyle,
  multiline,
  autoCapitalize = 'none',
  autoCorrect = false,
}: Props) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.wrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.hint}
          style={[styles.input, multiline && { minHeight: 120, textAlignVertical: 'top' }, inputStyle]}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.hint, fontSize: 12, marginBottom: 6 },
  wrap: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    padding: 12,
    color: theme.colors.text,
    fontSize: 16,
  },
});
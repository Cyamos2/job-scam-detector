import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
};

export default function AppButton({ title, onPress, disabled, style, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: theme.radius,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.ios,
    ...theme.shadow.android,
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: { fontSize: 16, fontWeight: '700' },
  primaryLabel: { color: theme.colors.primaryText },
  secondaryLabel: { color: theme.colors.text },
});
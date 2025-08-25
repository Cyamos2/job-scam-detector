import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
  title: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
};

export default function Collapsible({ title, initiallyOpen = false, children }: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen(v => !v)}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.hint}
        />
      </Pressable>
      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 12,
  },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: theme.colors.text, fontWeight: '800' },
  content: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
});
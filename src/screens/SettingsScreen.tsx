// src/screens/SettingsScreen.tsx
import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, Switch, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

// If you followed the earlier setup:
import { useSettings } from '../hooks/useSettings';           // loads/saves user settings
import { clearJobs } from '../lib/db';                         // clears local saved analyses

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Label({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, update, loading } = useSettings();
  const [clearing, setClearing] = useState(false);

  const confirmClear = useCallback(() => {
    Alert.alert('Clear all saved analyses?', 'This removes items from the Database tab on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            setClearing(true);
            await clearJobs();
            Alert.alert('Cleared', 'All saved analyses were removed.');
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Settings</Text>

        {/* Appearance */}
        <Row>
          <Label
            title="Dark theme"
            subtitle="Use dark colors throughout the app"
          />
          <Switch
            value={settings.theme === 'dark'}
            onValueChange={(v) => update({ theme: v ? 'dark' : 'light' })}
            trackColor={{ false: '#334155', true: '#334155' }}
            thumbColor={settings.theme === 'dark' ? theme.colors.primary : '#e2e8f0'}
            disabled={loading}
          />
        </Row>

        {/* Risk sensitivity */}
        <Row>
          <Label
            title="Risk sensitivity"
            subtitle={`Current: ${settings.riskThreshold}`}
          />
          <View style={styles.pillGroup}>
            {(['Low', 'Medium', 'High'] as const).map((opt) => {
              const active = settings.riskThreshold === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => update({ riskThreshold: opt })}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </Row>

        {/* Domain-age boost */}
        <Row>
          <Label
            title="Domain‑age boost"
            subtitle="Increase risk for very new domains"
          />
          <Switch
            value={settings.domainAgeBoost}
            onValueChange={(v) => update({ domainAgeBoost: v })}
            trackColor={{ false: '#334155', true: '#334155' }}
            thumbColor={settings.domainAgeBoost ? theme.colors.primary : '#e2e8f0'}
            disabled={loading}
          />
        </Row>

        {/* Data / privacy */}
        <Pressable style={[styles.card, { marginTop: 16 }]} onPress={confirmClear} disabled={clearing}>
          <Text style={styles.title}>{clearing ? 'Clearing…' : 'Clear saved analyses'}</Text>
          <Text style={styles.subtitle}>Removes all items from the Database tab on this device</Text>
        </Pressable>

        {/* About */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.title}>About</Text>
          <Text style={styles.subtitle}>Scamicide — Spray away job scams</Text>
          <Text style={styles.subtitle}>Version 0.1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { padding: 16, paddingBottom: 32 },
  header: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginBottom: 12 },

  row: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  title: { color: theme.colors.text, fontWeight: '700' },
  subtitle: { color: theme.colors.hint, marginTop: 2 },

  pillGroup: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillActive: { backgroundColor: '#111827', borderColor: theme.colors.primary },
  pillText: { color: theme.colors.hint, fontWeight: '700' },
  pillTextActive: { color: theme.colors.text },

  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: 12,
  },
});
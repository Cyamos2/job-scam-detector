import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSettings } from '@/SettingsProvider';

const Pill = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: active ? '#FF5733' : '#d0d0d0',
      backgroundColor: active ? '#FFE7E1' : '#fff',
      marginRight: 8,
      marginBottom: 8,
    }}
  >
    <Text style={{ color: active ? '#D43C18' : '#333', fontWeight: '600' }}>{label}</Text>
  </Pressable>
);

export default function SettingsScreen() {
  const { hydrated, settings, setTheme, toggleTheme, setRiskFilter } = useSettings();
  const loading = !hydrated;

  return (
    <View style={{ flex: 1, padding: 20, gap: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Appearance</Text>

      <View style={{ gap: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#fff', padding: 14, borderRadius: 12,
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
        }}>
          <Text style={{ fontSize: 16 }}>Cycle Theme (system → light → dark)</Text>
          <Pressable onPress={toggleTheme} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FF5733', borderRadius: 8 }} disabled={loading}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{settings.theme.toUpperCase()}</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Pill label="System" active={settings.theme === 'system'} onPress={() => setTheme('system')} />
          <Pill label="Light" active={settings.theme === 'light'} onPress={() => setTheme('light')} />
          <Pill label="Dark" active={settings.theme === 'dark'} onPress={() => setTheme('dark')} />
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 10 }}>Risk Filter (default list)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(['all', 'high', 'medium', 'low'] as const).map((r) => (
            <Pill key={r} label={r[0].toUpperCase() + r.slice(1)} active={settings.riskFilter === r} onPress={() => setRiskFilter(r)} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 6, opacity: loading ? 0.6 : 1 }}>
        <Text style={{ color: '#666' }}>{loading ? 'Loading your saved settings…' : 'Settings are saved automatically.'}</Text>
      </View>
    </View>
  );
}
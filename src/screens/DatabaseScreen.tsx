import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../theme';
import type { JobRow } from '../lib/db';
import { getJobs, deleteJob } from '../lib/db';

function levelFromScore(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

function ScoreBadge({ score }: { score: number }) {
  const level = levelFromScore(score);
  const style =
    level === 'High'
      ? styles.badgeHigh
      : level === 'Medium'
      ? styles.badgeMed
      : styles.badgeLow;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>
        {score} • {level}
      </Text>
    </View>
  );
}

export default function DatabaseScreen() {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await getJobs();
    setRows(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const confirmDelete = useCallback((id: number) => {
    Alert.alert('Delete analysis?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteJob(id);
          load();
        },
      },
    ]);
  }, [load]);

  const Empty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No saved items yet.</Text>
        <Text style={styles.emptyHint}>
          Analyze a job on the Verify tab and tap <Text style={{fontWeight:'700'}}>Save</Text>.
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <Text style={styles.header}>Saved Analyses</Text>
        }
        ListEmptyComponent={Empty}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.text}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => confirmDelete(item.id)}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title || 'Job posting'}
              </Text>
              <ScoreBadge score={item.risk ?? 0} />
            </View>

            <Text style={styles.meta}>
              {new Date(item.created_at).toLocaleString()}
            </Text>

            {!!item.description && (
              <Text style={styles.desc} numberOfLines={3}>
                {item.description}
              </Text>
            )}

            <Text style={styles.hint}>
              Long‑press to delete
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  listContent: { padding: 16, paddingBottom: 32 },
  header: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },

  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { color: theme.colors.text, fontWeight: '800', flex: 1 },

  meta: { color: theme.colors.hint, marginTop: 2 },
  desc: { color: theme.colors.text, marginTop: 8, lineHeight: 20 },
  hint: { color: theme.colors.hint, marginTop: 8 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  badgeLow:    { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  badgeMed:    { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  badgeHigh:   { backgroundColor: '#ef4444', borderColor: '#ef4444' },

  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'flex-start',
    gap: 6,
  },
  emptyTitle: { color: theme.colors.text, fontWeight: '800' },
  emptyHint: { color: theme.colors.hint },
});
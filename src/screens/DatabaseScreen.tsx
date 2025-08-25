import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { getJobs, JobRow, deleteJob, clearJobs } from '../lib/db';

export default function DatabaseScreen() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getJobs();
      setJobs(rows);
    } finally {
      setLoading(false);
    }
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

  const confirmDelete = (id: number) => {
    Alert.alert('Delete entry?', 'This will remove the saved analysis.', [
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
  };

  const confirmClear = () => {
    Alert.alert('Clear all?', 'Remove all saved jobs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          await clearJobs();
          load();
        },
      },
    ]);
  };

  const riskChip = (risk: number) => {
    const lvl = risk >= 60 ? 'High' : risk >= 30 ? 'Medium' : 'Low';
    const color =
      lvl === 'High' ? theme.colors.danger : lvl === 'Medium' ? theme.colors.warning : theme.colors.success;
    return <Text style={[styles.chip, { color }]}>{lvl}</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Saved Analyses</Text>
        {jobs.length > 0 && (
          <Pressable onPress={confirmClear}>
            <Text style={styles.clear}>Clear all</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No saved items yet. Analyze a job and tap “Save”.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title || 'Untitled job'}
              </Text>
              {riskChip(item.risk)}
            </View>
            <Text style={styles.cardMeta}>{new Date(item.created_at).toLocaleString()}</Text>
            <Text style={styles.cardBody} numberOfLines={3}>
              {item.description}
            </Text>
            <View style={styles.rowEnd}>
              <Pressable onPress={() => confirmDelete(item.id)}>
                <Text style={styles.delete}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  clear: { color: theme.colors.hint, textDecorationLine: 'underline' },
  empty: { color: theme.colors.hint, marginTop: 16 },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: theme.colors.text, fontWeight: '700', flex: 1, marginRight: 8 },
  cardMeta: { color: theme.colors.hint, marginTop: 2, marginBottom: 6 },
  cardBody: { color: theme.colors.text, lineHeight: 20 },
  chip: { fontWeight: '800' },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  delete: { color: theme.colors.danger },
});
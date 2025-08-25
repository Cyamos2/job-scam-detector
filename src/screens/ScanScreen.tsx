import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import RiskMeter from '../components/RiskMeter';
import Collapsible from '../components/Collapsible';
import { theme } from '../theme';
import { extractTextFromImage } from '../lib/ocr';
import { analyzeText } from '../lib/riskRules';
import { buildExplanation } from '../lib/explain';
import { saveJob } from '../lib/db';

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pasted, setPasted] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | undefined>(undefined);

  const result = useMemo(() => analyzeText(pasted || ''), [pasted]);
  const adjusted = useMemo(() => {
    const score = Math.min(100, result.score);
    const level: 'Low' | 'Medium' | 'High' = score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low';
    return { score, level, bonus: 0 };
  }, [result]);

  const explanation = useMemo(() => buildExplanation(pasted || '', result), [pasted, result]);
  const topFlags = result.matches.slice(0, 3);

  function verdictLine(level: 'Low' | 'Medium' | 'High', matchCount: number) {
    if (level === 'High') return 'High risk: multiple strong scam signals.';
    if (level === 'Medium') return 'Moderate risk: some caution signs.';
    return matchCount > 0 ? `Low risk overall, but ${matchCount} caution flag${matchCount > 1 ? 's' : ''} found.` : 'Looks okay. No obvious scam signals.';
  }

  async function pickImage() {
    setNote(undefined);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to scan screenshots.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    setImageUri(asset.uri);
    setPasted('');
  }

  async function runOcr() {
    if (!imageUri) {
      Alert.alert('No image selected', 'Pick a screenshot first.');
      return;
    }
    setLoading(true);
    try {
      const { text, warning } = await extractTextFromImage(imageUri);
      setPasted(text || '');
      setNote(warning);
    } catch {
      Alert.alert('OCR failed', 'Could not read text from this image.');
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!pasted?.trim()) {
      Alert.alert('Nothing to save', 'Extract or paste text first.');
      return;
    }
    await saveJob('Screenshot analysis', pasted, adjusted.score);
    Alert.alert('Saved', 'This analysis was saved to the Database tab.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 36 }}>
      <Text style={styles.h1}>Scan Screenshot</Text>
      <Text style={styles.hint}>Pick a screenshot; we’ll extract text and analyze it.</Text>

      <View style={{ height: 12 }} />
      <AppButton title="Pick Screenshot" onPress={pickImage} />
      <View style={{ height: 10 }} />
      <AppButton title={loading ? 'Reading…' : 'Extract Text (OCR)'} onPress={runOcr} disabled={loading} />

      {loading && <View style={{ marginTop: 10 }}><ActivityIndicator /></View>}

      {imageUri && (
        <View style={styles.previewCard}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        </View>
      )}

      <View style={{ height: 14 }} />
      <AppTextInput
        label="Extracted / Pasted Text"
        value={pasted}
        onChangeText={setPasted}
        placeholder="OCR output will appear here. You can also paste or edit text manually."
        multiline
      />
      {!!note && <Text style={[styles.hint, { marginTop: 6 }]}>{note}</Text>}

      {/* Compact Analysis */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analysis</Text>
        <RiskMeter score={adjusted.score} level={adjusted.level} baseScore={result.score} />
        <Text
          style={[
            styles.verdict,
            adjusted.level === 'High'
              ? { color: theme.colors.danger }
              : adjusted.level === 'Medium'
              ? { color: theme.colors.warning }
              : { color: theme.colors.success },
          ]}
        >
          {verdictLine(adjusted.level, result.matches.length)}
        </Text>

        {topFlags.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.subhead}>Top flags</Text>
            {topFlags.map((m, i) => (
              <Text key={i} style={styles.flagLine}>
                • {m.label} <Text style={styles.flagWeight}>(+{m.weight})</Text>
              </Text>
            ))}
          </View>
        )}

        <View style={{ height: 10 }} />
        <AppButton title="Save to Database" onPress={onSave} />
      </View>

      {/* Collapsibles */}
      <Collapsible title="All flags">
        {result.matches.length === 0 ? (
          <Text style={styles.hint}>No red-flag phrases matched.</Text>
        ) : (
          result.matches.map((m, i) => (
            <View key={i} style={styles.flagCard}>
              <Text style={styles.flagTitle}>
                • {m.label} <Text style={styles.flagWeight}>(+{m.weight})</Text>
              </Text>
              <Text style={styles.flagSnippet}>"{m.hit}"</Text>
              {!!m.advice && <Text style={styles.flagAdvice}>{m.advice}</Text>}
            </View>
          ))
        )}
      </Collapsible>

      <Collapsible title="Why this risk level?">
        <Text style={styles.body}>{explanation.why}</Text>
      </Collapsible>

      <Collapsible title="Recommended next steps" initiallyOpen={adjusted.level !== 'Low'}>
        {explanation.recommendations.map((r, i) => (
          <Text key={i} style={styles.body}>• {r}</Text>
        ))}
      </Collapsible>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 18 },
  h1: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  hint: { color: theme.colors.hint, lineHeight: 20 },

  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginTop: 16,
  },
  cardTitle: { color: theme.colors.text, fontWeight: '800', marginBottom: 6 },
  verdict: { marginTop: 8, fontWeight: '700' },
  subhead: { color: theme.colors.text, fontWeight: '800', marginBottom: 4, marginTop: 4 },

  body: { color: theme.colors.text, lineHeight: 20 },
  flagLine: { color: theme.colors.text, marginVertical: 2 },
  flagWeight: { color: theme.colors.hint },

  previewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 8,
    marginTop: 12,
  },
  preview: { width: '100%', height: 260, borderRadius: 10 },

  flagCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flagTitle: { color: theme.colors.text, fontWeight: '700', marginBottom: 2 },
  flagSnippet: { color: theme.colors.text, fontStyle: 'italic', marginBottom: 2 },
  flagAdvice: { color: theme.colors.hint },
});
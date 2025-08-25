import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';

import AppButton from '../components/AppButton';
import RiskMeter from '../components/RiskMeter';
import Collapsible from '../components/Collapsible';

import { theme } from '../theme';
import { analyzeText } from '../lib/riskRules';
import { htmlToText } from '../lib/html';
import { isLikelyUrl, normalizeUrl, getDomain } from '../lib/urlTools';
import { buildExplanation } from '../lib/explain';
import { getDomainAge } from '../lib/domainAge';
import { saveJob } from '../lib/db';

type Props = { route?: any };

export default function VerifyScreen({ route }: Props) {
  const initialQuery: string = route?.params?.query?.trim?.() ?? '';

  const [linkText, setLinkText] = useState<string>(initialQuery);
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState<{ domain?: string; status?: number; bytes?: number } | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [ageInfo, setAgeInfo] = useState<{ ageDays?: number; created?: string } | null>(null);

  const result = useMemo(() => analyzeText(description || ''), [description]);

  const adjusted = useMemo(() => {
    // Domain-age bonus (heavier penalty for new domains)
    const ageDays = ageInfo?.ageDays;
    let bonus = 0;
    if (typeof ageDays === 'number') {
      if (ageDays < 90) bonus = 25;
      else if (ageDays < 180) bonus = 18;
      else if (ageDays < 365) bonus = 12;
    }
    const score = Math.min(100, result.score + bonus);
    const level: 'Low' | 'Medium' | 'High' = score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low';
    return { score, level, bonus };
  }, [result, ageInfo]);

  const explanation = useMemo(() => buildExplanation(description || '', result), [description, result]);
  const topFlags = result.matches.slice(0, 3);

  function verdictLine(level: 'Low' | 'Medium' | 'High', matchCount: number, bonus: number) {
    if (level === 'High') return `High risk: multiple strong scam signals${bonus ? ` (+${bonus} domain-age bonus)` : ''}.`;
    if (level === 'Medium') return `Moderate risk: some caution signs${bonus ? ` (+${bonus})` : ''}.`;
    return matchCount > 0
      ? `Low risk overall, but ${matchCount} caution flag${matchCount > 1 ? 's' : ''} found.`
      : 'Looks okay. No obvious scam signals.';
  }

  async function fetchFromLink() {
    const q = (linkText || '').trim();
    if (!isLikelyUrl(q)) {
      Alert.alert('Not a link', 'Please enter a valid job or company URL.');
      return;
    }

    setLoading(true);
    setLinkError(null);
    setFetched(null);
    setAgeInfo(null);

    try {
      const url = normalizeUrl(q);
      const domain = getDomain(url) ?? undefined;

      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 20000);

      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeout);

      const status = res.status;
      const html = await res.text();
      const text = htmlToText(html);

      setFetched({ domain, status, bytes: text.length });

      if (domain) {
        try {
          const info = await getDomainAge(domain);
          setAgeInfo({ ageDays: info.ageDays, created: info.created });
        } catch {
          setAgeInfo(null);
        }
      }

      if (!text || text.length < 80) {
        setLinkError('Fetched the page but could not extract meaningful text (page may be behind login or dynamically rendered).');
      }

      setDescription(text);
    } catch (e: any) {
      setLinkError(e?.name === 'AbortError' ? 'Timed out fetching the page.' : 'Failed to fetch the link.');
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!description?.trim()) {
      Alert.alert('Nothing to save', 'Analyze a posting first.');
      return;
    }
    const title = fetched?.domain || (linkText ? getDomain(linkText) || 'Job posting' : 'Job posting');
    await saveJob(title, description, adjusted.score);
    Alert.alert('Saved', 'This analysis was saved to the Database tab.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 36 }}>
      <Text style={styles.h1}>Company Verification</Text>

      {/* Link row */}
      <Text style={styles.label}>Job/Company Link</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="https://company.com/careers/..., LinkedIn job URL, etc."
          placeholderTextColor={theme.colors.hint}
          value={linkText}
          onChangeText={setLinkText}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={{ height: 8 }} />
      <AppButton title={loading ? 'Fetching…' : 'Fetch & Analyze Link'} onPress={fetchFromLink} />
      {loading && <View style={{ marginTop: 8 }}><ActivityIndicator /></View>}
      {!!linkError && <Text style={[styles.hint, { marginTop: 6 }]}>{linkError}</Text>}

      {/* Manual description */}
      <Text style={[styles.label, { marginTop: 16 }]}>Paste Job Description (optional)</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
          placeholder="Paste the job description here…"
          placeholderTextColor={theme.colors.hint}
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Analysis card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analysis</Text>

        <RiskMeter
          score={adjusted.score}
          level={adjusted.level}
          baseScore={result.score}
          bonusLabel={adjusted.bonus ? `+${adjusted.bonus} domain-age bonus` : undefined}
        />

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
          {verdictLine(adjusted.level, result.matches.length, adjusted.bonus)}
        </Text>

        {result.matches.length > 0 && (
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
      <Collapsible title="Details">
        {fetched ? (
          <Text style={styles.hint}>
            Domain: <Text style={styles.metaStrong}>{fetched.domain || '—'}</Text> · Status:{' '}
            <Text style={styles.metaStrong}>{fetched.status ?? '—'}</Text> · Extracted:{' '}
            <Text style={styles.metaStrong}>{(fetched.bytes || 0).toLocaleString()} chars</Text>
            {typeof ageInfo?.ageDays === 'number' && (
              <> · Age: <Text style={styles.metaStrong}>{ageInfo.ageDays} days</Text></>
            )}
          </Text>
        ) : (
          <Text style={styles.hint}>No link fetched yet.</Text>
        )}
      </Collapsible>

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

  label: { color: theme.colors.hint, fontSize: 12, marginBottom: 4 },
  inputWrap: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: { padding: 12, color: theme.colors.text },

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

  hint: { color: theme.colors.hint, lineHeight: 20 },
  body: { color: theme.colors.text, lineHeight: 20 },

  flagLine: { color: theme.colors.text, marginVertical: 2 },
  flagWeight: { color: theme.colors.hint },

  metaStrong: { color: theme.colors.text, fontWeight: '700' },

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
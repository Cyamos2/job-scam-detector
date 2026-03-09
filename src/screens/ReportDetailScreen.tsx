// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Screen from "../components/Screen";
import { useJobs } from "../hooks/useJobs";
import { scoreJob, scoreJobEnriched, visualBucket, type ScoreResultExtended, type Reason, type Severity } from "../lib/scoring";
import type { RootStackParamList } from "../navigation/types";
import VerifyCard from "../components/VerifyCard";
import api from "../lib/db";

type Nav = NativeStackNavigationProp<RootStackParamList, "ReportDetail">;
type Route = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  // ALL hooks are called unconditionally in the same order every render
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const id: string = route.params?.id ?? "";
  const { items } = useJobs();
  
  // useMemo is ALWAYS called - returns undefined if no id or job not found
  const job = React.useMemo(() => {
    if (!id) return undefined;
    return items.find((j) => j.id === id);
  }, [items, id]);
  
  const { colors } = useTheme();
  
  React.useLayoutEffect(() => {
    nav.setOptions({ title: "Report" });
  }, [nav]);

  // ALL hooks above this line - now we can conditionally return
  
  // If no valid id, show error
  if (!id) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: "#6B7280" }}>Invalid job reference.</Text>
        </View>
      </Screen>
    );
  }
  
  // If job not found in items, show error
  if (!job) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: "#6B7280" }}>This job was not found.</Text>
        </View>
      </Screen>
    );
  }

  // At this point, job IS guaranteed to exist (id is truthy and job was found)
  const currentJob = job;

  const result = React.useMemo(
    () =>
      scoreJob({
        title: currentJob.title,
        company: currentJob.company,
        location: currentJob.location,
        recruiterEmail: currentJob.recruiterEmail,
        url: currentJob.url,
        notes: currentJob.notes,
      }),
    [currentJob]
  );
  const bucket = visualBucket(result);
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:4000";

  const [patterns, setPatterns] = React.useState<
    | { companyCount: number; emailCount: number; hostCount: number; host: string | null }
    | null
  >(null);
  const [patternsLoading, setPatternsLoading] = React.useState(false);

  // Enriched async score (WHOIS + evidence)
  const [enriched, setEnriched] = React.useState<ScoreResultExtended | null>(null);
  const [enriching, setEnriching] = React.useState(false);

  React.useEffect(() => {
    if (!currentJob.url) return;
    let mounted = true;
    setEnriching(true);
    (async () => {
      try {
        const r = await scoreJobEnriched({
          title: currentJob.title,
          company: currentJob.company,
          location: currentJob.location,
          recruiterEmail: currentJob.recruiterEmail,
          url: currentJob.url,
          notes: currentJob.notes,
        });
        if (!mounted) return;
        setEnriched(r);
      } catch {
        // ignore
      } finally {
        if (mounted) setEnriching(false);
      }
    })();
    return () => { mounted = false; };
  }, [currentJob.url]);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setPatternsLoading(true);
        const resp = await api.patterns({
          company: currentJob.company,
          url: currentJob.url ?? undefined,
          recruiterEmail: currentJob.recruiterEmail ?? undefined,
        });
        if (!mounted) return;
        setPatterns(resp.data);
      } catch {
        if (mounted) setPatterns(null);
      } finally {
        if (mounted) setPatternsLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [currentJob.company, currentJob.url, currentJob.recruiterEmail]);

  const handleOpen = async () => {
    if (!currentJob.url) return;
    try {
      await Linking.openURL(currentJob.url);
    } catch {
      Alert.alert("Could not open", currentJob.url);
    }
  };

  const handleCopy = async () => {
    if (!currentJob.url) return;
    await Clipboard.setStringAsync(currentJob.url);
    Alert.alert("Copied", "Job link copied to clipboard.");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header card */}
        <View style={[styles.card, { borderColor: "#E5E7EB", backgroundColor: colors.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{currentJob.title}</Text>
            <Text style={styles.sub}>
              {currentJob.company}
              {currentJob.location ? ` · ${currentJob.location}` : ""}
              {currentJob.url ? "  ·  " + currentJob.url : ""}
            </Text>
            {!!currentJob.recruiterEmail && (
              <Text style={[styles.sub, { marginTop: 4 }]}>{currentJob.recruiterEmail}</Text>
            )}
            {enriching && <Text style={{ color: "#9CA3AF", marginTop: 6 }}>Checking domain info…</Text>}
            {enriched?.evidence?.domainAgeDays != null && (
              <Text style={{ color: "#9CA3AF", marginTop: 6 }}>Domain age: {enriched.evidence.domainAgeDays} days{enriched.evidence.domainAgeDays < 90 ? " (young)" : ""}</Text>
            )}
          </View>
          <ScorePill score={(enriched?.score ?? result.score)} bucket={bucket} />
        </View>

        {/* Reasons */}
        <View style={styles.section}>
          <Text style={styles.h2}>Why this score?</Text>
          {(enriched ?? result).reasons.length === 0 ? (
            <Text style={{ color: "#6B7280", marginTop: 6 }}>No specific red flags matched.</Text>
          ) : (
            <View style={styles.pillsWrap}>
              {(enriched ?? result).reasons.map((r) => (
                <ReasonPill key={r.key} reason={r} />
              ))}
            </View>
          )}
        </View>

        {/* Company verification */}
        <VerifyCard company={currentJob.company} url={currentJob.url} baseUrl={baseUrl} />

        {/* Repeat pattern detection */}
        <View style={styles.section}>
          <Text style={styles.h2}>Repeat pattern check</Text>
          {patternsLoading && <Text style={{ color: "#9CA3AF", marginTop: 6 }}>Checking patterns…</Text>}
          {!patternsLoading && patterns && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.notes}>Same company seen: {patterns.companyCount}</Text>
              <Text style={styles.notes}>Same domain seen: {patterns.hostCount}</Text>
              <Text style={styles.notes}>Same recruiter email: {patterns.emailCount}</Text>
            </View>
          )}
          {!patternsLoading && !patterns && (
            <Text style={{ color: "#9CA3AF", marginTop: 6 }}>No pattern data available.</Text>
          )}
        </View>

        {/* Notes */}
        {!!currentJob.notes && (
          <View style={styles.section}>
            <Text style={styles.h2}>Notes</Text>
            <Text style={styles.notes}>{currentJob.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <ActionButton label="Open link" onPress={handleOpen} disabled={!currentJob.url} />
          <ActionButton label="Copy link" onPress={handleCopy} disabled={!currentJob.url} />
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ---------- local UI bits ---------- */

function ScorePill({ score, bucket }: { score: number; bucket: Severity }) {
  const bg = bucket === "high" ? "#FEE2E2" : bucket === "medium" ? "#FEF3C7" : "#ECFDF5";
  const fg = bucket === "high" ? "#DC2626" : bucket === "medium" ? "#D97706" : "#047857";
  const border = bucket === "high" ? "#FCA5A5" : bucket === "medium" ? "#FCD34D" : "#A7F3D0";
  return (
    <View style={[styles.scoreWrap, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
      <Text style={[styles.score, { color: fg }]}>{score}</Text>
    </View>
  );
}

function ReasonPill({ reason }: { reason: Reason }) {
  const colors = {
    high: { bg: "#FEE2E2", border: "#FCA5A5", text: "#DC2626" },
    medium: { bg: "#FEF3C7", border: "#FCD34D", text: "#D97706" },
    low: { bg: "#ECFDF5", border: "#A7F3D0", text: "#047857" },
  };
  const c = colors[reason.severity];

  return (
    <View style={[styles.reasonPill, { borderColor: c.border, backgroundColor: c.bg }]}>
      <Text style={[styles.reasonText, { color: c.text }]}>{reason.label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        danger && { borderColor: "#DC2626" },
      ]}
    >
      <Text style={[styles.actionTxt, danger && { color: "#DC2626" }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  sub: { marginTop: 6, color: "#4B5563" },

  scoreWrap: {
    minWidth: 64,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  score: { fontSize: 20, fontWeight: "900" },

  section: { marginTop: 16, marginHorizontal: 16 },
  h2: { fontWeight: "800", fontSize: 16 },
  pillsWrap: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonPill: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reasonText: { fontWeight: "700", fontSize: 13 },

  notes: { marginTop: 8, lineHeight: 20, color: "#1F2937" },

  actionsRow: { marginTop: 18, marginHorizontal: 16, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionTxt: { fontWeight: "800", color: "#111827" },
});


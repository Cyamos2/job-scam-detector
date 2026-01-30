// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActionSheetIOS,
  Linking,
  Platform,
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

type Nav = NativeStackNavigationProp<RootStackParamList, "ReportDetail">;
type Route = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;

  const { items, deleteJob } = useJobs();
  const job = React.useMemo(() => items.find((j) => j.id === id), [items, id]);

  React.useLayoutEffect(() => {
    nav.setOptions({ title: "Report" });
  }, [nav]);

  if (!job) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: "#6B7280" }}>This job was not found.</Text>
        </View>
      </Screen>
    );
  }

  const result = React.useMemo(
    () =>
      scoreJob({
        title: job.title,
        company: job.company,
        url: job.url,
        notes: job.notes,
      }),
    [job]
  );
  const bucket = visualBucket(result);
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:4000";

  // Enriched async score (WHOIS + evidence)
  const [enriched, setEnriched] = React.useState<ScoreResultExtended | null>(null);
  const [enriching, setEnriching] = React.useState(false);

  React.useEffect(() => {
    if (!job.url) return;
    let mounted = true;
    setEnriching(true);
    (async () => {
      try {
        const r = await scoreJobEnriched({ title: job.title, company: job.company, url: job.url, notes: job.notes });
        if (!mounted) return;
        setEnriched(r);
      } catch {
        // ignore
      } finally {
        if (mounted) setEnriching(false);
      }
    })();
    return () => { mounted = false; };
  }, [job.url]);

  const handleOpen = async () => {
    if (!job.url) return;
    try {
      await Linking.openURL(job.url);
    } catch {
      Alert.alert("Could not open", job.url);
    }
  };

  const handleCopy = async () => {
    if (!job.url) return;
    await Clipboard.setStringAsync(job.url);
    Alert.alert("Copied", "Job link copied to clipboard.");
  };

  const confirmDelete = () => {
    const doDelete = async () => {
      await deleteJob(job.id);
      nav.goBack();
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: "Delete this job?",
          message: "You can Undo for up to 1 minute on the list screen.",
        },
        (idx) => {
          if (idx === 1) doDelete();
        }
      );
    } else {
      Alert.alert(
        "Delete this job?",
        "You can Undo for up to 1 minute on the list screen.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => doDelete() },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header card */}
        <View style={[styles.card, { borderColor: "#E5E7EB", backgroundColor: colors.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.sub}>
              {job.company}
              {job.url ? "  ·  " + job.url : ""}
            </Text>
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
        <VerifyCard company={job.company} url={job.url} baseUrl={baseUrl} />

        {/* Notes */}
        {!!job.notes && (
          <View style={styles.section}>
            <Text style={styles.h2}>Notes</Text>
            <Text style={styles.notes}>{job.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <ActionButton label="Open link" onPress={handleOpen} disabled={!job.url} />
          <ActionButton label="Copy link" onPress={handleCopy} disabled={!job.url} />
          <ActionButton label="Delete" danger onPress={confirmDelete} />
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
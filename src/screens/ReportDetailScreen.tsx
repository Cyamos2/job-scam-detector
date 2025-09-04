// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import Screen from "../components/Screen";
import { api, type Job } from "../lib/api";
import ScoreBadge from "../components/ScoreBadge";
import { scoreJob } from "../lib/scoring";

type ReportDetailRoute = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  const { params } = useRoute<ReportDetailRoute>();
  const { id } = params;

  const [job, setJob] = React.useState<Job | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // simplest: load all and find one (swap to api.getJob(id) if you add it)
        const list = await api.listJobs();
        const found = list.find((j) => j.id === id) ?? null;
        if (isMounted) setJob(found);
      } catch (e: any) {
        if (isMounted) setErr(String(e?.message ?? e));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (err || !job) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.error}>Unable to load report.</Text>
          {!!err && <Text style={styles.muted}>{err}</Text>}
        </View>
      </Screen>
    );
  }

  const score = scoreJob(job);

  return (
    <Screen>
      <View style={styles.card}>
        <View style={{ alignSelf: "flex-end" }}>
          <ScoreBadge score={score.score} />
        </View>

        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.meta}>
          {job.company}{job.url ? ` • ${job.url}` : ""}
        </Text>

        {!!job.notes && (
          <>
            <Text style={styles.h2}>Notes</Text>
            <Text style={styles.body}>{job.notes}</Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { fontWeight: "700", marginBottom: 6, color: "#B91C1C" },
  muted: { color: "#6B7280", textAlign: "center" },

  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111" },
  meta: { color: "#6B7280" },
  h2: { marginTop: 12, fontWeight: "800", color: "#111" },
  body: { color: "#111" },
});
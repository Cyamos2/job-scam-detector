// src/components/VerifyCard.tsx
// Self-contained verification card. No external types required.

import * as React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from "react-native";

export type VerifyResult = {
  ok: boolean;
  company: string | null;
  site: string | null;
  https: boolean | null;
  tld: string | null;
  tldSuspicious: boolean | null;
  linkedIn: { found: boolean; companyUrl: string | null; employeesHint: number | null };
  domain: { createdAt: string | null; ageDays: number | null; provider: "whoisxml" | "fallback" | null };
};

type Props = {
  company?: string | null;
  url?: string | null;
  baseUrl: string; // e.g., http://localhost:4000
};

export default function VerifyCard({ company, url, baseUrl }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<VerifyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (company) qs.set("company", company);
        if (url) qs.set("url", url);
        const resp = await fetch(`${baseUrl}/api/v1/verify?${qs.toString()}`);
        const json = (await resp.json()) as VerifyResult;
        if (!cancelled) setData(json);
      } catch (e: unknown) {
        if (!cancelled) {
          if (e instanceof Error) setError(e.message);
          else setError(String(e ?? "Network error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [company, url, baseUrl]);

  const openLinkedIn = () => {
    const li = data?.linkedIn.companyUrl;
    if (li) Linking.openURL(li);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Company verification</Text>

      {loading && (
        <View style={styles.row}>
          <ActivityIndicator />
          <Text style={styles.dim}> Checking…</Text>
        </View>
      )}

      {error && <Text style={styles.err}>{error}</Text>}

      {data && (
        <>
          <Row
            label="Status"
            value={data.ok ? "Verified" : "Needs review"}
            valueColor={data.ok ? "#059669" : "#D97706"}
          />
          <Row label="LinkedIn page" value={data.linkedIn.found ? "Found" : "Not found"} />
          {data.linkedIn.companyUrl && (
            <Pressable onPress={openLinkedIn}>
              <Text style={styles.link}>Open LinkedIn company</Text>
            </Pressable>
          )}
          <Row
            label="Employees (hint)"
            value={data.linkedIn.employeesHint != null ? String(data.linkedIn.employeesHint) : "—"}
          />
          <Row label="HTTPS" value={data.https == null ? "—" : data.https ? "Yes" : "No"} />
          <Row
            label="TLD"
            value={
              data.tld ? (data.tldSuspicious ? `.${data.tld} (risky)` : `.${data.tld}`) : "—"
            }
          />
          <Row
            label="Domain age"
            value={
              data.domain.ageDays != null
                ? `${data.domain.ageDays} days`
                : data.domain.createdAt ?? "—"
            }
          />
        </>
      )}
    </View>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontWeight: "800", fontSize: 16, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  label: { width: 140, color: "#374151" },
  value: { fontWeight: "700", color: "#111827" },
  dim: { color: "#6B7280", marginLeft: 8 },
  err: { color: "#b91c1c" },
  link: { color: "#2563EB", marginTop: 6, fontWeight: "700" },
});
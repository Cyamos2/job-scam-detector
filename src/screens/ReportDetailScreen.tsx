// src/screens/ReportDetailScreen.tsx
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, useRoute, type RouteProp } from "@react-navigation/native";
import Screen from "../components/Screen";
import { useJobs } from "../hooks/useJobs";

// If your navigator uses a different route name, change "ReportDetail" here.
// This is only for typing and won't affect runtime.
type ParamList = { ReportDetail: { id: string } | undefined };

export default function ReportDetailScreen() {
  const { colors, dark } = useTheme();
  const route = useRoute<RouteProp<ParamList, "ReportDetail">>();
  const id = route.params?.id;

  const { items } = useJobs();
  const item = id ? items.find((j) => j.id === id) : undefined;

  if (!id || !item) {
    return (
      <Screen>
        <View style={[styles.center, { padding: 16 }]}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            This report no longer exists.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.row}>
          <Text style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}>
            Company
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {item.company}
          </Text>
        </View>

        {!!item.url && (
          <View style={styles.row}>
            <Text
              style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}
            >
              URL
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>{item.url}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}>
            Risk
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {item.risk.toUpperCase()}
          </Text>
        </View>

        {!!item.notes && (
          <View style={styles.row}>
            <Text
              style={[styles.label, { color: dark ? "#cbd5e1" : "#6b7280" }]}
            >
              Notes
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>{item.notes}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  row: { marginTop: 8 },
  label: { fontSize: 13, fontWeight: "700" },
  value: { fontSize: 15, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
// src/screens/DatabaseScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Screen from "../components/Screen";
import JobRow from "../components/JobRow";
import { scoreJob, type ScoreResult } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";
import type { Job } from "../lib/api";

// ---------- types ----------
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Risk = "low" | "medium" | "high";

// A single row in the list (job + computed score)
type Row = { j: Job; s: ScoreResult };

// ---------- helpers ----------
const toScoreInput = (j: Job) => ({
  title: j.title,
  company: j.company,
  url: j.url ?? undefined,     // normalize null -> undefined
  notes: j.notes ?? undefined, // normalize null -> undefined
  risk: j.risk,
});

export default function DatabaseScreen() {
  const nav = useNavigation<Nav>();
  const { colors, dark } = useTheme();
  const { items, remove } = useJobs();

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | Risk>("all");

  // compute rows (score + filter + sort)
  const data: Row[] = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .map((j) => ({ j, s: scoreJob(toScoreInput(j)) }))
      .filter(({ j }) => (filter === "all" ? true : j.risk === filter))
      .filter(({ j }) =>
        q ? `${j.title} ${j.company}`.toLowerCase().includes(q) : true
      )
      .sort((a, b) => b.s.score - a.s.score); // riskiest first
  }, [items, search, filter]);

  const onDelete = React.useCallback(
    (id: string) => {
      Alert.alert("Delete", "Remove this entry?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await remove(id);
            if (Platform.OS === "android") {
              ToastAndroid.show("Deleted", ToastAndroid.SHORT);
            }
          },
        },
      ]);
    },
    [remove]
  );

  const renderItem = ({ item }: { item: Row }) => {
    const { j, s } = item;
    return (
      <JobRow
        job={j}
        score={s.score}
        onPress={() => nav.navigate("ReportDetail", { id: j.id })}
        onDelete={(id) => onDelete(id)}
      />
    );
  };

  return (
    <Screen>
      {/* search */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by company or role"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.search,
            {
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        />
      </View>

      {/* filter pills */}
      <View style={styles.filters}>
        {(["all", "low", "medium", "high"] as const).map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.pill,
                active && styles.pillActive,
                active &&
                  f === "low" && {
                    borderColor: "#A7F3D0",
                    backgroundColor: "#ECFDF5",
                  },
                active &&
                  f === "medium" && {
                    borderColor: "#FED7AA",
                    backgroundColor: "#FFF7ED",
                  },
                active &&
                  f === "high" && {
                    borderColor: "#FCA5A5",
                    backgroundColor: "#FEF2F2",
                  },
              ]}
            >
              <Text style={[styles.pillText, active && { color: "#111827" }]}>
                {String(f).toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setSearch("")}>
          <Text style={{ color: "#6B7280", fontWeight: "700" }}>Refresh</Text>
        </Pressable>
      </View>

      {/* list */}
      <FlatList<Row>
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12 }}
        data={data}
        keyExtractor={({ j }) => j.id}
        renderItem={renderItem}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  pillActive: { borderWidth: 1.2 },
  pillText: { fontWeight: "800", color: "#6B7280" },
});
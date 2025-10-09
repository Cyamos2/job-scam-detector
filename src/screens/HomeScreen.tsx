import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Platform,
  FlatList,
} from "react-native";
import {
  useTheme,
  useNavigation,
  type CompositeNavigationProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import Screen from "../components/Screen";
import JobRow from "../components/JobRow";
import { useJobs } from "../hooks/useJobs";
import { scoreJob, visualBucket, type Severity } from "../lib/scoring";
import type { RootStackParamList, RootTabParamList } from "../navigation/types";

// Composite: tabs + stack
type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const { colors, dark } = useTheme();
  const nav = useNavigation<Nav>();
  const { items } = useJobs();

  const [search, setSearch] = React.useState("");

  const recent = React.useMemo(() => {
    return [...items]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .map((job) => {
        const result = scoreJob({
          title: job.title,
          company: job.company,
          url: job.url,
          notes: job.notes,
        });
        const bucket = visualBucket(result);
        return { job, result, bucket };
      });
  }, [items]);

  const goDatabase = () => nav.navigate("Database");   // tab
  const goAdd = () => nav.navigate("AddContent");      // stack
  const goScan = () => nav.navigate("ScanScreen");     // stack

  return (
    <Screen>
      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/scamicide-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>Job Scam Detector</Text>
        <Text style={styles.subtitle}>
          Scan job posts, verify companies, avoid scams.
        </Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your database…"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          onFocus={goDatabase}
          onSubmitEditing={goDatabase}
          style={[
            styles.search,
            {
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: "#E5E7EB",
            },
          ]}
          returnKeyType="search"
        />

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <Pressable onPress={goAdd} style={[styles.primaryBtn, styles.btn]}>
            <Text style={styles.primaryText}>Start</Text>
          </Pressable>
          <Pressable onPress={goScan} style={[styles.secondaryBtn, styles.btn]}>
            <Text style={styles.secondaryText}>Pick Screenshot</Text>
          </Pressable>
        </View>

        <Text style={styles.tip}>
          Tip: You can also paste a job link on the Add screen.
        </Text>
      </View>

      {/* Recent checks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent checks</Text>
        <Pressable onPress={goDatabase} hitSlop={8}>
          <Text style={styles.sectionLink}>See all</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: "#6B7280" }}>No saved jobs yet.</Text>
        </View>
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(r) => r.job.id}
          renderItem={({ item }) => (
            <JobRow
              job={item.job}
              score={item.result.score}
              reasons={item.result.reasons}
              bucket={item.bucket as Severity}
              onPress={() => nav.navigate("ReportDetail", { id: item.job.id })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 16, paddingTop: 16, alignItems: "center" },
  logo: { width: 96, height: 96, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#6B7280", marginTop: 2, marginBottom: 16, textAlign: "center" },
  search: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  actionsRow: { alignSelf: "stretch", flexDirection: "row", gap: 12, marginTop: 12 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: { backgroundColor: "#EF4444" },
  primaryText: { color: "white", fontWeight: "800" },
  secondaryBtn: { backgroundColor: "#E5E7EB" },
  secondaryText: { color: "#111827", fontWeight: "800" },
  tip: { marginTop: 8, color: "#6B7280", fontSize: 12, textAlign: "center" },
  sectionHeader: {
    marginTop: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontWeight: "800", color: "#111827" },
  sectionLink: { color: "#2563EB", fontWeight: "700" },
  empty: { paddingVertical: 24, alignItems: "center", justifyContent: "center" },
});
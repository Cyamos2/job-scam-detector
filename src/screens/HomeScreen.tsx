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

  return (
    <Screen>
      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/scamicide-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>Scamicide</Text>
        <Text style={styles.subtitle}>
          Analyze job postings and stay safe from scams
        </Text>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <Pressable onPress={goAdd} style={[styles.primaryBtn, styles.btn]}>
            <Text style={styles.primaryText}>✨ Analyze Job Post</Text>
          </Pressable>
          <Pressable onPress={goDatabase} style={[styles.secondaryBtn, styles.btn]}>
            <Text style={styles.secondaryText}>View Saved Jobs</Text>
          </Pressable>
        </View>
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
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No analyses yet</Text>
          <Text style={styles.emptyText}>
            Tap "Analyze Job Post" above to check your first job posting
          </Text>
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
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { 
    color: "#6B7280", 
    marginTop: 4, 
    marginBottom: 20, 
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20
  },
  actionsRow: { 
    alignSelf: "stretch", 
    flexDirection: "column", 
    gap: 12, 
    marginBottom: 16 
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  primaryBtn: { 
    backgroundColor: "#2563EB",
  },
  primaryText: { color: "white", fontWeight: "800", fontSize: 16 },
  secondaryBtn: { 
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  secondaryText: { color: "#374151", fontWeight: "700", fontSize: 15 },
  sectionHeader: {
    marginTop: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontWeight: "800", color: "#111827", fontSize: 16 },
  sectionLink: { color: "#2563EB", fontWeight: "700", fontSize: 14 },
  empty: { 
    flex: 1, 
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: "center", 
    justifyContent: "center" 
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#111827",
    marginBottom: 8
  },
  emptyText: { 
    fontSize: 14, 
    color: "#6B7280", 
    textAlign: "center",
    lineHeight: 20
  },
});
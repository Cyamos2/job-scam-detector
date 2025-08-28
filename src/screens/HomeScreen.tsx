import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/HomeStack";
import { useColors } from "../theme/useColors";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ navigation }: Props) {
  const { bg, card, text, muted, colors } = useColors();

  return (
    <ScrollView contentContainerStyle={[styles.container, bg]}>
      <View style={[styles.headerCard, card]}>
        <Text style={[styles.title, text]}>Job Scam Detector</Text>
        <Text style={[styles.sectionTitle, text]}>Home</Text>
        <Text style={[styles.body, muted]}>
          Tap Start to add text/links or pick a screenshot to analyze.
        </Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate("AddContent")}
        style={[styles.startBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.startText}>Start</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, gap: 16 },
  headerCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 6 },
  title: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 6 },
  body: { fontSize: 14 },
  startBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startText: { color: "white", fontWeight: "700", fontSize: 16 },
});
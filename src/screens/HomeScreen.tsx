// src/screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useColors } from "../theme/useColors";
import { goToAddContent } from "../navigation/goTo";

type Props = { navigation: any };

export default function HomeScreen({ navigation }: Props) {
  const { colors, bg, card, text, muted } = useColors();

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: "Home" });
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safe, bg]}>
      <ScrollView
        contentContainerStyle={[styles.container]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Card */}
        <View style={[styles.hero, card, { borderColor: colors.border }]}>
          <Text style={[styles.appTitle, text]}>Scamicide</Text>
          <Text style={[styles.subtitle, muted]}>
            Paste job text or pick a screenshot to analyze.
          </Text>

          <Pressable
            onPress={() => goToAddContent(navigation)}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryBtnText}>Start</Text>
          </Pressable>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => goToAddContent(navigation)}
            style={[styles.action, card, { borderColor: colors.border }]}
          >
            <Text style={[styles.actionTitle, text]}>Analyze Text</Text>
            <Text style={[styles.actionHint, muted]}>Paste a post or message</Text>
          </Pressable>

          <Pressable
            onPress={() => goToAddContent(navigation)}
            style={[styles.action, card, { borderColor: colors.border }]}
          >
            <Text style={[styles.actionTitle, text]}>Pick Screenshot</Text>
            <Text style={[styles.actionHint, muted]}>Scan image content</Text>
          </Pressable>
        </View>

        {/* Tips */}
        <View style={[styles.tipCard, card, { borderColor: colors.border }]}>
          <Text style={[styles.tipTitle, text]}>Tips</Text>
          <Text style={[styles.tipItem, muted]}>
            • Links work: paste a LinkedIn/Indeed URL.
          </Text>
          <Text style={[styles.tipItem, muted]}>
            • Sensitivity is adjustable in Settings.
          </Text>
          <Text style={[styles.tipItem, muted]}>
            • Saved results live in the Database tab.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },

  hero: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
  },
  primaryBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  action: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionHint: {
    fontSize: 12,
  },

  tipCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  tipTitle: { fontSize: 14, fontWeight: "800" },
  tipItem: { fontSize: 13, lineHeight: 18 },
});
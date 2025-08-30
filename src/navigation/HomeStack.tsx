// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../theme/useColors";

type Props = { navigation: any };

export default function HomeScreen({ navigation }: Props) {
  const { colors, bg, card, text } = useColors();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Home",
      headerShown: true,
    });
  }, [navigation]);

  return (
    <View style={[styles.container, bg]}>
      {/* ⬇️ removed <Text>Home</Text> title */}
      <Text style={[styles.appTitle, text]}>Scamicide</Text>

      <Text style={[styles.subtitle, text]}>
        Paste text or pick a screenshot to analyze.
      </Text>

      <Pressable
        onPress={() => navigation.navigate("AddContent")}
        style={[styles.startBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.startBtnText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: "center", justifyContent: "center" },
  appTitle: { fontSize: 36, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  startBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  startBtnText: { color: "white", fontWeight: "700", fontSize: 18 },
});
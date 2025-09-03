// src/screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootTabParamList } from "../navigation/types";
import { goToAddContent } from "../navigation/goTo";
import Screen from "../components/Screen"; // ✅ wrapper to handle safe area
import Logo from "../../assets/scamicide-logo.png";

const ORANGE = "#FF5733";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const [query, setQuery] = React.useState("");

  const onStart = () => goToAddContent(navigation);

  const onPickScreenshot = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need Photos access to pick a screenshot."
        );
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      navigation.getParent()?.navigate("Home", {
        screen: "AddContent",
        params: { presetUri: result.assets[0].uri },
      });
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Image source={Logo} resizeMode="contain" style={styles.logo} />

        <Text style={styles.title}>Job Scam Detector</Text>
        <Text style={styles.subtitle}>
          Scan job posts, verify companies, avoid scams.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by company or role"
          placeholderTextColor="#9aa0a6"
          style={styles.search}
          returnKeyType="search"
        />

        <View style={styles.actions}>
          <Pressable onPress={onStart} style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryText}>Start</Text>
          </Pressable>
          <Pressable onPress={onPickScreenshot} style={styles.ctaSecondary}>
            <Text style={styles.ctaSecondaryText}>Pick Screenshot</Text>
          </Pressable>
        </View>

        <Text style={styles.helper}>
          Tip: You can also paste a job link inside Add Content.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20, // ✅ consistent horizontal padding
    justifyContent: "center", // centers nicely in the middle
  },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#222" },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  search: {
    width: "100%",
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  ctaPrimary: {
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ctaPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  ctaSecondary: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ctaSecondaryText: { color: "#111827", fontWeight: "700", fontSize: 16 },
  helper: { marginTop: 14, color: "#6b7280", textAlign: "center" },
});
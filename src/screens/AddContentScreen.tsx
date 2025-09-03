import * as React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, type Risk, type JobInput } from "@/lib/api";
import type { HomeStackParamList, SafeNav } from "@/navigation/types";

// Use strong type if "AddContent" exists in HomeStackParamList; otherwise `any`.
type Nav = SafeNav<HomeStackParamList, "AddContent">;

const risks: Risk[] = ["low", "medium", "high"];

export default function AddContentScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme() as any;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [risk, setRisk] = React.useState<Risk>("low");
  const [submitting, setSubmitting] = React.useState(false);

  // Header & custom back
  React.useLayoutEffect(() => {
    navigation.setOptions?.({
      title: "Add Content",
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack?.()}>
          <Text
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: colors?.primary ?? "#ff5a2c",
              fontWeight: "600",
            }}
          >
            ‹ Home
          </Text>
        </Pressable>
      ),
    } as any);
  }, [navigation, colors?.primary]);

  const onSubmit = async () => {
    if (!title.trim() || !company.trim()) {
      Alert.alert("Missing info", "Please enter a Title and Company.");
      return;
    }
    const input: JobInput = {
      title: title.trim(),
      company: company.trim(),
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
      risk,
    };

    setSubmitting(true);
    try {
      // Works with new and legacy api shapes
      const creator =
        api.createJob ?? (api as any).api?.create ?? (api as any).create;
      if (!creator) throw new Error("Create endpoint not available.");
      await creator(input);
      Alert.alert("Added", "Job saved.");
      navigation.goBack?.();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Add failed", e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const pickScreenshot = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.85,
        allowsMultipleSelection: false,
      });
      if (!res.canceled && res.assets?.length) {
        Alert.alert("Picked", "Screenshot attached (placeholder).");
        // Hook up OCR/parse here later.
      }
    } catch (e: any) {
      Alert.alert("Image Picker", e?.message ?? "Unable to open gallery.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: "#fff" }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
            Add Content
          </Text>

          <Label>Title</Label>
          <Field value={title} onChangeText={setTitle} placeholder="Job title" />

          <Label style={{ marginTop: 12 }}>Company</Label>
          <Field value={company} onChangeText={setCompany} placeholder="Company name" />

          <Label style={{ marginTop: 12 }}>URL</Label>
          <Field
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />

          <Label style={{ marginTop: 16 }}>Risk</Label>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 2 }}>
            {risks.map((r) => (
              <SegButton key={r} active={risk === r} label={r.toUpperCase()} onPress={() => setRisk(r)} />
            ))}
          </View>

          <Label style={{ marginTop: 16 }}>Notes</Label>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            multiline
            textAlignVertical="top"
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              minHeight: 110,
            }}
          />

          <View style={{ height: 18 }} />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <PrimaryButton label={submitting ? "Adding..." : "Add"} onPress={onSubmit} disabled={submitting} />
            <SecondaryButton label="Pick Screenshot" onPress={pickScreenshot} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------- tiny UI helpers ---------- */

function Label({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[{ fontSize: 13, color: "#6B7280", marginBottom: 6 }, style]}>{children}</Text>;
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "#fff",
        },
        props.style,
      ]}
    />
  );
}

function SegButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#FF5A2C" : "#E5E7EB",
        backgroundColor: active ? "rgba(255,90,44,0.08)" : "#fff",
      }}
    >
      <Text style={{ fontWeight: "700", color: active ? "#FF5A2C" : "#111827" }}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: disabled ? "#F59E8B" : "#FF5A2C",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
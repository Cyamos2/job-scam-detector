// src/screens/AddContentScreen.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ToastAndroid,
  Animated,
  Easing,
} from "react-native";
import { useNavigation, useTheme, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Screen from "../components/Screen";
import ScoreBadge from "../components/ScoreBadge";
import { scoreJob } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "AddContent">;
type Rt = RouteProp<RootStackParamList, "AddContent">;
type Risk = "low" | "medium" | "high";

const URL_RE = /^https?:\/\/[^\s]+$/i;

export default function AddContentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors, dark } = useTheme();
  const { create, update, items } = useJobs();

  // --- detect edit mode
  const editId = route.params?.editId;
  const editingJob = React.useMemo(
    () => (editId ? items.find((j) => j.id === editId) : undefined),
    [editId, items]
  );
  const isEditing = !!editingJob;

  // --- state
  const [title, setTitle] = React.useState(editingJob?.title ?? "");
  const [company, setCompany] = React.useState(editingJob?.company ?? "");
  const [url, setUrl] = React.useState(editingJob?.url ?? "");
  const [risk, setRisk] = React.useState<Risk>(editingJob?.risk ?? "low");
  const [notes, setNotes] = React.useState(editingJob?.notes ?? "");
  const [showErrors, setShowErrors] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const lastSubmitted = React.useRef<string | null>(null);

  // keep state in sync if user navigates to a different editId without unmount
  React.useEffect(() => {
    if (editingJob) {
      setTitle(editingJob.title ?? "");
      setCompany(editingJob.company ?? "");
      setUrl(editingJob.url ?? "");
      setRisk(editingJob.risk ?? "low");
      setNotes(editingJob.notes ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingJob?.id]);

  // --- Live score preview (reasons + score)
  const preview = React.useMemo(() => {
    const input = {
      title,
      company,
      url: url.trim() ? url.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      risk,
    };
    return scoreJob(input);
  }, [title, company, url, notes, risk]);

  // --- iOS toast/snackbar (Android uses ToastAndroid)
  const snackY = React.useRef(new Animated.Value(-60)).current;
  const [snackText, setSnackText] = React.useState("");
  const showSnack = (msg: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return;
    }
    setSnackText(msg);
    Animated.sequence([
      Animated.timing(snackY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(900),
      Animated.timing(snackY, {
        toValue: -60,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // --- Validation helpers
  const errorTitle = showErrors && !title.trim();
  const errorCompany = showErrors && !company.trim();
  const errorUrl = showErrors && !!url.trim() && !URL_RE.test(url.trim());

  // --- Submit flow
  const doSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        company: company.trim(),
        url: url.trim() ? url.trim() : undefined,
        risk,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      // de-dupe accidental double taps
      const fp = JSON.stringify({ mode: isEditing ? "edit" : "create", id: editId ?? "", payload });
      if (lastSubmitted.current === fp) {
        setSaving(false);
        return;
      }
      lastSubmitted.current = fp;

      if (isEditing && editId) {
        await update(editId, payload);
        showSnack("Changes saved");
      } else {
        await create(payload);
        showSnack("Added to database");
      }

      // small delay on iOS so toast is visible, then go back
      if (Platform.OS === "ios") {
        setTimeout(() => navigation.goBack(), 600);
      } else {
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert(isEditing ? "Save failed" : "Add failed", String(e ?? "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = () => {
    if (!title.trim() || !company.trim() || (url.trim() && !URL_RE.test(url.trim()))) {
      setShowErrors(true);
      return;
    }
    if (saving) return;

    Alert.alert(
      isEditing ? "Save changes?" : "Add this item?",
      isEditing ? "Update this entry in the database?" : "Are you sure you want to add this to the database?",
      [
        { text: "Cancel", style: "cancel" },
        { text: isEditing ? "Save" : "Add", onPress: doSubmit },
      ]
    );
  };

  // risk chip helpers
  const riskBg: Record<Risk, string> = { low: "#ECFDF5", medium: "#FFF7ED", high: "#FEF2F2" };
  const riskBorder: Record<Risk, string> = { low: "#A7F3D0", medium: "#FED7AA", high: "#FCA5A5" };
  const riskText: Record<Risk, string> = { low: "#047857", medium: "#B45309", high: "#B91C1C" };

  return (
    <Screen>
      {/* iOS snackbar */}
      {Platform.OS === "ios" && (
        <Animated.View style={[styles.snack, { transform: [{ translateY: snackY }] }]}>
          <Text style={styles.snackText}>{snackText}</Text>
        </Animated.View>
      )}

      {/* Header row with live score */}
      <View style={styles.headerRow}>
        <Text style={[styles.h1, { color: colors.text }]}>{isEditing ? "Edit Content" : "Add Content"}</Text>
        <ScoreBadge score={preview.score} />
      </View>

      {/* Top reason chip (if any) */}
      {!!preview.reasons.length && (
        <View style={styles.previewChip}>
          <Text style={styles.previewChipText}>{preview.reasons[0].label}</Text>
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Payroll Assistant"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            { borderColor: errorTitle ? "#ef4444" : "#E5E7EB", color: colors.text, backgroundColor: colors.card },
          ]}
        />

        <Text style={styles.label}>Company *</Text>
        <TextInput
          value={company}
          onChangeText={setCompany}
          placeholder="e.g., Fakester Ltd"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            { borderColor: errorCompany ? "#ef4444" : "#E5E7EB", color: colors.text, backgroundColor: colors.card },
          ]}
        />

        <Text style={styles.label}>URL (optional)</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com"
          autoCapitalize="none"
          keyboardType="url"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            { borderColor: errorUrl ? "#ef4444" : "#E5E7EB", color: colors.text, backgroundColor: colors.card },
          ]}
        />
        {errorUrl ? <Text style={styles.helperError}>Enter a valid http(s) URL</Text> : null}

        <Text style={styles.label}>Risk</Text>
        <View style={styles.chipsRow}>
          {(["low", "medium", "high"] as const).map((r) => {
            const active = risk === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRisk(r)}
                style={[
                  styles.riskChip,
                  active && { borderColor: riskBorder[r], backgroundColor: riskBg[r] },
                ]}
              >
                <Text style={[styles.riskChipText, active && { color: riskText[r] }]}>{r.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Paste the message or any context here..."
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.textarea,
            { color: colors.text, backgroundColor: colors.card, borderColor: "#E5E7EB" },
          ]}
          multiline
        />

        <Pressable onPress={onSubmit} disabled={saving} style={[styles.addBtn, saving && { opacity: 0.6 }]}>
          <Text style={styles.addBtnText}>{saving ? (isEditing ? "Saving…" : "Adding…") : isEditing ? "Save" : "Add"}</Text>
        </Pressable>

        {showErrors && (errorTitle || errorCompany || errorUrl) ? (
          <Text style={styles.formError}>Please complete required fields and fix the URL format.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // snackbar
  snack: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  snackText: {
    backgroundColor: "#111",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700",
  },

  headerRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, flexDirection: "row", alignItems: "center" },
  h1: { fontSize: 24, fontWeight: "800", flex: 1 },

  previewChip: {
    marginLeft: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    backgroundColor: "#FFF1E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewChipText: { color: "#B45309", fontWeight: "700" },

  form: { paddingHorizontal: 16, paddingBottom: 24 },
  label: { marginTop: 14, marginBottom: 6, fontWeight: "800", color: "#111" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  textarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, minHeight: 120, textAlignVertical: "top" },

  helperError: { color: "#ef4444", marginTop: 6 },
  chipsRow: { flexDirection: "row", gap: 10 },
  riskChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff" },
  riskChipText: { fontWeight: "700", color: "#111" },

  addBtn: { marginTop: 18, backgroundColor: "#1f6cff", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "800" },
  formError: { color: "#ef4444", marginTop: 12, fontWeight: "600" },
});
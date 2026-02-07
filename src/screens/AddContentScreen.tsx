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
  Modal,
  ScrollView,
  Button,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { analytics } from "../lib/analytics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Screen from "../components/Screen";
import ScoreBadge from "../components/ScoreBadge";
import { scoreJob, scoreJobEnriched, type ScoreResultExtended } from "../lib/scoring";
import { useJobs } from "../hooks/useJobs";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "AddContent">;
type Rt = RouteProp<RootStackParamList, "AddContent">;

const URL_RE = /^https?:\/\/[^\s]+$/i;

export default function AddContentScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { colors, dark } = useTheme();

  const { items, create, update, getById } = useJobs();

  // Are we editing?
  const editId = route.params?.editId ?? undefined;
  const isEdit = !!editId;

  // Local form state
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [showErrors, setShowErrors] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const lastSubmitted = React.useRef<string | null>(null);

  // Prefill when editing or from route prefill (e.g., screenshot OCR)
  const [ocrPreviewText, setOcrPreviewText] = React.useState<string | null>(null);
  const [ocrPreviewConfidence, setOcrPreviewConfidence] = React.useState<number | null>(null);
  const [ocrPending, setOcrPending] = React.useState(false);
  const [showOcrModal, setShowOcrModal] = React.useState(false);

  React.useEffect(() => {
    if (isEdit && editId) {
      const existing =
        (typeof getById === "function" ? getById(editId) : undefined) ??
        items.find(x => x.id === editId);
      if (!existing) return;
      setTitle(existing.title);
      setCompany(existing.company);
      setLocation(existing.location ?? "");
      setUrl(existing.url ?? "");
      setNotes(existing.notes ?? "");
      return;
    }

    const prefill = route.params?.prefill;
    if (prefill) {
      if (prefill.title) setTitle(prefill.title);
      if (prefill.company) setCompany(prefill.company);
      if ((prefill as any).location) setLocation((prefill as any).location ?? "");
      if (prefill.url) setUrl(prefill.url ?? "");
      if (prefill.notes) {
        // Defer applying OCR text to Notes until user accepts — keep as a pending preview
        setOcrPreviewText(prefill.notes ?? null);
        setOcrPreviewConfidence((prefill as any)?.confidence ?? null);
        setOcrPending(true);
        // Show a subtle prompt
        showSnack(`Imported text ready from screenshot (${String(prefill.notes).length} chars)`);
      }
    }
  }, [isEdit, editId, getById, items, route.params?.prefill]);

  // Live score preview (fast, synchronous)
  const preview = React.useMemo(() => {
    const input = {
      title,
      company,
      location: location.trim() ? location.trim() : undefined,
      url: url.trim() ? url.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    };
    return scoreJob(input);
  }, [title, company, url, notes]);

  // Enriched scoring (WHOIS) — debounced async call when there's a URL
  const [enriched, setEnriched] = React.useState<ScoreResultExtended | null>(null);
  const [enriching, setEnriching] = React.useState(false);

  React.useEffect(() => {
    // Only run when there is a URL to check
    const active = url.trim();
    if (!active) {
      setEnriched(null);
      setEnriching(false);
      return;
    }

    let mounted = true as boolean;
    const t = setTimeout(async () => {
      try {
        setEnriching(true);
        const res = await scoreJobEnriched({ title, company, location: location.trim() || undefined, url: url.trim(), notes });
        if (!mounted) return;
        setEnriched(res);
      } catch (e) {
        // ignore for now
      } finally {
        if (mounted) setEnriching(false);
      }
    }, 650); // debounce

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [title, company, url, notes]);

  // iOS snackbar (Android uses Toast)
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

  // Validation
  const errorTitle = showErrors && !title.trim();
  const errorCompany = showErrors && !company.trim();
  const errorUrl = showErrors && !!url.trim() && !URL_RE.test(url.trim());

  // Create
  const doCreate = async () => {
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        company: company.trim(),
        location: location.trim() ? location.trim() : undefined,
        url: url.trim() ? url.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const fp = JSON.stringify({ mode: "create", ...payload });
      if (lastSubmitted.current === fp) return;
      lastSubmitted.current = fp;

      await create(payload);
      showSnack("Added");
      nav.goBack();
    } catch (e) {
      Alert.alert("Add failed", String(e ?? "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Update
  const doUpdate = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const changes = {
        title: title.trim(),
        company: company.trim(),
        location: location.trim() ? location.trim() : undefined,
        url: url.trim() ? url.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const fp = JSON.stringify({ mode: "update", id: editId, ...changes });
      if (lastSubmitted.current === fp) return;
      lastSubmitted.current = fp;

      await update(editId, changes);
      showSnack("Saved");
      nav.goBack();
    } catch (e) {
      Alert.alert("Update failed", String(e ?? "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Submit
  const onSubmit = () => {
    if (
      !title.trim() ||
      !company.trim() ||
      (url.trim() && !URL_RE.test(url.trim()))
    ) {
      setShowErrors(true);
      return;
    }
    if (saving) return;

    Alert.alert(
      isEdit ? "Save changes?" : "Add this item?",
      isEdit
        ? "Update this entry in the database?"
        : "Add this to the database?",
      [
        { text: "Cancel", style: "cancel" },
        { text: isEdit ? "Save" : "Add", onPress: isEdit ? doUpdate : doCreate },
      ]
    );
  };

  return (
    <Screen>
      {/* iOS snackbar */}
      {Platform.OS === "ios" && (
        <Animated.View
          style={[styles.snack, { transform: [{ translateY: snackY }] }]}
        >
          <Text style={styles.snackText}>{snackText}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.h1, { color: colors.text }]}>
          {isEdit ? "Edit Job Analysis" : "Analyze Job Posting"}
        </Text>
      </View>

      {ocrPending && !isEdit && ocrPreviewText && (
        <View style={styles.importedBanner}>
          <Text style={styles.importedBannerText}>Imported text from screenshot</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {typeof ocrPreviewConfidence === 'number' && (
              <View style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: (ocrPreviewConfidence >= 80 ? '#10B981' : (ocrPreviewConfidence >= 60 ? '#F59E0B' : '#EF4444')) }}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>{Math.round(ocrPreviewConfidence)}%</Text>
              </View>
            )}
            <Pressable onPress={() => setShowOcrModal(true)} style={{ marginLeft: 8, marginRight: 8 }}>
              <Text style={{ color: '#2563EB', fontWeight: '700' }}>Preview</Text>
            </Pressable>
            <Pressable onPress={async () => { setNotes(ocrPreviewText ?? ''); setOcrPending(false); await analytics.trackScreenshotAnalysis(true, (ocrPreviewText ?? '').length); if ((ocrPreviewConfidence ?? 100) < 60) showSnack('Applied (low confidence)'); else showSnack('OCR text applied'); }}>
              <Text style={{ color: '#10B981', fontWeight: '700' }}>Use text</Text>
            </Pressable>
            <Pressable onPress={async () => { setOcrPreviewText(null); setOcrPending(false); await analytics.trackScreenshotAnalysis(false, undefined, 'user_discarded'); showSnack('OCR text discarded'); }}>
              <Text style={{ color: '#EF4444', fontWeight: '700' }}>Discard</Text>
            </Pressable>
          </View>
        </View>
      )}

      {(title.trim() || company.trim()) && (
        <View style={[styles.scoreCard, { backgroundColor: colors.card }]}> 
          <View style={styles.scoreRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreLabel}>Risk Score</Text>
              {!!(enriched?.reasons?.length ?? preview.reasons.length) && (
                <Text style={styles.scoreHint} numberOfLines={1}>
                  {(enriched?.reasons?.[0]?.label) ?? preview.reasons[0].label}
                </Text>
              )}
              {enriching && <Text style={[styles.scoreHint, { marginTop: 6 }]}>Checking domain info…</Text>}
              {enriched?.evidence?.domainAgeDays != null && (
                <Text style={[styles.scoreHint, { marginTop: 6 }]}>Domain age: {enriched.evidence.domainAgeDays} days{enriched.evidence.domainAgeDays < 90 ? " (young)" : ""}</Text>
              )}
            </View>
            <ScoreBadge score={(enriched?.score ?? preview.score)} />
          </View>
        </View>
      )}

      {/* OCR Preview Modal */}
      <Modal visible={showOcrModal} animationType="slide" onRequestClose={() => setShowOcrModal(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Preview OCR Text</Text>
            {typeof ocrPreviewConfidence === 'number' && (
              <Text style={{ color: (ocrPreviewConfidence >= 80 ? '#10B981' : (ocrPreviewConfidence >= 60 ? '#F59E0B' : '#EF4444')), marginBottom: 8 }}>Confidence: {Math.round(ocrPreviewConfidence)}%</Text>
            )}
            <Text style={{ marginBottom: 8, color: '#374151' }}>Edit the OCR result below and tap "Use text" to apply it to Notes.</Text>
            <TextInput
              value={ocrPreviewText ?? ''}
              onChangeText={(t) => setOcrPreviewText(t)}
              multiline
              textAlignVertical="top"
              style={[styles.textarea, { minHeight: 220, marginBottom: 12 }]}
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <Button title="Discard" color="#EF4444" onPress={async () => { setShowOcrModal(false); setOcrPreviewText(null); setOcrPending(false); await analytics.trackScreenshotAnalysis(false, undefined, 'user_discarded'); showSnack('OCR text discarded'); }} />
              <Button title="Use text" onPress={async () => { setNotes(ocrPreviewText ?? ''); setShowOcrModal(false); setOcrPending(false); await analytics.trackScreenshotAnalysis(true, (ocrPreviewText ?? '').length); showSnack('OCR text applied'); }} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Payroll Assistant"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            {
              borderColor: errorTitle ? "#EF4444" : "#E5E7EB",
              color: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          returnKeyType="next"
        />

        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          value={company}
          onChangeText={setCompany}
          placeholder="e.g., Acme Corp"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            {
              borderColor: errorCompany ? "#EF4444" : "#E5E7EB",
              color: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          returnKeyType="next"
        />

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., Remote, New York, NY, or Worldwide"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            {
              borderColor: "#E5E7EB",
              color: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          returnKeyType="next"
        />

        <Text style={styles.label}>Job Posting URL (optional)</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/jobs/123"
          autoCapitalize="none"
          keyboardType="url"
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.input,
            {
              borderColor: errorUrl ? "#EF4444" : "#E5E7EB",
              color: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          returnKeyType="next"
        />
        {errorUrl && (
          <Text style={styles.helperError}>⚠️ Please enter a valid http(s) URL</Text>
        )}

        <Text style={styles.label}>Job Description & Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Paste the full job description, message from recruiter, or any suspicious details here..."
          placeholderTextColor={dark ? "#94a3b8" : "#9aa0a6"}
          style={[
            styles.textarea,
            {
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: "#E5E7EB",
            },
          ]}
          multiline
          textAlignVertical="top"
        />

        <Pressable
          onPress={onSubmit}
          disabled={saving}
          style={[styles.addBtn, saving && { opacity: 0.6 }]}
        >
          <Text style={styles.addBtnText}>
            {saving ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save" : "Add"}
          </Text>
        </Pressable>

        {showErrors && (errorTitle || errorCompany || errorUrl) ? (
          <Text style={styles.formError}>
            Please complete required fields and fix the URL format.
          </Text>
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

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  h1: { fontSize: 24, fontWeight: "800" },

  scoreCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },

  form: { paddingHorizontal: 16, paddingBottom: 32 },
  label: { 
    marginTop: 16, 
    marginBottom: 8, 
    fontWeight: "700", 
    color: "#374151",
    fontSize: 14
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 140,
    fontSize: 15,
  },

  helperError: { color: "#EF4444", marginTop: 6, fontSize: 13 },

  addBtn: {
    marginTop: 24,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  formError: { color: "#EF4444", marginTop: 12, fontWeight: "600" },

  importedBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#111827",
    opacity: 0.06,
  },
  importedBannerText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
  },
});
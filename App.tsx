// App.tsx
import * as React from "react";
import { StatusBar, AppState } from "react-native";
import { Appearance } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type Theme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation/RootNavigator";
import {
  SettingsProvider,
  useSettings,
  resolveThemeName,
} from "./src/SettingsProvider";
import { JobsProvider } from "./src/hooks/useJobs";
import { analytics } from "./src/lib/analytics";
import { crashReporting, SentryErrorBoundary } from "./src/lib/crashReporting";
import * as Application from "expo-application";

function ThemedNav() {
  const { settings } = useSettings(); // { theme: "system" | "light" | "dark", ... }

  // NOTE: resolveThemeName expects ONE argument (the preference).
  const resolved = resolveThemeName(settings.theme); // -> "light" | "dark"
  const navTheme: Theme = resolved === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle={resolved === "dark" ? "light-content" : "dark-content"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

function AppContent() {
  const { settings } = useSettings();
  const [analyticsInitialized, setAnalyticsInitialized] = React.useState(false);
  const [crashReportingInitialized, setCrashReportingInitialized] = React.useState(false);

  // Initialize analytics and crash reporting
  React.useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize crash reporting first (more critical)
        await crashReporting.initialize();
        setCrashReportingInitialized(true);

        // Set user context if available (prefer Android synchronous id, else iOS async)
        let userId = "anonymous";
        try {
          if (typeof (Application as any).getAndroidId === "function") {
            // getAndroidId is synchronous on Android
            userId = (Application as any).getAndroidId();
          } else if (typeof (Application as any).getIosIdForVendorAsync === "function") {
            const iosId = await (Application as any).getIosIdForVendorAsync();
            userId = iosId || "anonymous";
          }
        } catch (e) {
          // Ignore any device id retrieval errors
        }
        crashReporting.setUser(userId);

        // Add initial breadcrumbs
        crashReporting.addBreadcrumb("app", "App started", {
          theme: settings.theme,
          colorScheme: Appearance.getColorScheme(),
        });

        // Initialize analytics
        await analytics.initialize();
        setAnalyticsInitialized(true);

        // Track app opened
        await analytics.trackEvent("app_opened", {
          platform: "ios",
          theme: settings.theme,
        });

        // Best-effort cleanup of OCR cache (remove old temp files)
        try {
          const { cleanupOcrCache } = await import('./src/lib/ocr');
          await cleanupOcrCache();
        } catch (_) {
          // ignore cleanup errors
        }

        console.log("[App] Services initialized:", {
          analytics: analyticsInitialized,
          crashReporting: crashReportingInitialized,
        });
      } catch (error) {
        console.error("[App] Failed to initialize services:", error);
      }
    };

    initServices();

    // Track app lifecycle events
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      analytics.trackEvent("color_scheme_changed", {
        new_scheme: colorScheme || "unknown",
      });
    });

    // Periodic OCR cache cleanup: hourly + on app resume
    let cleanupInterval: number | undefined;

    const startCleanupInterval = () => {
      // Every 1 hour (3600_000 ms)
      cleanupInterval = setInterval(async () => {
        try {
          const { cleanupOcrCache } = await import("./src/lib/ocr");
          await cleanupOcrCache();
        } catch (_) {
          // ignore
        }
      }, 60 * 60 * 1000) as unknown as number;
    };

    startCleanupInterval();

    const handleAppStateChange = async (next: string) => {
      if (next === "active") {
        try {
          const { cleanupOcrCache } = await import("./src/lib/ocr");
          await cleanupOcrCache();
        } catch (_) {
          // ignore
        }
      }
    };

    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      appStateSubscription.remove();
      if (cleanupInterval) clearInterval(cleanupInterval as unknown as number);
    };
  }, []);

  return <ThemedNav />;
}

export default function App() {
  return (
    <SentryErrorBoundary fallback={({ error, componentStack, resetError }) => (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <ThemedNav />
      </SafeAreaProvider>
    )}>
      <SettingsProvider>
        <JobsProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </JobsProvider>
      </SettingsProvider>
    </SentryErrorBoundary>
  );
}


// App.tsx
import * as React from "react";
import { StatusBar } from "react-native";
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

        // Set user context if available
        const userId = Application.androidId || Application.getIosIdForVendorAsync?.() || "anonymous";
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

    return () => {
      subscription.remove();
    };
  }, []);

  return <ThemedNav />;
}

export default function App() {
  return (
    <SentryErrorBoundary fallback={({ error, componentStack, resetError }) => (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <ThemedNav />
        </NavigationContainer>
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


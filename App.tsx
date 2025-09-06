// App.tsx
import * as React from "react";
import { StatusBar } from "react-native";
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

export default function App() {
  return (
    <SettingsProvider>
      <JobsProvider>
        <SafeAreaProvider>
          <ThemedNav />
        </SafeAreaProvider>
      </JobsProvider>
    </SettingsProvider>
  );
}
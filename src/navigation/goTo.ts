// src/navigation/goTo.ts
import type { NavigationProp } from "@react-navigation/native";
// If you export RootTabsParamList from RootNavigator, you can import and use it here:
// import type { RootTabsParamList } from "./RootNavigator";

export function goToAddContent(navigation: NavigationProp<any>) {
  // Jump from any child stack to Home tab → AddContent screen
  const parent = navigation.getParent();
  if (parent) {
    (parent as any).navigate("HomeTab", { screen: "AddContent" });
  } else {
    // Fallback if caller is already at the tab level
    (navigation as any).navigate("HomeTab", { screen: "AddContent" });
  }
}
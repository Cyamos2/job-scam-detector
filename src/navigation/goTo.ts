// src/navigation/goTo.ts
import type { NavigationProp, ParamListBase } from "@react-navigation/native";

/** Jump to the Add Content screen that lives inside the Home tab. */
export function goToAddContent(navigation: NavigationProp<ParamListBase>) {
  const parent = navigation.getParent();
  if (!parent) return;
  // Safe boundary: parent typed as any for a single cross-tree hop.
  (parent as any).navigate("HomeTab", { screen: "AddContent" });
}
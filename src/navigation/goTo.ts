// src/navigation/goTo.ts
import type { NavigationProp } from "@react-navigation/native";

// Jump to the Home tab from anywhere.
export function goHome(navigation: NavigationProp<any> | any) {
  const parent = navigation?.getParent?.();
  if (parent) {
    (parent as any).navigate("HomeTab");
  } else {
    (navigation as any).navigate("HomeTab");
  }
}

// Jump straight to Add Content (inside Home tab).
export function goToAddContent(navigation: NavigationProp<any> | any) {
  const parent = navigation?.getParent?.();
  if (parent) {
    (parent as any).navigate("HomeTab", { screen: "AddContent" });
  } else {
    (navigation as any).navigate("HomeTab", { screen: "AddContent" });
  }
}
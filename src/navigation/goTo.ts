import type { NavigationProp } from "@react-navigation/native";

export function goToAddContent(navigation: NavigationProp<any>) {
  const parent = (navigation as any).getParent?.();
  if (parent?.navigate) {
    (parent as any).navigate("HomeTab", { screen: "AddContent" });
  } else {
    (navigation as any).navigate("AddContent");
  }
}
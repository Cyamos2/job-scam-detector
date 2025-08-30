import type { NavigationProp } from "@react-navigation/native";

export function goToAddContent(navigation: NavigationProp<any>) {
  const parent: any = (navigation as any).getParent?.();
  if (parent?.navigate) {
    parent.navigate("HomeTab", { screen: "AddContent" });
  } else {
    (navigation as any).navigate("AddContent");
  }
}
import { CommonActions, NavigationHelpers } from "@react-navigation/native";

/** Jump from anywhere to HomeTab -> AddContent (no type fuss, no loops). */
export function goToAddContent(navigation: NavigationHelpers<any>) {
  const parent = (navigation as any).getParent?.();
  if (!parent) return;
  parent.dispatch(
    CommonActions.navigate({
      name: "HomeTab",
      params: { screen: "AddContent" },
    })
  );
}
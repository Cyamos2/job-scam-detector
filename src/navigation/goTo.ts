// src/navigation/goTo.ts
import type { NavigationProp } from '@react-navigation/native';
import type { RootTabParamList } from './types';

/** Open AddContent inside the Home stack. Works from any tab/screen. */
export function goToAddContent(navigation: NavigationProp<RootTabParamList>) {
  // If we are already in Home stack, this will succeed:
  // @ts-ignore best-effort direct stack nav
  try { navigation.navigate('AddContent' as never); return; } catch {}

  // Otherwise, ask the parent (the tab navigator) to switch to Home and show AddContent.
  navigation.getParent<NavigationProp<RootTabParamList>>()
    ?.navigate('Home', { screen: 'AddContent' });
}

/** Jump to Home (root of Home stack). */
export function goHomeTab(navigation: NavigationProp<RootTabParamList>) {
  navigation.getParent<NavigationProp<RootTabParamList>>()
    ?.navigate('Home', { screen: 'HomeMain' });
}
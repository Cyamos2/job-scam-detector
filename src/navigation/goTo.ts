// src/navigation/goTo.ts
import { NavigationProp } from '@react-navigation/native';
import { RootTabParamList } from './types';

export function goToAddContent(navigation: NavigationProp<RootTabParamList>) {
  // reach the Tab navigator then navigate to the Home stack's AddContent
  const parent = navigation.getParent<NavigationProp<RootTabParamList>>();
  if (!parent) return;

  parent.navigate('HomeTab', { screen: 'AddContent' });
}

export function goToHome(navigation: NavigationProp<RootTabParamList>) {
  const parent = navigation.getParent<NavigationProp<RootTabParamList>>();
  parent?.navigate('HomeTab');
}

export function goToDatabase(navigation: NavigationProp<RootTabParamList>) {
  const parent = navigation.getParent<NavigationProp<RootTabParamList>>();
  parent?.navigate('DatabaseTab');
}
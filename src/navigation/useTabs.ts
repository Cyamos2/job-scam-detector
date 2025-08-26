import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabsParamList } from '@/navigation/RootNavigator';

export function useTabs() {
  return useNavigation<BottomTabNavigationProp<TabsParamList>>();
}
import { Redirect } from 'expo-router';
import Tabs, { type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../state/AppState';
import { C, F, R } from '../../theme';

const TABS: Record<string, { label: string; ta: string; icon: string }> = {
  index: { label: 'Trip', ta: 'பயணம்', icon: '🚂' },
  map: { label: 'Map', ta: 'வரைபடம்', icon: '🗺️' },
  games: { label: 'Games', ta: 'விளையாட்டு', icon: '🦀' },
  grownups: { label: 'Grown-ups', ta: 'பெரியவர்கள்', icon: '👪' },
};

/** Four tabs from the wireframes: Trip · Map · Games · Grown-ups. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', paddingBottom: insets.bottom + 6, paddingTop: 8, borderTopLeftRadius: R.md, borderTopRightRadius: R.md }}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const on = state.index === i;
        return (
          <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={tab.label}
            onPress={() => { if (!on) navigation.navigate(route.name); }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56 }}>
            <Text style={{ fontSize: 24, opacity: on ? 1 : 0.55 }}>{tab.icon}</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 13, color: on ? C.indigo : C.inkMuted }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { state } = useApp();
  // First launch: Welcome -> profile -> listening check -> voices, then the tabs.
  if (!state.onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.jasmine } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="grownups" />
    </Tabs>
  );
}

import {
  BalooThambi2_500Medium,
  BalooThambi2_600SemiBold,
  BalooThambi2_700Bold,
  BalooThambi2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/baloo-thambi-2';
import Stack from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '../state/AppState';
import { C } from '../theme';

// Sessions (trip, lesson, blend, book, game) sit outside the (tabs) group, so the
// tab bar is hidden during them. They can't be swiped away: exit is the 1 s hold.
const SESSION = { gestureEnabled: false, animation: 'fade' } as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ BalooThambi2_500Medium, BalooThambi2_600SemiBold, BalooThambi2_700Bold, BalooThambi2_800ExtraBold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.jasmine }} />;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppStateProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.jasmine } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trip" options={SESSION} />
          <Stack.Screen name="done" options={{ ...SESSION, animation: 'slide_from_bottom' }} />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

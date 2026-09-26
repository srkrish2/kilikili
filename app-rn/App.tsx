import {
  BalooThambi2_500Medium,
  BalooThambi2_600SemiBold,
  BalooThambi2_700Bold,
  BalooThambi2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/baloo-thambi-2';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { dayKey, type TripState } from './src/core';
import { DoneScreen } from './src/screens/DoneScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TripScreen } from './src/screens/TripScreen';
import { useSavedState } from './src/storage/savedState';
import { C } from './src/theme';

type Route = { name: 'home' } | { name: 'trip' } | { name: 'done'; trip: TripState };

// Starter navigation is a tiny state machine (Home -> Trip -> Done -> Home).
// Move to Expo Router once Map / Games / Grown-ups screens exist (see CLAUDE.md).
export default function App() {
  const [fontsLoaded] = useFonts({ BalooThambi2_500Medium, BalooThambi2_600SemiBold, BalooThambi2_700Bold, BalooThambi2_800ExtraBold });
  const { state, getProgress, saveProgress, countTrip } = useSavedState();
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const onDone = useCallback((trip: TripState) => { countTrip(dayKey()); setRoute({ name: 'done', trip }); }, [countTrip]);

  if (!fontsLoaded || !state) return <View style={{ flex: 1, backgroundColor: C.jasmine }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {route.name === 'home' && <HomeScreen state={state} onStartTrip={() => setRoute({ name: 'trip' })} />}
      {route.name === 'trip' && (
        <TripScreen state={state} getProgress={getProgress} saveProgress={saveProgress} onDone={onDone} onExit={() => setRoute({ name: 'home' })} />
      )}
      {route.name === 'done' && <DoneScreen trip={route.trip} onHome={() => setRoute({ name: 'home' })} />}
    </SafeAreaProvider>
  );
}

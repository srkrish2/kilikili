import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Art } from '../components/Art';
import { ChunkyButton } from '../components/Buttons';
import { dayKey, status, type SavedState } from '../core';
import { content } from '../generated/content';
import { C, F, R, drop } from '../theme';

export function HomeScreen({ state, onStartTrip }: { state: SavedState; onStartTrip: () => void }) {
  const insets = useSafeAreaInsets();
  const { words } = content.words;
  const scoring = content.rules.scoring;
  const known = words.filter((w) => status(state.progress[w.id], scoring) === 'known').length;
  const need = content.rules.unlocks.lettersLine.knownWords;
  const tripsToday = state.tripsByDay[dayKey()] ?? 0;
  const rested = tripsToday >= content.rules.daily.tripsPerDay;

  return (
    <View style={{ flex: 1, backgroundColor: C.jasmine }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ backgroundColor: C.skyPale, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: R.xl, borderBottomRightRadius: R.xl }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 34, color: C.ink }}>வாங்க!</Text>
          <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.inkSoft }}>Koo is ready at the station.</Text>
          <View style={{ alignItems: 'center', marginTop: 8 }}><Art name="char-koo" width={220} height={160} /></View>
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 20, gap: 12, ...drop(C.cardShadow) }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 13, letterSpacing: 1.5, color: C.peacockDeep }}>TODAY · LISTENING LINE</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 26, color: C.ink }}>
              {rested ? 'Koo is resting. Back tomorrow!' : `${state.settings.length} stops with Anil`}
            </Text>
            <ChunkyButton label={rested ? 'One more (grown-up)' : 'Start the trip'} onPress={onStartTrip}
              color={rested ? C.inkMuted : C.indigo} under={rested ? C.inkSoft : C.indigoDeep} />
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 20, gap: 8, ...drop(C.cardShadow) }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 13, letterSpacing: 1.5, color: C.inkMuted }}>WORDS HE KNOWS</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 40, color: C.ink }}>{known}<Text style={{ fontSize: 20, color: C.inkMuted }}> / {need} to open the Letters Line</Text></Text>
            <View style={{ height: 14, borderRadius: 7, backgroundColor: C.jasmine, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (known / need) * 100)}%`, height: '100%', backgroundColor: C.marigold }} />
            </View>
          </View>
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}

/** Four tabs from the wireframes. Only Trip is live in this starter. Hidden during a trip. */
function TabBar() {
  const insets = useSafeAreaInsets();
  const tabs = [['Trip', true], ['Map', false], ['Games', false], ['Grown-ups', false]] as const;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', paddingBottom: insets.bottom + 6, paddingTop: 10, borderTopLeftRadius: R.md, borderTopRightRadius: R.md }}>
      {tabs.map(([label, live]) => (
        <Pressable key={label} disabled={!live} style={{ flex: 1, alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 15, color: live ? C.indigo : C.cardShadow }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

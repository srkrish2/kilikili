import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Art } from '../../components/Art';
import { dayKey, gameSecondsLeft, lineStatuses, sessionsToday, taughtLetters, tripWords, curriculumLetters } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';

interface GameCard { id: string; title: string; sub: string; bg: string; fg: string; host: string; open: boolean; lock?: string }

export function GamesHub() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const today = dayKey();
  const left = gameSecondsLeft(state, today, content.rules);
  const total = content.rules.daily.gameMinutesPerDay;
  const used = Math.min(total, Math.round((total * 60 - left) / 60));
  const lines = lineStatuses(state, content);
  const taught = taughtLetters(state, curriculumLetters(content.curriculum)).length;
  const words = tripWords(content.words.words, state, content.rules).length;
  // Games are the treat after the day's session (a grown-up preview skips that).
  const afterSession = sessionsToday(state, today) > 0 || state.grownups.previewAllLines;

  const cards: GameCard[] = [
    { id: 'cricket', title: 'Cricket Words', sub: 'Bowl a word, hit a six', bg: C.peacock, fg: '#FFFFFF', host: 'char-anil', open: words >= 3, lock: 'After a few trips' },
    { id: 'song', title: 'Song Time', sub: 'Action songs with Kili', bg: C.marigold, fg: C.ink, host: 'char-kili', open: true },
    { id: 'trainyard', title: 'Train Yard', sub: 'Sort letters into wagons', bg: C.kumkum, fg: '#FFFFFF', host: 'char-koo', open: lines.letters.unlocked && taught >= 2, lock: 'Opens with the Letters Line' },
    { id: 'kolam', title: 'Kolam Trace', sub: 'Join the dots to draw a letter', bg: '#FFFFFF', fg: C.ink, host: 'char-mayil', open: lines.letters.unlocked && taught >= 1, lock: 'Opens with the Letters Line' },
  ];
  const blocked = !afterSession ? 'Games open after today’s trip.' : left <= 0 ? 'Nandu is sleeping. Play time is over for today.' : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.jasmine }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 32 }}>
      <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center', gap: 16 }}>
        <View>
          <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.ink }}>Games</Text>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.inkMuted }}>Every game uses words from his trips</Text>
        </View>
        {blocked && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: R.md, padding: 12, ...drop(C.cardShadow, 3) }}>
            <Art name="char-nandu" width={56} />
            <Text style={{ flex: 1, fontFamily: F.bold, fontSize: 16, color: C.ink }}>{blocked}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {cards.map((g) => {
            const ok = g.open && !blocked;
            return (
              <Pressable key={g.id} disabled={!ok} onPress={() => router.push(`/game/${g.id}`)} accessibilityRole="button" accessibilityLabel={`${g.title}${g.open ? '' : ', locked'}`}
                style={({ pressed }) => ({ flexBasis: 150, flexGrow: 1, height: 200, borderRadius: R.lg, padding: 14, justifyContent: 'space-between',
                  backgroundColor: g.bg, opacity: ok ? 1 : 0.5, transform: [{ translateY: pressed ? 3 : 0 }], ...drop(C.cardShadow, 6) })}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Art name={g.host as never} width={70} />
                  {!g.open && <Text style={{ fontSize: 18 }}>🔒</Text>}
                </View>
                <View>
                  <Text style={{ fontFamily: F.heavy, fontSize: 20, color: g.fg, lineHeight: 24 }}>{g.title}</Text>
                  <Text style={{ fontFamily: F.semibold, fontSize: 13, color: g.fg, opacity: 0.9 }}>{g.open ? g.sub : g.lock}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: R.md, padding: 14, gap: 6, ...drop(C.cardShadow, 3) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>Play time today</Text>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{used} of {total} min</Text>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: C.jasmine, overflow: 'hidden' }}>
            <View style={{ width: `${(used / total) * 100}%`, height: '100%', backgroundColor: C.peacock }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

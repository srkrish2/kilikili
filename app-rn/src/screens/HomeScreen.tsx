import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Art } from '../components/Art';
import { ChunkyButton } from '../components/Buttons';
import { curriculumLetters, dayKey, knownLetters, lineStatuses, sessionsToday, todaysSession, type TodaySession } from '../core';
import { content } from '../generated/content';
import { useApp } from '../state/AppState';
import { C, F, R, drop } from '../theme';

function describe(s: TodaySession, length: number): { line: string; title: string; host: string; href: string } {
  switch (s.kind) {
    case 'trip':
      return { line: 'LISTENING LINE', title: `${length} stops with Anil`, host: 'char-anil', href: '/trip' };
    case 'lesson': {
      const l = curriculumLetters(content.curriculum).find((x) => x.glyph === s.glyph)!;
      return { line: 'LETTERS LINE', title: `Meet ${s.glyph} with Mayil`, host: 'char-mayil', href: `/lesson/${l.n}` };
    }
    case 'blend':
      return { line: 'READING LINE', title: 'Blend words with Aamai', host: 'char-aamai', href: '/blend' };
    case 'book': {
      const b = content.reading.books.find((x) => x.id === s.bookId)!;
      return { line: 'READING LINE', title: `Read “${b.title}”`, host: 'char-kili', href: `/book/${b.id}` };
    }
  }
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const scoring = content.rules.scoring;
  const lines = lineStatuses(state, content);
  const session = describe(todaysSession(state, content), state.settings.length);
  const rested = sessionsToday(state, dayKey()) >= content.rules.daily.tripsPerDay;
  const name = state.profile.childName || 'He';
  const lettersKnown = knownLetters(state, curriculumLetters(content.curriculum), scoring).length;

  // The progress card always points at the next thing to open.
  const goal = !lines.letters.unlocked || lines.letters.preview
    ? { label: `WORDS ${name.toUpperCase()} KNOWS`, have: lines.letters.have, need: lines.letters.need, next: 'to open the Letters Line', color: C.marigold }
    : !lines.reading.unlocked || lines.reading.preview
      ? { label: `LETTERS ${name.toUpperCase()} KNOWS`, have: lettersKnown, need: lines.reading.need, next: 'to open the Reading Line', color: C.kumkum }
      : { label: 'BOOKS READ', have: Object.keys(state.booksRead).length, need: content.reading.books.length, next: 'books on the shelf', color: C.peacock };

  return (
    <View style={{ flex: 1, backgroundColor: C.jasmine }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ backgroundColor: C.skyPale, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: R.xl, borderBottomRightRadius: R.xl }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 34, color: C.ink }}>வாங்க{state.profile.childName ? `, ${state.profile.childName}` : ''}!</Text>
          <Text style={{ fontFamily: F.semibold, fontSize: 17, color: C.inkSoft }}>{rested ? 'Koo is resting at the station.' : 'Koo is ready at the station.'}</Text>
          <View style={{ alignItems: 'center', marginTop: 8 }}><Art name="char-koo" width={220} height={160} /></View>
        </View>

        <View style={{ padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 20, gap: 12, ...drop(C.cardShadow) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: F.heavy, fontSize: 13, letterSpacing: 1.5, color: C.peacockDeep }}>TODAY · {session.line}</Text>
                <Text style={{ fontFamily: F.heavy, fontSize: 26, color: C.ink }}>{rested ? 'Koo is resting. Back tomorrow!' : session.title}</Text>
              </View>
              <Art name={session.host as never} width={72} />
            </View>
            <ChunkyButton label={rested ? 'One more (grown-up)' : 'Start'} onPress={() => router.push(session.href as never)}
              color={rested ? C.inkMuted : C.indigo} under={rested ? C.inkSoft : C.indigoDeep} />
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 20, gap: 8, ...drop(C.cardShadow) }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 13, letterSpacing: 1.5, color: C.inkMuted }}>{goal.label}</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 40, color: C.ink }}>{goal.have}<Text style={{ fontSize: 20, color: C.inkMuted }}> / {goal.need} {goal.next}</Text></Text>
            <View style={{ height: 14, borderRadius: 7, backgroundColor: C.jasmine, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (goal.have / Math.max(1, goal.need)) * 100)}%`, height: '100%', backgroundColor: goal.color }} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { say } from '../audio/voice';
import { Art, Koo } from '../components/Art';
import { ChunkyButton } from '../components/Buttons';
import {
  curriculumLetters, currentStation, dayKey, knownLetters, lineStatuses, sessionsToday, stations, todaysSession, tripCount, yardCargo,
  type LineStatus, type TodaySession,
} from '../core';
import { content } from '../generated/content';
import { useApp } from '../state/AppState';
import { C, F, R, drop } from '../theme';

function describe(s: TodaySession, length: number): { kicker: string; title: string; sub: string; host: string; href: string } {
  switch (s.kind) {
    case 'trip':
      return { kicker: 'LISTENING LINE', title: "Today's trip", sub: `${length} stops · about ${Math.round(length * 0.9)} min`, host: 'char-anil', href: '/trip' };
    case 'lesson': {
      const l = curriculumLetters(content.curriculum).find((x) => x.glyph === s.glyph)!;
      return { kicker: `LETTERS LINE · LESSON ${l.n}`, title: `Meet ${s.glyph}`, sub: '8 short steps · about 8 min', host: 'char-mayil', href: `/lesson/${l.n}` };
    }
    case 'blend':
      return { kicker: 'READING LINE', title: 'Slide and read', sub: `${content.rules.reading.blendWordsPerLesson} words with Aamai`, host: 'char-aamai', href: '/blend' };
    case 'book': {
      const b = content.reading.books.find((x) => x.id === s.bookId)!;
      return { kicker: 'READING LINE', title: `Read “${b.title}”`, sub: `${b.pages.length} pages · read it twice!`, host: 'char-kili', href: `/book/${b.id}` };
    }
  }
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const lines = lineStatuses(state, content);
  const session = describe(todaysSession(state, content), state.settings.length);
  const rested = sessionsToday(state, dayKey()) >= content.rules.daily.tripsPerDay;
  const station = currentStation(state, content);
  const colour = content.rules.yard.engineColours[state.engineColour] ?? content.rules.yard.engineColours[0];
  const stickers = yardCargo(state, content.words.words).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.jasmine }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 32 }}>
      <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center', gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable style={{ flex: 1 }} onPress={() => say(state, null, 'வணக்கம்')} accessibilityHint="Says hello in Tamil">
            <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.ink, lineHeight: 38 }}>வணக்கம்{state.profile.childName ? `, ${state.profile.childName}` : ''}!</Text>
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.inkSoft }}>{rested ? 'Koo is resting at the station.' : 'Koo the engine is waiting for you'}</Text>
          </Pressable>
          <View style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: R.sm, backgroundColor: '#FFFFFF', ...drop(C.cardShadow, 3) }} accessibilityLabel={`${tripCount(state)} trips`}>
            <Text style={{ fontFamily: F.heavy, fontSize: 10, letterSpacing: 1.4, color: C.inkMuted }}>TRIPS</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.ink, lineHeight: 26 }}>{tripCount(state)}</Text>
          </View>
        </View>

        <View style={{ borderRadius: R.lg, overflow: 'hidden', backgroundColor: '#FFFFFF', ...drop(C.cardShadow, 6) }}>
          <View style={{ height: 180, backgroundColor: C.skyPale, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 36, backgroundColor: C.grass }} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 14, height: 8, backgroundColor: C.inkSoft, opacity: 0.5 }} />
            <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: C.marigold, borderRadius: 8, paddingHorizontal: 12, paddingTop: 2, paddingBottom: 4 }}>
              <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.ink, lineHeight: 30 }}>{station.ta}</Text>
              <Text style={{ fontFamily: F.heavy, fontSize: 10, letterSpacing: 1.4, color: C.ink }}>{station.en.toUpperCase()} STATION</Text>
            </View>
            <View style={{ position: 'absolute', top: 16, right: 18 }}><Art name={session.host as never} width={64} /></View>
            <View style={{ position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              {[0, 1].map((i) => <View key={i} style={{ width: 46, height: 32, borderRadius: 6, backgroundColor: C.peacock, marginBottom: 14 }} />)}
              <Koo colour={colour} width={150} />
            </View>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <View>
              <Text style={{ fontFamily: F.heavy, fontSize: 12, letterSpacing: 1.4, color: C.peacockDeep }}>TODAY · {session.kicker}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.ink }}>{rested ? 'Koo is resting. Back tomorrow!' : session.title}</Text>
                {!rested && <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.inkMuted }}>{session.sub}</Text>}
              </View>
            </View>
            <ChunkyButton label={rested ? 'One more (grown-up)' : 'All aboard!'} onPress={() => router.push(session.href as never)}
              color={rested ? C.inkMuted : C.kumkum} under={rested ? C.inkSoft : C.kumkumDeep} style={{ minHeight: 56 }} />
          </View>
        </View>

        <Pressable onPress={() => router.push('/map')} accessibilityRole="link" accessibilityLabel="Your railway. Opens the map" style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.ink }}>Your railway</Text>
            <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.peacockDeep }}>Map ›</Text>
          </View>
          <RailRow label="Listening" colour={C.peacock}>
            <ListeningDots />
          </RailRow>
          <RailRow label="Letters" colour={C.marigold} dark>
            <LineProgress status={lines.letters} unit="known words" lockedText={`Opens at ${lines.letters.need} known words (${lines.letters.have} now)`}
              openText={`${knownLetters(state, curriculumLetters(content.curriculum), content.rules.scoring).length} of ${curriculumLetters(content.curriculum).length} letters known`} />
          </RailRow>
          <RailRow label="Reading" colour={C.kumkum}>
            <LineProgress status={lines.reading} unit="letters" lockedText={`Opens after ${lines.reading.need} letters (${lines.reading.have} now)`}
              openText={`${Object.keys(state.booksRead).length} of ${content.reading.books.length} books read`} />
          </RailRow>
        </Pressable>

        <Pressable onPress={() => router.push('/yard')} accessibilityRole="link"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 14, ...drop(C.cardShadow, 4) }}>
          <Text style={{ fontSize: 30 }}>🚃</Text>
          <Text style={{ flex: 1, fontFamily: F.heavy, fontSize: 18, color: C.ink }}>Wagon yard · {stickers} sticker{stickers === 1 ? '' : 's'}</Text>
          <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.inkMuted }}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function RailRow({ label, colour, dark, children }: { label: string; colour: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 84, borderRadius: 6, paddingVertical: 1, backgroundColor: colour }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 13, color: dark ? C.ink : '#FFFFFF', textAlign: 'center' }}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function ListeningDots() {
  const { state } = useApp();
  const st = stations(state, content);
  const done = st.filter((s) => s.state === 'done').map((s) => s.en);
  const here = st.find((s) => s.state === 'current');
  return (
    <View style={{ gap: 2 }}>
      <View style={{ height: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ position: 'absolute', left: 8, right: 8, height: 5, borderRadius: 3, backgroundColor: C.peacock }} />
        {st.map((s) => (
          <View key={s.id} style={{ width: s.state === 'current' ? 26 : 20, height: s.state === 'current' ? 26 : 20, borderRadius: 13, borderWidth: 3,
            borderColor: s.state === 'current' ? C.ink : C.peacock, backgroundColor: s.state === 'done' ? C.peacock : s.state === 'current' ? C.marigold : '#FFFFFF' }} />
        ))}
      </View>
      <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.inkMuted }}>
        {done.length ? `${done.join(', ')} done · ` : ''}now at {here?.en ?? 'the end'}
      </Text>
    </View>
  );
}

function LineProgress({ status, lockedText, openText }: { status: LineStatus; unit: string; lockedText: string; openText: string }) {
  const locked = !status.unlocked;
  return (
    <View style={{ minHeight: 30, justifyContent: 'center', paddingHorizontal: 12, borderRadius: R.pill, borderWidth: 2, borderStyle: locked ? 'dashed' : 'solid', borderColor: C.cardShadow, backgroundColor: locked ? 'transparent' : '#FFFFFF' }}>
      <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.inkSoft }}>{locked ? `🔒 ${lockedText}` : openText}</Text>
    </View>
  );
}

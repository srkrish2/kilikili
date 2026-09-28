import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Art } from '../../components/Art';
import {
  availableBooks, curriculumLetters, letterStatus, lineStatuses, readingLetters, stations, yardCargo, type LineStatus,
} from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';

const LINES = Object.fromEntries(content.curriculum.lines.map((l) => [l.id, l]));
const COLOR = { listening: C.peacock, letters: C.marigold, reading: C.kumkum } as const;

function LineCard({ id, status, children }: { id: 'listening' | 'letters' | 'reading'; status: LineStatus; children: React.ReactNode }) {
  const line = LINES[id];
  const locked = !status.unlocked;
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 16, gap: 12, borderWidth: locked ? 3 : 0, borderStyle: 'dashed', borderColor: C.cardShadow, ...(locked ? {} : drop(C.cardShadow, 5)) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, backgroundColor: locked ? C.cardShadow : COLOR[id] }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 14, color: locked ? C.inkMuted : id === 'letters' ? C.ink : '#FFFFFF' }}>{line.name.en}</Text>
        </View>
        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.inkMuted, flex: 1 }}>{line.name.ta}</Text>
        {status.preview && <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.kumkumDeep }}>PREVIEW</Text>}
        {locked && <Text style={{ fontSize: 18 }} accessibilityLabel="Locked">🔒</Text>}
      </View>
      {children}
    </View>
  );
}

/** The railway: three lines; locked ones stay visible so he can see what's coming. */
export function MapScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const lines = lineStatuses(state, content);
  const st = stations(state, content);
  const letters = curriculumLetters(content.curriculum);
  const books = availableBooks(content.reading, readingLetters(state, content));
  const nextLetter = letters.find((l) => !(state.lessonsDone[l.glyph] > 0));
  const stickers = yardCargo(state, content.words.words).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.jasmine }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 40 }}>
      <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center', gap: 16 }}>
        <View>
          <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.ink }}>Railway map</Text>
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.inkMuted }}>ரயில் வரைபடம் · tap a station</Text>
        </View>

        <LineCard id="listening" status={lines.listening}>
          <View>
            {st.map((s, i) => (
              <Pressable key={s.id} onPress={() => router.push(`/station/${s.id}`)} accessibilityRole="link" accessibilityLabel={`${s.en} station, ${s.known} of ${s.total} known`}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, opacity: pressed ? 0.6 : 1 })}>
                <View style={{ width: 32, alignItems: 'center', alignSelf: 'stretch' }}>
                  <View style={{ position: 'absolute', top: i === 0 ? 28 : 0, bottom: i === st.length - 1 ? 28 : 0, width: 6, backgroundColor: C.peacock, opacity: 0.35 }} />
                  <View style={{ marginTop: 'auto', marginBottom: 'auto', width: s.state === 'current' ? 30 : 22, height: s.state === 'current' ? 30 : 22, borderRadius: 15,
                    backgroundColor: s.state === 'done' ? C.peacock : s.state === 'current' ? C.marigold : '#FFFFFF', borderWidth: 3, borderColor: s.state === 'current' ? C.ink : C.peacock, alignItems: 'center', justifyContent: 'center' }}>
                    {s.state === 'done' && <Text style={{ color: '#FFFFFF', fontFamily: F.heavy, fontSize: 12, lineHeight: 14 }}>✓</Text>}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.heavy, fontSize: 19, color: C.ink }}>{s.ta} <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.inkMuted }}>{s.en}{s.state === 'current' ? ' · you are here' : ''}</Text></Text>
                  <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>{s.known} of {s.total} known</Text>
                </View>
                <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.inkMuted }}>›</Text>
              </Pressable>
            ))}
          </View>
        </LineCard>

        <LineCard id="letters" status={lines.letters}>
          {lines.letters.unlocked ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {letters.map((l) => {
                const s = letterStatus(state, l.glyph, content.rules.scoring);
                const taught = (state.lessonsDone[l.glyph] ?? 0) > 0;
                const open = taught || l === nextLetter;
                return (
                  <Pressable key={l.glyph} disabled={!open} onPress={() => router.push(`/lesson/${l.n}`)} accessibilityLabel={`Letter ${l.glyph}${open ? '' : ', later'}`}
                    style={{ width: 64, height: 72, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center', opacity: open ? 1 : 0.4,
                      backgroundColor: s === 'known' ? C.marigold : taught ? '#FCEBB8' : '#FFFFFF', borderWidth: l === nextLetter ? 3 : 2, borderColor: l === nextLetter ? C.ink : C.cardShadow }}>
                    <Text style={{ fontFamily: F.heavy, fontSize: 34, lineHeight: 46, color: C.ink }}>{l.glyph}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.inkSoft }}>
              Opens at {lines.letters.need} known words ({lines.letters.have} now). {letters.length} letters, hosted by Mayil, Nandu, Aamai and Kili.
            </Text>
          )}
        </LineCard>

        <LineCard id="reading" status={lines.reading}>
          {lines.reading.unlocked ? (
            <View style={{ gap: 8 }}>
              <StationRow icon="char-aamai" title="Blend words with Aamai" sub="Slide and read" onPress={() => router.push('/blend')} />
              <StationRow icon="char-kili" title="Book shelf" sub={`${books.length} book${books.length === 1 ? '' : 's'} to read`} onPress={() => router.push('/shelf')} />
            </View>
          ) : (
            <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.inkSoft }}>
              Opens after {lines.reading.need} known letters ({lines.reading.have} now). Blending, then books that use only letters he knows.
            </Text>
          )}
        </LineCard>

        <Pressable onPress={() => router.push('/yard')} accessibilityRole="link"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 14, ...drop(C.cardShadow, 4) }}>
          <Art name="char-koo" width={80} height={58} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 19, color: C.ink }}>Wagon yard</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.inkMuted }}>{stickers} sticker{stickers === 1 ? '' : 's'} collected</Text>
          </View>
          <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.inkMuted }}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StationRow({ icon, title, sub, onPress }: { icon: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, opacity: pressed ? 0.6 : 1 })}>
      <Art name={icon as never} width={56} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 18, color: C.ink }}>{title}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>{sub}</Text>
      </View>
      <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.inkMuted }}>›</Text>
    </Pressable>
  );
}

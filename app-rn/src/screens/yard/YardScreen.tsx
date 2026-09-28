import { Pressable, Text, View } from 'react-native';
import { say } from '../../audio/voice';
import { Koo, WordPicture } from '../../components/Art';
import { Body, Card, Label, Page } from '../../components/UI';
import { curriculumLetters, engineColours, tripCount, yardCargo } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';

/** Every cargo he has loaded: tap to hear it again. Trips unlock new engine colours. */
export function YardScreen() {
  const { state, update } = useApp();
  const cargo = yardCargo(state, content.words.words);
  const letters = curriculumLetters(content.curriculum).filter((l) => (state.lessonsDone[l.glyph] ?? 0) > 0);
  const colours = content.rules.yard.engineColours;
  const { unlocked, toNext } = engineColours(state, content.rules);
  const trips = tripCount(state);
  const per = content.rules.yard.tripsPerColour;
  const colour = colours[Math.min(state.engineColour, unlocked - 1)] ?? colours[0];

  return (
    <Page title="Wagon yard" back>
      <Body muted>Every cargo he has loaded. Tap one to hear its Tamil word again.</Body>
      <Card>
        <Label>WORD STICKERS · {cargo.length}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {cargo.map((w) => (
            <Pressable key={w.id} onPress={() => say(state, w.id, w.ta)} accessibilityLabel={`${w.en}. Tap to hear it`}
              style={{ width: 76, height: 76, borderRadius: R.md, backgroundColor: C.jasmine, alignItems: 'center', justifyContent: 'center' }}>
              <WordPicture word={w} size={54} />
            </Pressable>
          ))}
          {Array.from({ length: Math.max(0, 8 - cargo.length) }, (_, i) => (
            <View key={`empty-${i}`} style={{ width: 76, height: 76, borderRadius: R.md, borderWidth: 2, borderStyle: 'dashed', borderColor: C.cardShadow }} />
          ))}
        </View>
      </Card>
      {letters.length > 0 && (
        <Card>
          <Label>LETTER STICKERS · {letters.length}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {letters.map((l) => (
              <View key={l.glyph} style={{ width: 64, height: 72, borderRadius: R.sm, backgroundColor: C.marigold, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.heavy, fontSize: 34, lineHeight: 46, color: C.ink }}>{l.glyph}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
      <Card>
        <Label>KOO'S COLOURS</Label>
        <View style={{ alignItems: 'center' }}><Koo colour={colour} width={220} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          {colours.map((c, i) => (
            <Pressable key={c} disabled={i >= unlocked} onPress={() => update((s) => ({ ...s, engineColour: i }))}
              accessibilityLabel={i < unlocked ? `Colour ${i + 1}` : 'Locked colour'} accessibilityState={{ selected: colour === c, disabled: i >= unlocked }}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: i < unlocked ? c : C.cardShadow, borderWidth: colour === c ? 4 : 0, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...drop(C.cardShadow, 3) }}>
              {i >= unlocked && <Text style={{ fontSize: 16 }}>🔒</Text>}
            </Pressable>
          ))}
        </View>
        {toNext !== null && (
          <>
            <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>Next prize: a new engine colour</Text>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: C.jasmine, overflow: 'hidden' }}>
              <View style={{ width: `${((per - toNext) / per) * 100}%`, height: '100%', backgroundColor: C.peacock }} />
            </View>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.inkMuted }}>{trips % per} of {per} trips</Text>
          </>
        )}
      </Card>
    </Page>
  );
}

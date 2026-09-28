import { Redirect, router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Koo, WordPicture } from '../components/Art';
import { ChunkyButton } from '../components/Buttons';
import { dayKey, gameSecondsLeft } from '../core';
import { content } from '../generated/content';
import { useApp } from '../state/AppState';
import { C, F, R, drop } from '../theme';

const byId = new Map(content.words.words.map((w) => [w.id, w]));

/** One shared celebration screen for every session type (wireframe decision). */
export function DoneScreen() {
  const { lastResult: r, state } = useApp();
  if (!r) return <Redirect href="/" />;
  const colour = content.rules.yard.engineColours[state.engineColour] ?? content.rules.yard.engineColours[0];
  const canPlay = r.kind !== 'game' && gameSecondsLeft(state, dayKey(), content.rules) > 0;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.jasmine }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 44, color: C.ink }}>{r.title}</Text>
      <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.inkSoft, textAlign: 'center' }}>{r.subtitle}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 560 }}>
        {r.cargo.map((c) => (
          <View key={c.key} style={{ width: 76, height: 76, borderRadius: R.md, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...drop(C.cardShadow, 4) }}>
            {c.wordId && byId.has(c.wordId) ? <WordPicture word={byId.get(c.wordId)!} size={56} />
              : <Text style={{ fontFamily: c.glyph ? F.heavy : undefined, fontSize: c.glyph ? 40 : 40, color: C.ink, lineHeight: 56 }}>{c.glyph ?? c.emoji}</Text>}
          </View>
        ))}
      </View>
      <Koo colour={colour} width={180} />
      <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.inkMuted, textAlign: 'center', maxWidth: 520 }}>For grown-ups: {r.grownupLine}.</Text>
      <View style={{ gap: 10, width: '100%', maxWidth: 360 }}>
        <ChunkyButton label="See the Wagon yard" onPress={() => router.replace('/yard')} style={{ minHeight: 52 }} />
        {canPlay && <ChunkyButton label="Play a game" color={C.peacock} under={C.peacockDeep} onPress={() => router.replace('/games')} style={{ minHeight: 52 }} />}
        <ChunkyButton label="Back to the station" color="#FFFFFF" under={C.cardShadow} onPress={() => router.replace('/')} style={{ minHeight: 52 }} />
      </View>
    </ScrollView>
  );
}

import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { readingKey, say } from '../../audio/voice';
import { ChunkyButton } from '../../components/Buttons';
import { Script, SessionShell } from '../../components/Session';
import { SoundSlider } from '../../components/SoundSlider';
import { blendParts, blendScript, blendWords, readingLetters, shuffle } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';

/** Reading Line: slide Aamai under a word, one sound at a time, then read it fast. */
export function BlendScreen() {
  const { state, finishSession } = useApp();
  const words = useMemo(() => shuffle(blendWords(content.reading, readingLetters(state, content)), Math.random).slice(0, content.rules.reading.blendWordsPerLesson), []);
  const [i, setI] = useState(0);
  const [read, setRead] = useState(false);
  const [again, setAgain] = useState(0);
  const started = useRef(Date.now());
  if (!words.length) return <View style={{ flex: 1, backgroundColor: C.jasmine }} />;
  const w = words[i];
  const parts = blendParts(w.ta).map((p) => p.syllable);
  const line = blendScript(w.ta);

  const next = () => {
    if (i + 1 < words.length) { setI(i + 1); setRead(false); setAgain(0); return; }
    finishSession(
      { kind: 'blend', label: words.map((x) => x.ta).join(' '), secs: (Date.now() - started.current) / 1000 },
      { kind: 'blend', title: 'சபாஷ்!', subtitle: `He read ${words.length} words!`, cargo: words.map((x) => ({ key: x.id, emoji: x.emoji })), grownupLine: `blended ${words.map((x) => x.ta).join(', ')}` },
    );
    router.replace('/done');
  };

  return (
    <SessionShell step={i} steps={words.length} host="aamai" color={C.kumkum} onExit={() => router.back()}>
      <View style={{ marginRight: 84 }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 12, letterSpacing: 1.4, color: C.kumkumDeep }}>READING LINE · {i + 1} OF {words.length}</Text>
        <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink }}>Slide and read</Text>
      </View>
      <Script ta={`“${line.ta}”`} note={line.en} />
      <SoundSlider key={`${w.id}-${again}`} parts={parts} color={C.kumkum}
        onPart={(k) => say(state, null, parts[k])}
        onWhole={() => { setRead(true); say(state, readingKey(w.id), w.ta); }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: R.lg, backgroundColor: '#FFFFFF', ...drop(C.cardShadow, 5), opacity: read ? 1 : 0.5 }}>
        <View style={{ width: 88, height: 88, borderRadius: R.md, backgroundColor: C.jasmine, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: read ? 56 : 40 }}>{read ? w.emoji : '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 40, color: C.ink, lineHeight: 52 }}>{w.ta}</Text>
          <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.inkMuted }}>{read ? `${w.translit} · ${w.en}` : 'The picture appears once he reads it'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <ChunkyButton label="Read it again" color="#FFFFFF" under={C.cardShadow} onPress={() => { setRead(false); setAgain((a) => a + 1); }} />
        <ChunkyButton label={i + 1 < words.length ? 'Next word' : 'Finish'} color={C.kumkum} under={C.kumkumDeep} onPress={next} />
      </View>
    </SessionShell>
  );
}

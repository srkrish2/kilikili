import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { say, useCanSay } from '../../audio/voice';
import { WordPicture } from '../../components/Art';
import { ChunkyButton } from '../../components/Buttons';
import { Script } from '../../components/Session';
import type { Word } from '../../core';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';

const CHEERS = ['சபாஷ்!', 'சூப்பர்!', 'கரெக்ட்!', 'அருமை!'];

/**
 * The picture-stop pattern outside a trip (lesson warm-up, games): the grown-up says
 * the word, then the pictures unlock. `onFirstTap(correct)` fires once, for scoring.
 */
export function PictureStop({ word, options, label = 'GROWN-UP, SAY', gloss, onFirstTap, onSolved, rightText, wrongText }: {
  word: Word; options: Word[]; label?: string; gloss?: boolean;
  onFirstTap?: (correct: boolean) => void; onSolved: (firstTry: boolean) => void;
  rightText?: string; wrongText?: string;
}) {
  const { state } = useApp();
  const [said, setSaid] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const voice = useCanSay(state, word.id);
  useEffect(() => { setSaid(false); setWrong([]); setSolved(false); setCheer(null); }, [word.id]);

  const tap = (o: Word) => {
    if (!said || solved || wrong.includes(o.id)) return;
    const first = wrong.length === 0;
    if (first) onFirstTap?.(o.id === word.id);
    if (o.id === word.id) {
      setSolved(true);
      setCheer(rightText ?? CHEERS[Math.floor(Math.random() * CHEERS.length)]);
      setTimeout(() => onSolved(first), 1300);
    } else {
      setWrong((w) => [...w, o.id]);
      setCheer(wrongText ?? 'இதோ!');
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Script label={label} ta={word.ta} note={`${word.translit}${gloss ? ` · ${word.en}` : ''}`}
        action={<View style={{ gap: 8 }}>
          <ChunkyButton label={said ? 'Said ✓' : 'I said it'} disabled={said} onPress={() => setSaid(true)} />
          {voice && !said && <ChunkyButton label="▶ Play" color={C.peacock} under={C.peacockDeep} onPress={() => { say(state, word.id, word.ta); setSaid(true); }} />}
        </View>} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', opacity: said ? 1 : 0.45 }}>
        {options.map((o) => {
          const isWrong = wrong.includes(o.id);
          const hint = wrong.length > 0 && !solved && o.id === word.id;
          const right = solved && o.id === word.id;
          return (
            <Pressable key={o.id} disabled={!said} onPress={() => tap(o)} accessibilityLabel="picture"
              style={{ width: 104, height: 104, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: right ? '#DDF6E6' : '#FFFFFF',
                opacity: isWrong ? 0.35 : 1, borderWidth: hint || right ? 5 : 0, borderColor: right ? C.leaf : C.marigold, ...drop(C.cardShadow) }}>
              <WordPicture word={o} size={70} />
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontFamily: F.heavy, fontSize: 28, color: C.kumkum, textAlign: 'center', minHeight: 36 }}>{cheer ?? (said ? '' : 'Listen…')}</Text>
    </View>
  );
}

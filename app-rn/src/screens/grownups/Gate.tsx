import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gateProblem } from '../../core';
import { C, F, R, drop } from '../../theme';

/** Math word problem before the grown-ups area (App Store Kids / Play Families). */
export function Gate({ onPass }: { onPass: () => void }) {
  const insets = useSafeAreaInsets();
  const [problem, setProblem] = useState(() => gateProblem(Math.random));
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (k: string) => {
    setWrong(false);
    if (k === '⌫') return setTyped((t) => t.slice(0, -1));
    const next = (typed + k).slice(0, 2);
    setTyped(next);
    if (next.length >= String(problem.answer).length) {
      if (Number(next) === problem.answer) onPass();
      else { setWrong(true); setTyped(''); setProblem(gateProblem(Math.random)); }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.jasmine, paddingTop: insets.top + 24, alignItems: 'center', gap: 18, paddingHorizontal: 20 }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 28, color: C.ink }}>For grown-ups</Text>
      <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.inkSoft, textAlign: 'center', maxWidth: 420 }}>{problem.question}</Text>
      <View style={{ minWidth: 120, height: 64, borderRadius: R.md, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...drop(C.cardShadow, 4) }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 34, color: C.ink }} accessibilityLabel="Your answer">{typed || ' '}</Text>
      </View>
      <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.kumkumDeep, minHeight: 22 }}>{wrong ? 'Not quite. Here is another one.' : ''}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 264, gap: 12, justifyContent: 'center' }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => k ? (
          <Pressable key={k} onPress={() => press(k)} accessibilityRole="button" accessibilityLabel={k === '⌫' ? 'Delete' : k}
            style={({ pressed }) => ({ width: 80, height: 64, borderRadius: R.md, backgroundColor: pressed ? C.cardShadow : '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...drop(C.cardShadow, 3) })}>
            <Text style={{ fontFamily: F.heavy, fontSize: 26, color: C.ink }}>{k}</Text>
          </Pressable>
        ) : <View key={`gap-${i}`} style={{ width: 80, height: 64 }} />)}
      </View>
    </View>
  );
}

/** Wrap any grown-up page: shows the gate unless it was passed in the last few minutes. */
export function Gated({ open, onPass, children }: { open: boolean; onPass: () => void; children: React.ReactNode }) {
  return open ? <>{children}</> : <Gate onPass={onPass} />;
}

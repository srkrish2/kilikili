import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, drop } from '../theme';
import { Art } from './Art';
import { ChunkyButton, HoldToExit } from './Buttons';

/** Full-screen session frame: hold-to-exit, progress dots, host character, body. */
export function SessionShell({ step, steps, host, color, onExit, children }: {
  step: number; steps: number; host?: string | null; color: string; onExit: () => void; children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.jasmine, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: steps }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: i < step ? color : i === step ? C.ink : C.cardShadow }} />
          ))}
        </View>
        <HoldToExit onExit={onExit} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12, gap: 14, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
        {host ? <View style={{ position: 'absolute', right: 8, top: 4, opacity: 0.95 }} pointerEvents="none"><Art name={`char-${host}` as never} width={84} /></View> : null}
        {children}
      </View>
    </View>
  );
}

/**
 * The grown-up's one-line script. Every step has one: the app never teaches alone.
 * `ta` is what to say; `note` is how.
 */
export function Script({ label = 'GROWN-UP, SAY', ta, note, action }: { label?: string; ta: string; note?: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: R.md, padding: 14, marginRight: 84, ...drop(C.cardShadow) }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 11, letterSpacing: 1.2, color: C.kumkumDeep }}>{label}</Text>
        <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink, lineHeight: 34 }}>{ta}</Text>
        {note ? <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.inkMuted }}>{note}</Text> : null}
      </View>
      {action}
    </View>
  );
}

/** Big "we did it, next" button at the bottom of a step. */
export function NextStep({ label = 'Next', onPress, disabled }: { label?: string; onPress: () => void; disabled?: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <ChunkyButton label={label} onPress={onPress} disabled={disabled} color={C.leaf} under="#27A158" style={{ minWidth: 200, minHeight: 56 }} />
    </View>
  );
}

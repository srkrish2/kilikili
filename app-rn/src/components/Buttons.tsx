import { useRef, useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { C, F, MIN_TOUCH, R, drop } from '../theme';
import { content } from '../generated/content';

export function ChunkyButton({ label, onPress, color = C.indigo, under = C.indigoDeep, disabled, style, textColor }:
  { label: string; onPress: () => void; color?: string; under?: string; disabled?: boolean; style?: ViewStyle; textColor?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [{
        minHeight: 48, paddingHorizontal: 18, borderRadius: R.pill, justifyContent: 'center', alignItems: 'center',
        backgroundColor: disabled ? C.cardShadow : color, transform: [{ translateY: pressed ? 3 : 0 }],
        ...drop(disabled ? 'transparent' : under, pressed ? 1 : 4),
      }, style]}
    >
      <Text style={{ fontFamily: F.heavy, fontSize: 17, color: textColor ?? (color === '#FFFFFF' ? C.ink : '#FFFFFF') }}>{label}</Text>
    </Pressable>
  );
}

/** Round X that must be held (default 1s) so a tapping toddler can't end the trip. */
export function HoldToExit({ onExit }: { onExit: () => void }) {
  const [holding, setHolding] = useState(false);
  const ms = content.rules.navigation.holdToExitMs;
  const done = useRef(false);
  return (
    <Pressable
      accessibilityLabel="Hold to end trip"
      delayLongPress={ms}
      onPressIn={() => { done.current = false; setHolding(true); }}
      onPressOut={() => setHolding(false)}
      onLongPress={() => { if (!done.current) { done.current = true; onExit(); } }}
      hitSlop={10}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: holding ? C.lotus : '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...drop('rgba(35,32,74,0.15)', 3) }}
    >
      <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.ink, lineHeight: 24 }}>✕</Text>
    </Pressable>
  );
}

export const touchTarget = { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH } as const;
export function Spacer({ h = 0, w = 0 }: { h?: number; w?: number }) { return <View style={{ height: h, width: w }} />; }

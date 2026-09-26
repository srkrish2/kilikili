import { Platform, type ViewStyle } from 'react-native';
import { tokens } from './generated/tokens';

export const C = tokens.color;
export const R = tokens.radius;
export const S = tokens.space;
export const T = tokens.size;
export const MIN_TOUCH = tokens.touch.minTarget;

/** Font family names as registered in App.tsx via useFonts. */
export const F = {
  medium: 'BalooThambi2_500Medium',
  semibold: 'BalooThambi2_600SemiBold',
  bold: 'BalooThambi2_700Bold',
  heavy: 'BalooThambi2_800ExtraBold',
} as const;

/** The flat "drop" under cards and buttons (no blur, per the style rules). */
export const drop = (color: string, height: number = tokens.shadow.cardDrop) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
  borderBottomWidth: 0,
});

/** Web only: stop drags (tracing, sliding, scratching) from selecting text. */
export const NO_SELECT: ViewStyle = Platform.OS === 'web' ? ({ userSelect: 'none' } as unknown as ViewStyle) : {};

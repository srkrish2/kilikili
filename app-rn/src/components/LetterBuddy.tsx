import Svg, { Circle, Ellipse, Line, Text as SvgText } from 'react-native-svg';
import { C, F } from '../theme';

/**
 * A Tamil letter with eyes on stalks and two feet. The glyph itself is never
 * reshaped - it is real text in the app font - so what he learns is the letter.
 * Geometry matches shared/assets/letters/*.reference.svg (viewBox 180x220).
 */
export function LetterBuddy({ glyph, color, feet, size = 180 }: { glyph: string; color: string; feet: string; size?: number }) {
  return (
    <Svg width={size} height={(size * 220) / 180} viewBox="0 0 180 220">
      <Line x1={74} y1={78} x2={64} y2={42} stroke={color} strokeWidth={7} strokeLinecap="round" />
      <Line x1={106} y1={78} x2={116} y2={42} stroke={color} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={64} cy={36} r={15} fill="#FFFFFF" />
      <Circle cx={116} cy={36} r={15} fill="#FFFFFF" />
      <Circle cx={67} cy={38} r={7} fill={C.ink} />
      <Circle cx={113} cy={38} r={7} fill={C.ink} />
      <Circle cx={69} cy={35.5} r={2.2} fill="#FFFFFF" />
      <Circle cx={115} cy={35.5} r={2.2} fill="#FFFFFF" />
      <SvgText x={90} y={184} textAnchor="middle" fontFamily={F.heavy} fontSize={140} fill={color}>{glyph}</SvgText>
      <Ellipse cx={66} cy={208} rx={16} ry={7} fill={feet} />
      <Ellipse cx={114} cy={208} rx={16} ry={7} fill={feet} />
    </Svg>
  );
}

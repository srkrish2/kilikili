import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { scoreTrace, type LetterStrokes, type Pt, type TraceResult } from '../core';
import { content } from '../generated/content';
import { C, F, R, drop } from '../theme';

const PAD_RATIO = 0.12;
const DEMO_SPEED = 900; // font units per second
const DEMO_PAUSE_MS = 350;

function polylineLength(p: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return len;
}

/** The first `upTo` units of a polyline, and where the pen is. */
function partial(p: [number, number][], upTo: number): { pts: [number, number][]; head: [number, number] } {
  if (p.length < 2) return { pts: p, head: p[0] };
  const pts: [number, number][] = [p[0]];
  let left = upTo;
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (left >= seg) { pts.push(p[i]); left -= seg; continue; }
    const t = left / seg;
    const head: [number, number] = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t];
    pts.push(head);
    return { pts, head };
  }
  return { pts, head: p[p.length - 1] };
}

const toPoints = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(' ');

/**
 * Letter tracing. First an animated pen shows the stroke order (from shared stroke
 * data, which follows the real glyph), with numbered start dots. Then the child traces
 * with a finger; the trace is scored geometrically (core/letters.ts: scoreTrace).
 * `demoKey` replays the demo when it changes.
 */
export function Tracer({ glyph, size, demoKey, onResult }: {
  glyph: LetterStrokes; size: number; demoKey: number; onResult: (r: TraceResult) => void;
}) {
  const { box, strokes, penWidth } = glyph;
  const pad = Math.max(box.w, box.h) * PAD_RATIO;
  const vbW = box.w + 2 * pad;
  const vbH = box.h + 2 * pad;
  const scale = Math.min(size / vbW, size / vbH);
  const width = vbW * scale;
  const height = vbH * scale;

  const [demo, setDemo] = useState<{ stroke: number; len: number } | null>(null);
  const [ink, setInk] = useState<Pt[][]>([]);
  const [passed, setPassed] = useState(false);
  const drawing = useRef<Pt[] | null>(null);
  const raf = useRef<number | null>(null);

  // Demo animation: one stroke after another, with a short pause between.
  useEffect(() => {
    setInk([]);
    setPassed(false);
    let stroke = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      start ??= t;
      const s = strokes[stroke] as [number, number][];
      const len = ((t - start) / 1000) * DEMO_SPEED;
      const total = polylineLength(s);
      setDemo({ stroke, len });
      if (len >= total + (DEMO_PAUSE_MS / 1000) * DEMO_SPEED) {
        stroke++;
        start = t;
        if (stroke >= strokes.length) { setDemo({ stroke: strokes.length, len: 0 }); raf.current = null; return; }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [demoKey, strokes]);

  const stopDemo = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setDemo(null);
  };

  const toFont = (e: GestureResponderEvent): Pt => [e.nativeEvent.locationX / scale - pad, e.nativeEvent.locationY / scale - pad];

  const finish = useCallback(() => {
    if (!drawing.current) return;
    const done = [...ink, drawing.current];
    drawing.current = null;
    const r = scoreTrace(glyph, done, content.rules.letters);
    if (r.passed) setPassed(true);
    onResult(r);
  }, [ink, glyph, onResult]);

  const demoDone = demo && demo.stroke >= strokes.length;
  const penR = penWidth * 0.3;

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{ width, height, borderRadius: R.lg, backgroundColor: '#FFFFFF', ...drop(passed ? C.leaf : C.cardShadow, 6), borderWidth: passed ? 4 : 0, borderColor: C.leaf }}
        onStartShouldSetResponder={() => !passed}
        onMoveShouldSetResponder={() => !passed}
        // Keep the finger even when a parent ScrollView wants to scroll.
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => { stopDemo(); drawing.current = [toFont(e)]; setInk((k) => [...k]); }}
        onResponderMove={(e) => { if (drawing.current) { drawing.current.push(toFont(e)); setInk((k) => [...k]); } }}
        onResponderRelease={() => { const cur = drawing.current; finish(); if (cur) setInk((k) => [...k, cur]); }}
        onResponderTerminate={() => { const cur = drawing.current; finish(); if (cur) setInk((k) => [...k, cur]); }}
        accessibilityLabel={`Trace the letter ${glyph.glyph}`}
      >
        <Svg width={width} height={height} viewBox={`${-pad} ${-pad} ${vbW} ${vbH}`} pointerEvents="none">
          <Path d={glyph.outline} fill="#EFE6D6" />
          <Path d={glyph.outline} fill="none" stroke="#C9BCA6" strokeWidth={penWidth * 0.04} strokeDasharray={`${penWidth * 0.12} ${penWidth * 0.16}`} />
          {/* Demo pen */}
          {demo && (
            <G>
              {strokes.slice(0, Math.min(demo.stroke, strokes.length)).map((s, i) => (s.length > 1
                ? <Polyline key={i} points={toPoints(s as [number, number][])} fill="none" stroke={C.mango} strokeOpacity={demoDone ? 0.5 : 0.85} strokeWidth={penWidth * 0.55} strokeLinecap="round" strokeLinejoin="round" />
                : <Circle key={i} cx={s[0][0]} cy={s[0][1]} r={penR} fill={C.mango} />))}
              {!demoDone && (() => {
                const s = strokes[demo.stroke] as [number, number][];
                const { pts, head } = partial(s, demo.len);
                return (
                  <G>
                    {s.length > 1 && <Polyline points={toPoints(pts)} fill="none" stroke={C.mango} strokeOpacity={0.85} strokeWidth={penWidth * 0.55} strokeLinecap="round" strokeLinejoin="round" />}
                    <Circle cx={head[0]} cy={head[1]} r={penR} fill="#FFFFFF" stroke={C.mango} strokeWidth={penWidth * 0.1} />
                  </G>
                );
              })()}
            </G>
          )}
          {/* Numbered start dots */}
          {strokes.map((s, i) => (
            <G key={`start-${i}`}>
              <Circle cx={s[0][0]} cy={s[0][1]} r={penR} fill={C.leaf} />
              <SvgText x={s[0][0]} y={s[0][1] + penR * 0.4} textAnchor="middle" fontSize={penR * 1.2} fontWeight="bold" fill="#FFFFFF">{i + 1}</SvgText>
            </G>
          ))}
          {/* The child's ink */}
          {[...ink, ...(drawing.current ? [drawing.current] : [])].map((s, i) => (
            <Polyline key={`ink-${i}`} points={s.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={C.indigo} strokeOpacity={0.8} strokeWidth={penWidth * 0.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
      </View>
      {passed && <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.leaf, marginTop: 8 }}>அருமை!</Text>}
    </View>
  );
}

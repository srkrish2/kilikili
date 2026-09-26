import { useRef, useState } from 'react';
import { Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { C, F, R, drop } from '../theme';
import { Art } from './Art';

const KNOB = 64;

/**
 * Aamai's slider: the child drags Aamai under the word, left to right. The piece
 * above the finger lights up and is sounded while the rest fades, so attention stays
 * on one sound at a time; sliding off the end blends them into the whole word.
 */
export function SoundSlider({ parts, onPart, onWhole, color = C.peacock }: {
  parts: string[];
  onPart: (i: number) => void;
  onWhole: () => void;
  color?: string;
}) {
  const spans = useRef<{ x: number; w: number }[]>([]);
  const rowRef = useRef<View>(null);
  const rowX = useRef(0);
  const [width, setWidth] = useState(0);
  const [x, setX] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const visited = useRef(new Set<number>());

  const layoutPart = (i: number) => (e: LayoutChangeEvent) => {
    spans.current[i] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
    const last = spans.current[parts.length - 1];
    if (last) setWidth(last.x + last.w);
  };

  const move = (e: GestureResponderEvent) => {
    // locationX is relative to the touched view; use page coordinates against the row.
    const px = Math.max(0, Math.min(width, e.nativeEvent.pageX - rowX.current));
    setX(px);
    const i = spans.current.findIndex((s) => s && px >= s.x && px < s.x + s.w);
    if (i !== -1 && i !== active) {
      setActive(i);
      visited.current.add(i);
      onPart(i);
    }
    if (px >= width - 2 && visited.current.size === parts.length && !done) {
      setDone(true);
      setActive(null);
      onWhole();
    }
  };

  const state = (i: number) => (done ? 'lit' : active === null ? '' : i === active ? 'focus' : 'dim');

  return (
    <View
      style={{ alignItems: 'center', paddingVertical: 8, gap: 10 }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        setDragging(true); visited.current = new Set(); setActive(null); setDone(false);
        // Touch x is in window coordinates; find where the word row starts in the window.
        const pageX = e.nativeEvent.pageX;
        rowRef.current?.measureInWindow((x) => { rowX.current = x; move({ nativeEvent: { pageX } } as GestureResponderEvent); });
      }}
      onResponderMove={move}
      onResponderRelease={() => { setDragging(false); if (!done) { setX(0); setActive(null); } }}
      onResponderTerminate={() => { setDragging(false); setX(0); setActive(null); }}
      accessibilityLabel="Slide Aamai under the word"
    >
      <View ref={rowRef} style={{ flexDirection: 'row' }}>
        {parts.map((p, i) => {
          const s = state(i);
          return (
            <View key={i} onLayout={layoutPart(i)} style={{ paddingHorizontal: 4, borderRadius: R.sm, backgroundColor: s === 'focus' ? '#FFFFFF' : 'transparent', ...(s === 'focus' ? drop(C.cardShadow, 3) : {}), transform: [{ scale: s === 'focus' ? 1.15 : 1 }] }}>
              <Text style={{ fontFamily: F.heavy, fontSize: 64, lineHeight: 84, color: s === 'focus' || s === 'lit' ? color : C.ink, opacity: s === 'dim' ? 0.2 : 1 }}>{p}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ width: Math.max(width, 120), height: 14, borderRadius: 7, backgroundColor: C.cardShadow }}>
        <View style={{ width: x, height: 14, borderRadius: 7, backgroundColor: color, opacity: 0.6 }} />
        <View style={{ position: 'absolute', left: x - KNOB / 2, top: 7 - KNOB / 2, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: color, opacity: dragging || done ? 1 : 0.95 }} pointerEvents="none">
          <Art name="char-aamai" width={48} />
        </View>
      </View>
      <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.inkMuted, marginTop: 20 }}>{done ? '' : 'Slide Aamai along →'}</Text>
    </View>
  );
}

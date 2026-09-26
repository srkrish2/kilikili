import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Art, WordPicture } from '../components/Art';
import { ChunkyButton, HoldToExit } from '../components/Buttons';
import { advance, grownUpSaid, reportAction, skipStop, startTrip, tapPicture, type TripDeps, type TripState } from '../core';
import { content } from '../generated/content';
import { useApp } from '../state/AppState';
import { C, F, R, drop } from '../theme';

const CHEERS = ['சபாஷ்!', 'சூப்பர்!', 'கரெக்ட்!', 'அருமை!'];

export function TripScreen() {
  const { state, getProgress, saveProgress, finishSession } = useApp();
  const onExit = () => router.back();
  const onDone = (trip: TripState) => {
    const { stats } = trip;
    let line = `${stats.firstTry} of ${stats.pictureStops} picture stops right on the first tap`;
    if (stats.actionStops) line += `; ${stats.didAction} of ${stats.actionStops} actions without a demo`;
    finishSession(
      { kind: 'trip', right: stats.firstTry + stats.didAction, of: stats.pictureStops + stats.actionStops },
      { kind: 'trip', title: 'சூப்பர்!', subtitle: "Koo's wagons are full.", cargo: trip.cargo.map((id, i) => ({ key: `${id}-${i}`, wordId: id })), grownupLine: line },
    );
    router.replace('/done');
  };
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const deps: TripDeps = useMemo(
    () => ({ words: content.words.words, rules: content.rules, rng: Math.random, getProgress, saveProgress }),
    [getProgress, saveProgress],
  );
  const [trip, setTrip] = useState<TripState>(() => startTrip(state.settings, deps));
  const [cheer, setCheer] = useState<string | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (trip.finished && !finished.current) { finished.current = true; onDone(trip); }
  }, [trip, onDone]);

  // Auto-advance after a solved stop, so the grown-up never has to find a "next" button.
  useEffect(() => {
    if (trip.stop?.phase !== 'solved') return;
    const ms = trip.stop.kind === 'action' ? content.rules.trip.actionAdvanceDelayMs : content.rules.trip.advanceDelayMs;
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    const id = setTimeout(() => { setCheer(null); setTrip((t) => advance(t, deps)); }, ms);
    return () => clearTimeout(id);
  }, [trip.stop?.phase, trip.stop?.index, deps]);

  const stop = trip.stop;
  if (!stop) return <View style={{ flex: 1, backgroundColor: C.jasmine }} />;
  const cat = content.words.categories.find((c) => c.id === stop.word.category)!;
  const cols = stop.options.length === 3 && width >= 560 ? 3 : 2;
  const cardW = (Math.min(width, 700) - 32 - 14 * (cols - 1)) / cols;
  const locked = stop.phase === 'waitingForGrownUp';

  return (
    <View style={{ flex: 1, backgroundColor: C.jasmine }}>
      {/* Station scene */}
      <View style={{ height: 300 + insets.top, backgroundColor: C.skyPale, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
          <Art name="scene-station" width={Math.max(width, 390)} height={300 * Math.max(width, 390) / 390} />
        </View>
        <View style={{ position: 'absolute', left: 18, top: insets.top + 72, paddingHorizontal: 16, height: 54, borderRadius: 14, backgroundColor: C.marigold, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 26, color: C.ink }}>{cat.ta}</Text>
        </View>
        <View style={{ position: 'absolute', right: 10, bottom: 10 }}><Art name="char-koo" width={158} height={115} /></View>
        <View style={{ position: 'absolute', right: 16, top: insets.top + 12 }}><HoldToExit onExit={onExit} /></View>
        {cheer && (
          <View style={{ position: 'absolute', alignSelf: 'center', top: insets.top + 150, backgroundColor: '#FFFFFF', borderRadius: R.md, paddingHorizontal: 20, paddingVertical: 8, ...drop(C.cardShadow, 4) }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.kumkum }}>{cheer}</Text>
          </View>
        )}
      </View>

      {/* Ticket: what the grown-up says */}
      <View style={{ marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: R.md, padding: 14, ...drop(C.cardShadow) }}>
        <View style={{ alignItems: 'center', paddingRight: 12, borderRightWidth: 2, borderStyle: 'dashed', borderColor: C.cardShadow }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 11, letterSpacing: 1.5, color: C.inkMuted }}>STOP</Text>
          <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.ink, lineHeight: 34 }}>{stop.index + 1}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.inkMuted }}>of {trip.settings.length}</Text>
        </View>
        <Pressable style={{ flex: 1 }} onLongPress={() => setTrip((t) => skipStop(t, deps))} accessibilityHint="Long-press to swap this word">
          <Text style={{ fontFamily: F.heavy, fontSize: 11, letterSpacing: 1.2, color: C.kumkumDeep }}>
            {stop.kind === 'action' ? 'GROWN-UP, SAY IT (NO ACTING IT OUT!)' : 'GROWN-UP, SAY'}
          </Text>
          <Text style={{ fontFamily: F.heavy, fontSize: 32, color: C.ink, lineHeight: 44 }}>{stop.word.ta}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.inkMuted }}>
            {stop.word.translit}{trip.settings.showGloss ? ` · ${stop.word.en}` : ''}
          </Text>
        </Pressable>
        <ChunkyButton label={locked ? 'I said it' : 'Said ✓'} disabled={!locked} onPress={() => setTrip(grownUpSaid)} />
      </View>

      {/* Answers */}
      {stop.kind === 'picture' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, padding: 16, justifyContent: 'center', opacity: locked ? 0.45 : 1 }}>
          {stop.options.map((o) => {
            const wrong = stop.wrongIds.includes(o.id);
            const hint = stop.attempted && o.id === stop.word.id && stop.phase !== 'solved';
            const right = stop.phase === 'solved' && o.id === stop.word.id;
            return (
              <Pressable key={o.id} disabled={locked} accessibilityLabel="picture"
                onPress={() => setTrip((t) => tapPicture(t, o.id, deps))}
                style={{ width: cardW, height: Math.min(170, cardW * 0.85), borderRadius: R.lg, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: right ? '#DDF6E6' : '#FFFFFF', opacity: wrong ? 0.35 : 1,
                  borderWidth: hint || right ? 5 : 0, borderColor: right ? C.leaf : C.marigold, ...drop(C.cardShadow) }}>
                <WordPicture word={o} size={Math.min(110, cardW * 0.6)} />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ margin: 16, padding: 20, borderRadius: R.lg, backgroundColor: '#FFFFFF', alignItems: 'center', gap: 14, ...drop(C.cardShadow) }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.ink }}>
            {stop.phase === 'solved' ? (stop.outcome === 'didAction' ? 'You did it!' : 'Now you try!') : 'Listen and do it!'}
          </Text>
          {stop.phase === 'choosing' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ChunkyButton label="He did it" color={C.leaf} under="#27A158" onPress={() => setTrip((t) => reportAction(t, true, deps))} />
              <ChunkyButton label="Needed help" color={C.mango} under="#D9691E" onPress={() => setTrip((t) => reportAction(t, false, deps))} />
            </View>
          )}
        </View>
      )}

      {/* Anil peeks in */}
      <View style={{ position: 'absolute', left: 6, bottom: insets.bottom - 30, flexDirection: 'row', alignItems: 'center' }} pointerEvents="none">
        <Art name="char-anil" width={124} />
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6, ...drop(C.cardShadow, 3) }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 17, color: C.ink }}>
            {locked ? 'Listen…' : stop.attempted && stop.phase !== 'solved' ? 'Say it again!' : 'Tap the picture!'}
          </Text>
        </View>
      </View>
    </View>
  );
}

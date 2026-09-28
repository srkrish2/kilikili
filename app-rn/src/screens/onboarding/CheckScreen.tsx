import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SessionShell } from '../../components/Session';
import { advance, grownUpSaid, startTrip, tapPicture, type TripDeps, type TripState } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F } from '../../theme';
import { PictureStop } from '../lesson/PictureStop';

/**
 * The first trip: ten words, four pictures, no action stops. Answers seed the first
 * word map; no score is shown to him. Taps go through the trip engine, so scoring is
 * exactly a trip's (first tap only, corrected for guessing).
 */
export function CheckScreen() {
  const { getProgress, saveProgress, finishSession } = useApp();
  const { checkWords, checkChoices } = content.rules.onboarding;
  const deps: TripDeps = useMemo(() => ({ words: content.words.words, rules: content.rules, rng: Math.random, getProgress, saveProgress }), [getProgress, saveProgress]);
  const [trip, setTrip] = useState<TripState>(() => startTrip({ length: checkWords, choices: checkChoices, actionStops: false, showGloss: false }, deps));
  const tripRef = useRef(trip);
  tripRef.current = trip;
  const started = useRef(Date.now());

  const leave = () => router.replace('/setup/voices');
  const apply = (fn: (t: TripState) => TripState) => { const next = fn(tripRef.current); tripRef.current = next; setTrip(next); return next; };

  const stop = trip.stop;
  if (!stop) return null;
  return (
    <SessionShell step={trip.stopIndex} steps={checkWords} host="anil" color={C.peacock} onExit={leave}>
      <View style={{ marginRight: 84 }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink }}>Quick listening check</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.inkMuted }}>Word {trip.stopIndex + 1} of {checkWords} · sit together for this one</Text>
      </View>
      <PictureStop key={`${stop.index}-${stop.word.id}`} word={stop.word} options={stop.options}
        onFirstTap={(correct) => {
          const tapped = correct ? stop.word.id : stop.options.find((o) => o.id !== stop.word.id)!.id;
          apply((t) => tapPicture(grownUpSaid(t), tapped, deps));
        }}
        onSolved={() => {
          const t = apply((x) => advance(tapPicture(x, stop.word.id, deps), deps));
          if (t.finished) {
            finishSession({ kind: 'trip', label: 'check', right: t.stats.firstTry, of: t.stats.pictureStops, secs: (Date.now() - started.current) / 1000 },
              { kind: 'trip', title: 'சூப்பர்!', subtitle: 'First trip done.', cargo: t.cargo.map((id, i) => ({ key: `${id}-${i}`, wordId: id })), grownupLine: `${t.stats.firstTry} of ${t.stats.pictureStops} right on the first tap` });
            leave();
          }
        }} />
      <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted, textAlign: 'center' }}>No score is shown to him. Answers fill in his first word map.</Text>
      <Pressable onPress={leave} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.indigo }}>Skip the check</Text>
      </Pressable>
    </SessionShell>
  );
}

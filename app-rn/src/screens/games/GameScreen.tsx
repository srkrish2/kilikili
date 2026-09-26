import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { letterKey, say, sayAll, useCanSay } from '../../audio/voice';
import { Art } from '../../components/Art';
import { ChunkyButton } from '../../components/Buttons';
import { NextStep, Script, SessionShell } from '../../components/Session';
import { Tracer } from '../../components/Tracer';
import { cricketBalls, curriculumLetters, shuffle, songActions, taughtLetters, trainYardRounds } from '../../core';
import { content } from '../../generated/content';
import { strokes } from '../../generated/strokes';
import { useApp, type SessionResult } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';
import { PictureStop } from '../lesson/PictureStop';
import { useGameClock } from './useGameClock';

export function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (id === 'cricket') return <Cricket />;
  if (id === 'song') return <SongTime />;
  if (id === 'trainyard') return <TrainYard />;
  if (id === 'kolam') return <Kolam />;
  return <Redirect href="/games" />;
}

function useFinish(id: string) {
  const { finishSession } = useApp();
  const elapsed = useGameClock();
  return (result: Omit<SessionResult, 'kind'>, right?: number, of?: number) => {
    finishSession({ kind: 'game', label: id, right, of, secs: elapsed() }, { kind: 'game', ...result });
    router.replace('/done');
  };
}

/** Cricket Words: the grown-up bowls a word; the right picture is a six, a miss is a dot ball (never out). */
function Cricket() {
  const { state } = useApp();
  const finish = useFinish('cricket');
  const balls = useMemo(() => cricketBalls(content.words.words, state, content.rules, Math.random), []);
  const [i, setI] = useState(0);
  const [runs, setRuns] = useState(0);
  const sixes = useRef(0);
  // The finish callback fires from a timer set at tap time, so read the score from a ref.
  const runsRef = useRef(0);
  if (!balls.length) return <Redirect href="/games" />;
  const per = content.rules.games.overBalls;
  const ball = balls[i];
  return (
    <SessionShell step={Math.floor(i / per)} steps={content.rules.games.overs} host="anil" color={C.peacock} onExit={() => router.back()}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 84 }}>
        <Text numberOfLines={1} style={{ fontFamily: F.heavy, fontSize: 22, color: C.ink, flex: 1 }}>Cricket Words</Text>
        <View style={{ backgroundColor: C.ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2 }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 15, color: '#FFFFFF' }}>Runs {runs} · Over {Math.floor(i / per)}.{i % per}</Text>
        </View>
      </View>
      <View style={{ height: 90, borderRadius: R.lg, backgroundColor: C.grass, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        <Text style={{ fontSize: 44 }}>🏏</Text>
        <View style={{ width: 120, height: 26, borderRadius: 13, backgroundColor: '#E8D9A8' }} />
        <Text style={{ fontSize: 40 }}>🏃</Text>
      </View>
      <PictureStop key={i} word={ball.word} options={ball.options} label="GROWN-UP, BOWL THIS WORD" gloss={state.settings.showGloss}
        rightText="SIX! 🏏" wrongText="Dot ball. Bowl it again!"
        onFirstTap={(ok) => { if (ok) { sixes.current += 1; runsRef.current += 6; setRuns(runsRef.current); } }}
        onSolved={() => {
          if (i + 1 < balls.length) return setI(i + 1);
          finish({ title: 'சூப்பர்!', subtitle: `${runsRef.current} runs! What a match.`, cargo: balls.filter((b, k) => balls.findIndex((x) => x.word.id === b.word.id) === k).map((b) => ({ key: b.word.id, wordId: b.word.id })),
            grownupLine: `${sixes.current} sixes from ${balls.length} balls (games don't change his word scores)` }, sixes.current, balls.length);
        }} />
    </SessionShell>
  );
}

/** Song Time: Kili sings action words; he does each one. */
function SongTime() {
  const { state } = useApp();
  const finish = useFinish('song');
  const actions = useMemo(() => songActions(content.words.words, Math.random), []);
  const [i, setI] = useState(0);
  const voice = useCanSay(state, actions[i]?.id ?? null);
  const a = actions[i];
  const line = `${a.ta.replace('!', '')}, ${a.ta.replace('!', '')}, ${a.ta}`;
  return (
    <SessionShell step={i} steps={actions.length} host="kili" color={C.marigold} onExit={() => router.back()}>
      <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink, marginRight: 84 }}>Song Time</Text>
      <Script label="GROWN-UP, SING (CLAP THE BEAT)" ta={`“${line}”`} note={`${a.translit} · ${a.en}. Sing it, then do it together.`}
        action={voice ? <ChunkyButton label="▶ Sing" color={C.peacock} under={C.peacockDeep} onPress={() => sayAll(state, [{ key: a.id, text: a.ta }, { key: a.id, text: a.ta }, { key: a.id, text: a.ta }], 350)} /> : undefined} />
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
        <Art name="char-kili" width={150} />
        <Text style={{ fontSize: 64 }}>{a.emoji}</Text>
      </View>
      <NextStep label={i + 1 < actions.length ? 'He did it! Next verse' : 'Finish the song'} onPress={() => {
        if (i + 1 < actions.length) return setI(i + 1);
        finish({ title: 'சூப்பர்!', subtitle: 'What a song!', cargo: actions.map((x) => ({ key: x.id, wordId: x.id })), grownupLine: `sang ${actions.map((x) => x.en).join(', ')}` });
      }} />
    </SessionShell>
  );
}

/** Train Yard: sort each arriving letter into the wagon with the same letter. */
function TrainYard() {
  const { state } = useApp();
  const finish = useFinish('trainyard');
  const letters = curriculumLetters(content.curriculum);
  const taught = taughtLetters(state, letters).map((l) => l.glyph);
  const rounds = useMemo(() => trainYardRounds(taught, content.rules.games.trainYardRounds, Math.random), []);
  const [r, setR] = useState(0);
  const [k, setK] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, number>>({});
  const [shake, setShake] = useState<string | null>(null);
  const firstTry = useRef({ right: 0, of: 0 });
  const missed = useRef(false);
  if (!rounds.length) return <Redirect href="/games" />;
  const round = rounds[r];
  const letter = round.letters[k];
  const info = letters.find((l) => l.glyph === letter)!;

  const pick = (wagon: string) => {
    if (wagon !== letter) { setShake(wagon); missed.current = true; setTimeout(() => setShake(null), 400); return; }
    firstTry.current.of += 1;
    if (!missed.current) firstTry.current.right += 1;
    missed.current = false;
    setLoaded((l) => ({ ...l, [`${r}-${wagon}`]: (l[`${r}-${wagon}`] ?? 0) + 1 }));
    say(state, letterKey(info.n), letter);
    if (k + 1 < round.letters.length) return setK(k + 1);
    if (r + 1 < rounds.length) { setR(r + 1); setK(0); return; }
    finish({ title: 'சபாஷ்!', subtitle: 'Every letter is on its train.', cargo: [...new Set(rounds.flatMap((x) => x.wagons))].map((g) => ({ key: g, glyph: g })),
      grownupLine: `${firstTry.current.right} of ${firstTry.current.of} letters sorted on the first try` }, firstTry.current.right, firstTry.current.of);
  };

  return (
    <SessionShell step={r} steps={rounds.length} host="koo" color={C.kumkum} onExit={() => router.back()}>
      <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink, marginRight: 84 }}>Train Yard</Text>
      <Script label="GROWN-UP, SAY EACH LETTER AS IT ARRIVES" ta={`“${letter}!”`} note={`“${info.sound}”. Which wagon does it go in?`} />
      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <View style={{ width: 110, height: 120, borderRadius: R.lg, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...drop(C.cardShadow, 5) }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 70, lineHeight: 92, color: C.ink }}>{letter}</Text>
        </View>
        <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.inkMuted, marginTop: 6 }}>{round.letters.length - k} left on the platform</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
        {round.wagons.map((w) => (
          <Pressable key={w} onPress={() => pick(w)} accessibilityLabel={`Wagon ${w}`}
            style={{ width: 140, height: 120, borderRadius: R.md, backgroundColor: shake === w ? C.lotus : C.peacock, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: shake === w ? 6 : 0 }], ...drop(C.peacockDeep, 6) }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 56, lineHeight: 72, color: '#FFFFFF' }}>{w}</Text>
            <Text style={{ fontFamily: F.bold, fontSize: 13, color: '#FFFFFF' }}>{'●'.repeat(loaded[`${r}-${w}`] ?? 0) || ' '}</Text>
          </Pressable>
        ))}
      </View>
    </SessionShell>
  );
}

/** Kolam Trace: trace taught letters from the numbered dots, no pen demo. */
function Kolam() {
  const { width, height } = useWindowDimensions();
  const { state } = useApp();
  const finish = useFinish('kolam');
  const picks = useMemo(() => shuffle(taughtLetters(state, curriculumLetters(content.curriculum)), Math.random).slice(0, content.rules.games.kolamLetters), []);
  const [i, setI] = useState(0);
  const [passed, setPassed] = useState(false);
  const [tries, setTries] = useState(0);
  const [demo, setDemo] = useState(0);
  if (!picks.length) return <Redirect href="/games" />;
  const l = picks[i];
  const size = Math.min(width - 48, height - 360, 360);
  const next = () => {
    if (i + 1 < picks.length) { setI(i + 1); setPassed(false); setTries(0); setDemo(0); return; }
    finish({ title: 'அருமை!', subtitle: 'Beautiful kolam letters!', cargo: picks.map((x) => ({ key: x.glyph, glyph: x.glyph })), grownupLine: `traced ${picks.map((x) => x.glyph).join(' ')}` });
  };
  return (
    <SessionShell step={i} steps={picks.length} host="mayil" color={C.marigold} onExit={() => router.back()}>
      <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink, marginRight: 84 }}>Kolam Trace</Text>
      <Script label="GROWN-UP, SAY" ta={`“${l.glyph} வரை!”`} note="Draw it! Start at the green 1, like drawing a kolam." />
      <Tracer key={`${l.glyph}-${demo}`} glyph={strokes[l.glyph]} size={size} demoKey={demo} autoDemo={demo > 0}
        onResult={(r) => { setTries((t) => t + 1); if (r.passed) setPassed(true); }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        <ChunkyButton label="👀 Show me" color="#FFFFFF" under={C.cardShadow} onPress={() => { setPassed(false); setDemo((d) => d + 1); }} />
        <ChunkyButton label="Next" disabled={!passed && tries < content.rules.letters.traceAttemptsBeforeSkip} color={C.leaf} under="#27A158" onPress={next} />
      </View>
    </SessionShell>
  );
}

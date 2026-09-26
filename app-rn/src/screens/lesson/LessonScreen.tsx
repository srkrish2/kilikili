import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { letterKey, say, sayAll, stopVoice, useCanSay } from '../../audio/voice';
import { Art } from '../../components/Art';
import { ChunkyButton } from '../../components/Buttons';
import { LetterBuddy } from '../../components/LetterBuddy';
import { NextStep, Script, SessionShell } from '../../components/Session';
import { SoundSlider } from '../../components/SoundSlider';
import { Tracer } from '../../components/Tracer';
import {
  blendParts, blendScript, curriculumLetters, dayKey, distractors, findRounds, findScript, graphemes, initialProgress,
  meetScript, pickWord, record, recordLetter, shuffle, songLines, type CurriculumLetter, type LessonStepId, type Word,
} from '../../core';
import { content } from '../../generated/content';
import { strokes } from '../../generated/strokes';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';
import { PictureStop } from './PictureStop';

const LINE = content.curriculum.lines.find((l) => l.id === 'letters')!;
const STEPS = LINE.lessonSteps as LessonStepId[];
const HOSTS = LINE.stepHosts ?? {};
const STEP_NAME: Record<LessonStepId, string> = {
  warmup: 'Warm-up', meet: 'Meet', soundStory: 'Sound story', trace: 'Trace', find: 'Find it', saySlowly: 'Say it slowly', song: 'Song', rideHome: 'Ride home',
};
const COLOR = C.marigold;

/** The 8-step Letters Line lesson (curriculum.json lessonSteps), one letter per lesson. */
export function LessonScreen() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const letter = curriculumLetters(content.curriculum).find((l) => String(l.n) === n);
  if (!letter) return <Redirect href="/" />;
  return <Lesson key={letter.glyph} letter={letter} />;
}

function Lesson({ letter }: { letter: CurriculumLetter }) {
  const { state, update, finishSession } = useApp();
  const [step, setStep] = useState(0);
  const [found, setFound] = useState({ right: 0, of: 0 });
  const started = useRef(Date.now());
  const id = STEPS[step];
  useEffect(() => stopVoice, [step]);

  const next = () => setStep((s) => s + 1);
  const exit = () => router.back();
  const finish = () => {
    update((s) => ({ ...s, lessonsDone: { ...s.lessonsDone, [letter.glyph]: (s.lessonsDone[letter.glyph] ?? 0) + 1 } }));
    finishSession(
      { kind: 'lesson', label: letter.glyph, right: found.right, of: found.of, secs: (Date.now() - started.current) / 1000 },
      {
        kind: 'lesson', title: 'சபாஷ்!', subtitle: `${letter.glyph} rides home with Koo.`,
        cargo: [{ key: letter.glyph, glyph: letter.glyph }, ...letter.soundWords.map((w) => ({ key: w.ta, emoji: w.emoji }))],
        grownupLine: `${found.right} of ${found.of} “find it” rounds right on the first tap`,
      },
    );
    router.replace('/done');
  };

  const host = HOSTS[id] === 'letterBuddy' ? null : HOSTS[id];
  return (
    <SessionShell step={step} steps={STEPS.length} host={host} color={COLOR} onExit={exit}>
      <View style={{ marginRight: 84 }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 12, letterSpacing: 1.4, color: '#9A6B00' }}>LETTERS LINE · LESSON {letter.n} · {STEP_NAME[id].toUpperCase()}</Text>
        <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink }}>Meet {letter.glyph}</Text>
      </View>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
        {id === 'warmup' && <Warmup onDone={next} />}
        {id === 'meet' && <Meet letter={letter} onDone={next} />}
        {id === 'soundStory' && <SoundStory letter={letter} onDone={next} />}
        {id === 'trace' && <Trace letter={letter} onDone={next} />}
        {id === 'find' && <Find letter={letter} onDone={(right, of) => { setFound({ right, of }); next(); }} />}
        {id === 'saySlowly' && <SaySlowly letter={letter} onDone={next} />}
        {id === 'song' && <Song letter={letter} onDone={next} />}
        {id === 'rideHome' && <RideHome letter={letter} onDone={finish} />}
      </ScrollView>
    </SessionShell>
  );
}

/** Anil's warm-up: two picture stops with words he probably knows, so the lesson opens with a win. */
function Warmup({ onDone }: { onDone: () => void }) {
  const { state, getProgress, saveProgress } = useApp();
  const { rules } = content;
  const stops = useMemo(() => {
    const words = content.words.words;
    const used = new Set<string>();
    return [0, 1].map((i) => {
      const w = pickWord({ words, progress: state.progress, used, stopIndex: i, today: dayKey(), scoring: rules.scoring, picker: rules.picker, rng: Math.random }, 'picture')!;
      used.add(w.id);
      return { word: w, options: shuffle([w, ...distractors(w, words, 2, Math.random)], Math.random) };
    });
    // Picked once per lesson.
  }, []);
  const [i, setI] = useState(0);
  const s = stops[i];
  const score = (w: Word, correct: boolean) => {
    const cur = getProgress()[w.id] ?? initialProgress(w.homeFrequency, rules.scoring);
    saveProgress(w.id, record(cur, correct, 1 / 3, dayKey(), rules.scoring));
  };
  return (
    <PictureStop key={s.word.id} word={s.word} options={s.options} label={`ANIL'S WARM-UP ${i + 1}/2 · GROWN-UP, SAY`}
      gloss={state.settings.showGloss} onFirstTap={(ok) => score(s.word, ok)}
      onSolved={() => (i + 1 < stops.length ? setI(i + 1) : onDone())} />
  );
}

function Meet({ letter, onDone }: { letter: CurriculumLetter; onDone: () => void }) {
  const { state } = useApp();
  const line = meetScript(letter);
  const voice = useCanSay(state, letterKey(letter.n));
  return (
    <>
      <Script ta={`“${line.ta}”`} note={line.en} />
      <Pressable onPress={() => say(state, letterKey(letter.n), letter.glyph)} accessibilityLabel={`Letter ${letter.glyph}. Tap to hear it`} style={{ alignItems: 'center' }}>
        <LetterBuddy glyph={letter.glyph} color={C.peacock} feet={C.mango} size={220} />
      </Pressable>
      <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.inkMuted, textAlign: 'center' }}>{voice ? 'Tap the letter to hear it.' : `Say “${letter.sound}” together, then tap Next.`}</Text>
      <NextStep label="We said it" onPress={onDone} />
    </>
  );
}

function FirstLetterWord({ word, glyph }: { word: string; glyph: string }) {
  const [first, ...rest] = graphemes(word);
  return (
    <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.ink }}>
      <Text style={{ color: first.startsWith(glyph) ? C.kumkum : C.ink }}>{first}</Text>{rest.join('')}
    </Text>
  );
}

/** Mayil's sound story: a silly sentence and three pictures that start with the letter. */
function SoundStory({ letter, onDone }: { letter: CurriculumLetter; onDone: () => void }) {
  const { state } = useApp();
  const voice = useCanSay(state, null);
  return (
    <>
      <Script label="MAYIL'S STORY · GROWN-UP, READ IT SILLY" ta={`“${letter.soundStory.ta}”`} note={`${letter.soundStory.en} Stretch every ${letter.glyph}!`}
        action={voice ? <ChunkyButton label="▶" color={C.peacock} under={C.peacockDeep} onPress={() => say(state, null, letter.soundStory.ta)} /> : undefined} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {letter.soundWords.map((w) => (
          <Pressable key={w.ta} onPress={() => say(state, null, w.ta)} accessibilityLabel={w.en}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: R.md, backgroundColor: '#FFFFFF', ...drop(C.cardShadow, 4) }}>
            <Text style={{ fontSize: 44 }}>{w.emoji}</Text>
            <FirstLetterWord word={w.ta} glyph={letter.glyph} />
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.inkMuted }}>{w.en}</Text>
          </Pressable>
        ))}
      </View>
      <NextStep onPress={onDone} />
    </>
  );
}

function Trace({ letter, onDone }: { letter: CurriculumLetter; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const [demoKey, setDemoKey] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [passed, setPassed] = useState(false);
  const glyph = strokes[letter.glyph];
  const size = Math.min(width - 48, height - 380, 380);
  return (
    <>
      <Script label="GROWN-UP, SAY" ta={`“${letter.glyph} எழுதுவோம்!”`} note="Let's write it! Watch the orange pen, then trace from the green 1." />
      <Tracer key={demoKey} glyph={glyph} size={size} demoKey={demoKey}
        onResult={(r) => { setAttempts((a) => a + 1); if (r.passed) setPassed(true); }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        <ChunkyButton label="👀 Show me again" color="#FFFFFF" under={C.cardShadow} style={{ paddingHorizontal: 16 }} onPress={() => { setPassed(false); setDemoKey((k) => k + 1); }} />
        {/* Small hands: after a few honest tries, let them move on. */}
        <ChunkyButton label={passed ? 'Next' : 'Next (grown-up)'} disabled={!passed && attempts < content.rules.letters.traceAttemptsBeforeSkip}
          color={C.leaf} under="#27A158" onPress={onDone} />
      </View>
    </>
  );
}

/** Nandu's check: find the letter among others. Only the first tap of each round is scored. */
function Find({ letter, onDone }: { letter: CurriculumLetter; onDone: (right: number, of: number) => void }) {
  const { state, update } = useApp();
  const letters = curriculumLetters(content.curriculum);
  const rounds = useMemo(() => findRounds(letter, letters, state, content.rules.letters, Math.random), []);
  const [i, setI] = useState(0);
  const [said, setSaid] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const right = useRef(0);
  const round = rounds[i];
  const target = letters.find((l) => l.glyph === round.target)!;
  const line = findScript(target.glyph, target.sound);
  const voice = useCanSay(state, letterKey(target.n));
  const { scoring, letters: lr } = content.rules;

  const tap = (g: string) => {
    if (!said || solved || wrong.includes(g)) return;
    if (wrong.length === 0) {
      const ok = g === round.target;
      if (ok) right.current += 1;
      update((s) => recordLetter(s, round.target, ok, 1 / round.options.length, dayKey(), scoring, lr));
    }
    if (g !== round.target) { setWrong((w) => [...w, g]); return; }
    setSolved(true);
    setTimeout(() => {
      if (i + 1 < rounds.length) { setI(i + 1); setSaid(false); setWrong([]); setSolved(false); }
      else onDone(right.current, rounds.length);
    }, 1200);
  };

  return (
    <>
      <Script label={`NANDU'S CHECK ${i + 1}/${rounds.length} · GROWN-UP, SAY`} ta={`“${line.ta}”`} note={`${line.en} Don't look at the right one!`}
        action={<View style={{ gap: 8 }}>
          <ChunkyButton label={said ? 'Said ✓' : 'I said it'} disabled={said} onPress={() => setSaid(true)} />
          {voice && !said && <ChunkyButton label="▶ Play" color={C.peacock} under={C.peacockDeep} onPress={() => { say(state, letterKey(target.n), target.glyph); setSaid(true); }} />}
        </View>} />
      <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', opacity: said ? 1 : 0.45 }}>
        {round.options.map((g) => {
          const hint = wrong.length > 0 && !solved && g === round.target;
          const ok = solved && g === round.target;
          return (
            <Pressable key={g} disabled={!said} onPress={() => tap(g)} accessibilityLabel={`letter ${g}`}
              style={{ width: 100, height: 120, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? '#DDF6E6' : '#FFFFFF',
                opacity: wrong.includes(g) ? 0.35 : 1, borderWidth: hint || ok ? 5 : 0, borderColor: ok ? C.leaf : C.marigold, ...drop(C.cardShadow) }}>
              <Text style={{ fontFamily: F.heavy, fontSize: 64, color: C.ink, lineHeight: 84 }}>{g}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontFamily: F.heavy, fontSize: 26, color: solved ? C.kumkum : C.inkMuted, textAlign: 'center', minHeight: 34 }}>
        {solved ? 'சூப்பர்!' : wrong.length ? 'இதோ! Say it again.' : said ? '' : 'Listen…'}
      </Text>
    </>
  );
}

/** Aamai stretches the anchor word: slide under it, one sound at a time, then fast. */
function SaySlowly({ letter, onDone }: { letter: CurriculumLetter; onDone: () => void }) {
  const { state } = useApp();
  const word = letter.anchor.ta;
  const parts = blendParts(word).map((p) => p.syllable);
  const [whole, setWhole] = useState(false);
  const line = blendScript(word);
  return (
    <>
      <Script label="AAMAI SAYS IT SLOWLY · GROWN-UP, SAY" ta={`“${line.ta}”`} note={`${line.en} Then he slides Aamai along.`} />
      <SoundSlider parts={parts} color={C.peacock}
        onPart={(i) => say(state, null, parts[i])}
        onWhole={() => { setWhole(true); say(state, null, word); }} />
      {whole && <Text style={{ fontSize: 64, textAlign: 'center' }}>{letter.soundWords[0].emoji}</Text>}
      <NextStep label={whole ? 'Next' : 'Next (grown-up)'} onPress={onDone} />
    </>
  );
}

/** Kili's song: chant the letter with each word, clap on every letter. */
function Song({ letter, onDone }: { letter: CurriculumLetter; onDone: () => void }) {
  const { state } = useApp();
  const lines = songLines(letter);
  const [on, setOn] = useState<number | null>(null);
  const voice = useCanSay(state, null);
  const sing = async () => {
    for (let i = 0; i < lines.length; i++) { setOn(i); await sayAll(state, [{ key: null, text: lines[i] }], 150); }
    setOn(null);
  };
  return (
    <>
      <Script label="KILI'S SONG · SING IT TOGETHER" ta={`Clap on every ${letter.glyph}!`} note="Say each line, he says it back. Tap a line to highlight it."
        action={voice ? <ChunkyButton label="▶ Sing" color={C.peacock} under={C.peacockDeep} onPress={sing} /> : undefined} />
      <View style={{ gap: 8 }}>
        {lines.map((l, i) => (
          <Pressable key={i} onPress={() => setOn(i)} style={{ padding: 12, borderRadius: R.md, backgroundColor: on === i ? C.marigold : '#FFFFFF', ...drop(C.cardShadow, 3) }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.ink, textAlign: 'center' }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <NextStep label="We sang it" onPress={onDone} />
    </>
  );
}

/** Koo carries the new letter home. */
function RideHome({ letter, onDone }: { letter: CurriculumLetter; onDone: () => void }) {
  return (
    <>
      <Script label="GROWN-UP, SAY" ta={`“${letter.glyph} வீட்டுக்கு போகுது!”`} note={`${letter.glyph} is going home! Wave goodbye to it.`} />
      <View style={{ alignItems: 'center', gap: 4, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          <View style={{ width: 92, height: 72, borderRadius: R.sm, backgroundColor: C.peacock, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 48, color: '#FFFFFF', lineHeight: 64 }}>{letter.glyph}</Text>
          </View>
          <Art name="char-koo" width={170} height={124} />
        </View>
      </View>
      <NextStep label="Finish" onPress={onDone} />
    </>
  );
}

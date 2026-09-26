// A trip is a pure state machine so the UI (SwiftUI or React) only renders it.
// Mirrors ios/TamilTrainCore/Sources/TamilTrainCore/Trip.swift.
import { dayKey } from './dates';
import { distractors, pickWord, shuffle } from './picker';
import { initialProgress, record } from './tracer';
import type { DayKey, Rng, Rules, TripSettings, Word, WordProgress } from './types';

export type StopPhase = 'waitingForGrownUp' | 'choosing' | 'solved';

export interface Stop {
  index: number;
  word: Word;
  kind: Word['kind'];
  options: Word[];          // empty for action stops
  phase: StopPhase;
  attempted: boolean;       // a wrong first tap has been recorded
  wrongIds: string[];
  outcome?: 'firstTry' | 'afterHint' | 'didAction' | 'triedAction';
}

export interface TripState {
  settings: TripSettings;
  today: DayKey;
  stopIndex: number;
  used: string[];
  stop: Stop | null;
  cargo: string[];          // word ids loaded onto the wagons
  stats: { pictureStops: number; firstTry: number; actionStops: number; didAction: number };
  finished: boolean;
}

export interface TripDeps {
  words: Word[];
  rules: Rules;
  rng: Rng;
  getProgress: () => Record<string, WordProgress>;
  saveProgress: (id: string, p: WordProgress) => void;
}

export function isActionStop(index: number, s: TripSettings, rules: Rules): boolean {
  return s.actionStops && index % rules.trip.actionStopEvery === rules.trip.actionStopEvery - 1;
}

export function startTrip(settings: TripSettings, deps: TripDeps, today: DayKey = dayKey()): TripState {
  const t: TripState = {
    settings, today, stopIndex: 0, used: [], stop: null, cargo: [],
    stats: { pictureStops: 0, firstTry: 0, actionStops: 0, didAction: 0 }, finished: false,
  };
  return makeStop(t, deps);
}

function makeStop(t: TripState, deps: TripDeps): TripState {
  if (t.stopIndex >= t.settings.length) return { ...t, stop: null, finished: true };
  const kind: Word['kind'] = isActionStop(t.stopIndex, t.settings, deps.rules) ? 'action' : 'picture';
  const word = pickWord({
    words: deps.words, progress: deps.getProgress(), used: new Set(t.used), stopIndex: t.stopIndex,
    today: t.today, scoring: deps.rules.scoring, picker: deps.rules.picker, rng: deps.rng,
  }, kind);
  if (!word) return { ...t, stop: null, finished: true };
  const options = kind === 'picture'
    ? shuffle([word, ...distractors(word, deps.words, t.settings.choices - 1, deps.rng)], deps.rng)
    : [];
  return {
    ...t,
    used: [...t.used, word.id],
    stop: { index: t.stopIndex, word, kind, options, phase: 'waitingForGrownUp', attempted: false, wrongIds: [] },
  };
}

/** Grown-up tapped "I said it". Options stay locked until then so he listens first. */
export function grownUpSaid(t: TripState): TripState {
  if (!t.stop || t.stop.phase !== 'waitingForGrownUp') return t;
  return { ...t, stop: { ...t.stop, phase: 'choosing' } };
}

function score(deps: TripDeps, word: Word, correct: boolean, guess: number, today: DayKey) {
  const cur = deps.getProgress()[word.id] ?? initialProgress(word.homeFrequency, deps.rules.scoring);
  deps.saveProgress(word.id, record(cur, correct, guess, today, deps.rules.scoring));
}

/** Child tapped a picture. Only the first tap at a stop is scored. */
export function tapPicture(t: TripState, id: string, deps: TripDeps): TripState {
  const s = t.stop;
  if (!s || s.kind !== 'picture' || s.phase !== 'choosing' || s.wrongIds.includes(id)) return t;
  const guess = 1 / s.options.length;
  if (id === s.word.id) {
    if (!s.attempted) score(deps, s.word, true, guess, t.today);
    return {
      ...t,
      cargo: [...t.cargo, s.word.id],
      stats: { ...t.stats, pictureStops: t.stats.pictureStops + (s.attempted ? 0 : 1), firstTry: t.stats.firstTry + (s.attempted ? 0 : 1) },
      stop: { ...s, phase: 'solved', outcome: s.attempted ? 'afterHint' : 'firstTry' },
    };
  }
  if (!s.attempted) score(deps, s.word, false, guess, t.today);
  return {
    ...t,
    stats: { ...t.stats, pictureStops: t.stats.pictureStops + (s.attempted ? 0 : 1) },
    stop: { ...s, attempted: true, wrongIds: [...s.wrongIds, id] },
  };
}

/** Grown-up reports whether he did the action without a demo. */
export function reportAction(t: TripState, did: boolean, deps: TripDeps): TripState {
  const s = t.stop;
  if (!s || s.kind !== 'action' || s.phase !== 'choosing') return t;
  score(deps, s.word, did, deps.rules.scoring.actionGuess, t.today);
  return {
    ...t,
    cargo: [...t.cargo, s.word.id],
    stats: { ...t.stats, actionStops: t.stats.actionStops + 1, didAction: t.stats.didAction + (did ? 1 : 0) },
    stop: { ...s, phase: 'solved', outcome: did ? 'didAction' : 'triedAction' },
  };
}

/** Swap the word at this stop (e.g. grown-up doesn't like it). Nothing is recorded. */
export function skipStop(t: TripState, deps: TripDeps): TripState {
  if (!t.stop || t.stop.phase === 'solved') return t;
  return makeStop({ ...t }, deps);
}

export function advance(t: TripState, deps: TripDeps): TripState {
  if (!t.stop || t.stop.phase !== 'solved') return t;
  return makeStop({ ...t, stopIndex: t.stopIndex + 1 }, deps);
}

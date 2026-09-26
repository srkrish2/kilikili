// Content types mirror shared/content/*.json. Keep in sync with
// ios/TamilTrainCore/Sources/TamilTrainCore/Content.swift.

export type CategoryId = 'food' | 'family' | 'body' | 'animals' | 'things' | 'actions';
export type WordKind = 'picture' | 'action';

export interface Category { id: CategoryId; ta: string; en: string }

export interface Word {
  id: string;
  ta: string;
  translit: string;
  en: string;
  category: CategoryId;
  /** 1-3: how often he likely hears it at home. Sets the prior. */
  homeFrequency: 1 | 2 | 3;
  kind: WordKind;
  emoji: string;
  /** Path under shared/assets, or null => fall back to emoji. */
  art: string | null;
  register: 'spoken' | 'written';
}

export interface ScoringRules {
  priorByHomeFrequency: Record<'1' | '2' | '3', number>;
  slip: number;
  learnRate: number;
  actionGuess: number;
  knownThreshold: number;
  knownMinDistinctDays: number;
  emergingThreshold: number;
  maxTrackedDays: number;
}

export interface PickerRules {
  warmupStops: number;
  warmupChance: number;
  warmupPoolSize: number;
  gapWeight: number;
  maxGapDays: number;
  jitter: number;
}

export interface TripRules {
  defaultLength: number;
  lengthOptions: number[];
  defaultChoices: number;
  choiceOptions: number[];
  actionStopEvery: number;
  actionStopsDefaultOn: boolean;
  showEnglishGlossDefault: boolean;
  advanceDelayMs: number;
  actionAdvanceDelayMs: number;
}

export interface Rules {
  version: number;
  _doc?: string;
  scoring: ScoringRules;
  picker: PickerRules;
  trip: TripRules;
  daily: { tripsPerDay: number; gameMinutesPerDay: number };
  unlocks: { lettersLine: { knownWords: number }; readingLine: { knownLetters: number } };
  navigation: {
    tabs: string[];
    hideTabsDuringSession: boolean;
    holdToExitMs: number;
    grownupsGate: string;
  };
}

export interface ContentBundle {
  words: { version: number; categories: Category[]; words: Word[] };
  rules: Rules;
  // Curriculum is read by later screens; kept loose until the Letters Line is built.
  curriculum: Record<string, unknown>;
}

/** Calendar day in the child's local time zone, "YYYY-MM-DD". */
export type DayKey = string;

export interface WordProgress {
  p: number;
  n: number;
  c: number;
  days: DayKey[];
  lastDay: DayKey | null;
}

export type WordStatus = 'new' | 'known' | 'emerging' | 'notyet';

export interface TripSettings {
  length: number;
  choices: number;
  actionStops: boolean;
  showGloss: boolean;
}

/** Persisted shape. Same JSON on iOS and Android so progress can move between them. */
export interface SavedState {
  schema: 1;
  settings: TripSettings;
  progress: Record<string, WordProgress>;
  tripsByDay: Record<DayKey, number>;
}

export type Rng = () => number;

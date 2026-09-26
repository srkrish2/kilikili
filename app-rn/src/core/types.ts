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

export interface LetterRules {
  _doc?: string;
  /** Starting p for a letter, before any lesson. */
  prior: number;
  findChoices: number;
  findRounds: number;
  /** Trace: share of the centreline the finger must pass near, and how near (in pen widths). */
  traceCoverage: number;
  traceTolerance: number;
  traceMaxStray: number;
  traceAttemptsBeforeSkip: number;
}

export interface GameRules {
  beachRounds: number;
  memoryPairs: number;
  huntRounds: number;
  huntBubbles: number;
}

export interface Rules {
  version: number;
  _doc?: string;
  scoring: ScoringRules;
  picker: PickerRules;
  trip: TripRules;
  daily: { tripsPerDay: number; gameMinutesPerDay: number };
  letters: LetterRules;
  games: GameRules;
  unlocks: { lettersLine: { knownWords: number }; readingLine: { knownLetters: number } };
  navigation: {
    tabs: string[];
    hideTabsDuringSession: boolean;
    holdToExitMs: number;
    grownupsGate: string;
  };
}

export type LineId = 'listening' | 'letters' | 'reading';

export interface LetterAnchor { character?: string; word?: string | null; ta: string }

export interface CurriculumLetter {
  n: number;
  glyph: string;
  sound: string;
  type: 'vowel' | 'consonant';
  anchor: LetterAnchor;
  /** Words that start with the letter, for Mayil's sound story and Kili's song. */
  soundWords: { ta: string; en: string; emoji: string }[];
}

export interface Line {
  id: LineId;
  name: { en: string; ta: string };
  color: string;
  register: 'spoken' | 'written';
  unlock: { rule: 'lettersLine' | 'readingLine' } | null;
  description?: string;
  lessonSteps?: LessonStepId[];
  stepHosts?: Partial<Record<LessonStepId, string | null>>;
  letters?: CurriculumLetter[];
}

export type LessonStepId = 'warmup' | 'meet' | 'soundStory' | 'trace' | 'find' | 'saySlowly' | 'song' | 'rideHome';

export interface VoiceSlot { id: string; ta: string }

export interface Curriculum {
  version: number;
  lines: Line[];
  voices: { _doc?: string; slots: VoiceSlot[] };
  _doc?: string;
}

/** A written-register word the Reading Line can blend (only letters from the Letters Line). */
export interface ReadingWord { id: string; ta: string; translit: string; en: string; emoji: string }

export interface BookPage { ta: string; en: string; art: string }
export interface Book { id: string; title: string; titleEn: string; cover: string; pages: BookPage[] }

export interface Reading { version: number; _doc?: string; words: ReadingWord[]; books: Book[] }

/** Stroke order for tracing: glyph outline plus centreline strokes, in font units. */
export interface LetterStrokes {
  glyph: string;
  /** SVG path data for the glyph outline (y down), and its ink bounding box. */
  outline: string;
  box: { x: number; y: number; w: number; h: number };
  /** Strokes in writing order; each a polyline. A single point is a dot. */
  strokes: [number, number][][];
  /** Nominal stroke width of the glyph, for drawing and for scoring tolerance. */
  penWidth: number;
}

export interface ContentBundle {
  words: { version: number; categories: Category[]; words: Word[] };
  rules: Rules;
  curriculum: Curriculum;
  reading: Reading;
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

export type SessionKind = 'trip' | 'lesson' | 'blend' | 'book' | 'game';

/** One line of history for the grown-ups dashboard. */
export interface SessionLog {
  day: DayKey;
  kind: SessionKind;
  /** Short label: letter glyph, book id, game id. */
  label?: string;
  /** First-try right / scored attempts, when the session scores anything. */
  right?: number;
  of?: number;
}

export interface Profile {
  childName: string;
  age: number | null;
  /** Voice slot ids of who speaks Tamil at home. */
  speakers: string[];
}

export interface GrownupSettings {
  /** Open every line regardless of unlock rules (for a grown-up to preview). */
  previewAllLines: boolean;
  /** Which family voice to prefer when several are recorded. */
  preferredVoice: string | null;
}

/**
 * Persisted shape. Same JSON on iOS and Android so progress can move between them.
 * Fields after `tripsByDay` were added for the roadmap; they are optional in stored
 * JSON and filled with defaults by normalizeState (schema stays 1).
 */
export interface SavedState {
  schema: 1;
  settings: TripSettings;
  progress: Record<string, WordProgress>;
  tripsByDay: Record<DayKey, number>;
  onboarded: boolean;
  profile: Profile;
  grownups: GrownupSettings;
  /** Letter knowledge, keyed by glyph, same model as words. */
  letters: Record<string, WordProgress>;
  /** Completed lessons per glyph. */
  lessonsDone: Record<string, number>;
  booksRead: Record<string, number>;
  /** Seconds of games played per day (for the daily limit). */
  gameSecondsByDay: Record<DayKey, number>;
  /** Which family recordings exist: wordId -> slot ids. Audio files live on the device. */
  voices: Record<string, string[]>;
  history: SessionLog[];
}

export type Rng = () => number;

// SavedState defaults, normalisation and export/import. Pure: storage lives in the app.
import type { Rules, SavedState } from './types';

export function defaultState(rules: Rules): SavedState {
  const t = rules.trip;
  return {
    schema: 1,
    settings: { length: t.defaultLength, choices: t.defaultChoices, actionStops: t.actionStopsDefaultOn, showGloss: t.showEnglishGlossDefault },
    progress: {},
    tripsByDay: {},
    onboarded: false,
    profile: { childName: '', age: null, exposure: null, speakers: [] },
    grownups: { previewAllLines: false, preferredVoice: null },
    letters: {},
    lessonsDone: {},
    booksRead: {},
    gameSecondsByDay: {},
    engineColour: 0,
    voices: {},
    history: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Keep only the last N history entries; the dashboard shows recent weeks. */
export const HISTORY_LIMIT = 200;

/**
 * Fills defaults for anything missing, so JSON from an older build (or the Swift
 * starter, which only knows the first four fields) loads cleanly. Unknown keys are
 * dropped. Throws if the blob isn't a SavedState at all.
 */
export function normalizeState(raw: unknown, rules: Rules): SavedState {
  if (!isObj(raw) || !isObj(raw.progress)) throw new Error('Not Tamil Train progress');
  if (raw.schema !== undefined && raw.schema !== 1) throw new Error(`Unsupported schema ${String(raw.schema)}`);
  const d = defaultState(rules);
  const pick = <K extends keyof SavedState>(k: K): SavedState[K] => (isObj(raw[k]) || Array.isArray(raw[k]) ? (raw[k] as SavedState[K]) : d[k]);
  return {
    schema: 1,
    settings: { ...d.settings, ...(isObj(raw.settings) ? raw.settings : {}) },
    progress: raw.progress as SavedState['progress'],
    tripsByDay: pick('tripsByDay'),
    onboarded: typeof raw.onboarded === 'boolean' ? raw.onboarded : Object.keys(raw.progress).length > 0,
    profile: { ...d.profile, ...(isObj(raw.profile) ? raw.profile : {}) },
    grownups: { ...d.grownups, ...(isObj(raw.grownups) ? raw.grownups : {}) },
    letters: pick('letters'),
    lessonsDone: pick('lessonsDone'),
    booksRead: pick('booksRead'),
    gameSecondsByDay: pick('gameSecondsByDay'),
    engineColour: typeof raw.engineColour === 'number' ? raw.engineColour : d.engineColour,
    voices: pick('voices'),
    history: (Array.isArray(raw.history) ? raw.history : d.history).slice(-HISTORY_LIMIT),
  };
}

/** The export blob: exactly the SavedState, pretty-printed so a grown-up can read it. */
export function exportState(s: SavedState): string {
  return JSON.stringify(s, null, 2);
}

/** Parse pasted or picked text. Also accepts the prototype's `{ v, settings, progress }` shape. */
export function importState(text: string, rules: Rules): SavedState {
  const raw = JSON.parse(text) as unknown;
  if (isObj(raw) && raw.v === 1 && isObj(raw.progress) && raw.schema === undefined) {
    // Prototype (web) export: settings used len/choices/tpr/gloss and progress used `last` as a day number.
    const s = isObj(raw.settings) ? raw.settings : {};
    const progress: SavedState['progress'] = {};
    for (const [id, p] of Object.entries(raw.progress)) {
      if (!isObj(p)) continue;
      progress[id] = {
        p: Number(p.p), n: Number(p.n), c: Number(p.c),
        days: Array.isArray(p.days) ? (p.days as string[]) : [],
        lastDay: Array.isArray(p.days) && p.days.length ? (p.days[p.days.length - 1] as string) : null,
      };
    }
    return normalizeState({
      progress,
      settings: {
        ...(typeof s.len === 'number' ? { length: s.len } : {}),
        ...(typeof s.choices === 'number' ? { choices: s.choices } : {}),
        ...(s.tpr !== undefined ? { actionStops: !!s.tpr } : {}),
        ...(s.gloss !== undefined ? { showGloss: !!s.gloss } : {}),
      },
    }, rules);
  }
  return normalizeState(raw, rules);
}

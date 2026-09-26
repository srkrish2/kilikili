// What the app says out loud. Family recordings first (the point of Milestone 1),
// then the device's Tamil text-to-speech as a fallback. If neither exists, say()
// returns false and the screen falls back to its "Grown-up, say" script.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import type { SavedState } from '../core';
import { content } from '../generated/content';
import { recordingUri } from './voiceStore';

export const VOICE_SLOTS = content.curriculum.voices.slots;

/** Recording keys: word ids as they are; letters and reading words get a prefix. */
export const letterKey = (n: number) => `letter-${n}`;
export const readingKey = (id: string) => `read-${id}`;

let player: AudioPlayer | null = null;
let tamilTts: Promise<boolean> | null = null;

/** Does this device have a Tamil (ta-*) speech voice? Cached. */
export function hasTamilTts(): Promise<boolean> {
  tamilTts ??= Speech.getAvailableVoicesAsync()
    .then((vs) => vs.some((v) => v.language?.toLowerCase().startsWith('ta')))
    .catch(() => false);
  return tamilTts;
}

export function stopVoice() {
  try { player?.pause(); } catch { /* released */ }
  Speech.stop().catch(() => {});
}

/** Slots with a recording for `key`, preferred voice first. */
export function slotsFor(state: SavedState, key: string): string[] {
  const have = state.voices[key] ?? [];
  const pref = state.grownups.preferredVoice;
  return pref && have.includes(pref) ? [pref, ...have.filter((s) => s !== pref)] : have;
}

function play(uri: string): Promise<void> {
  return new Promise((resolve) => {
    stopVoice();
    player?.remove();
    player = createAudioPlayer(uri);
    const sub = player.addListener('playbackStatusUpdate', (st) => {
      if (st.didJustFinish) { sub.remove(); resolve(); }
    });
    player.play();
    // Never hang a screen on a clip that doesn't report finishing.
    setTimeout(resolve, 6000);
  });
}

function tts(text: string): Promise<void> {
  return new Promise((resolve) => {
    stopVoice();
    Speech.speak(text.replace(/[!?.]/g, ''), { language: 'ta-IN', rate: 0.8, onDone: resolve, onStopped: resolve, onError: () => resolve() });
    setTimeout(resolve, 1500 + text.length * 300);
  });
}

let modeSet = false;

/**
 * Say `text` (Tamil), using a family recording of `key` when there is one.
 * Resolves true if something was played, false if the grown-up has to say it.
 */
export async function say(state: SavedState, key: string | null, text: string): Promise<boolean> {
  if (!modeSet) { modeSet = true; setAudioModeAsync({ playsInSilentMode: true }).catch(() => {}); }
  if (key) {
    for (const slot of slotsFor(state, key)) {
      const uri = await recordingUri(slot, key).catch(() => null);
      if (uri) { await play(uri); return true; }
    }
  }
  if (await hasTamilTts()) { await tts(text); return true; }
  return false;
}

/** Say several things in a row (sound story, song, Aamai's stretch). */
export async function sayAll(state: SavedState, items: { key: string | null; text: string }[], gapMs = 250): Promise<boolean> {
  let any = false;
  for (const it of items) {
    any = (await say(state, it.key, it.text)) || any;
    await new Promise((r) => setTimeout(r, gapMs));
  }
  return any;
}

/** Can anything speak `key` right now? (A recording, or Tamil TTS.) */
export async function canSay(state: SavedState, key: string | null): Promise<boolean> {
  if (key && slotsFor(state, key).length) return true;
  return hasTamilTts();
}

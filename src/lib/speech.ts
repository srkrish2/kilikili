// Speech output.
//
// Recorded clips win: public/audio/manifest.json maps Tamil text -> file name
// (see scripts/generate_audio.py). Anything without a clip falls back to the
// browser's Tamil text-to-speech voice. Android/Chrome and Windows usually
// ship one; iPad/iPhone usually do not, which is what the clips are for.

import { getProgress } from './progress';
import { PRAISE } from '../content/prompts';

type Manifest = Record<string, string>;

let manifest: Promise<Manifest> | null = null;
function loadManifest(): Promise<Manifest> {
  manifest ??= fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : {}))
    .catch(() => ({}));
  return manifest;
}

const hasTts = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
function voices(): Promise<SpeechSynthesisVoice[]> {
  if (!hasTts()) return Promise.resolve([]);
  voicesReady ??= new Promise((resolve) => {
    const now = speechSynthesis.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
  return voicesReady;
}

export async function tamilVoice(): Promise<SpeechSynthesisVoice | undefined> {
  const all = await voices();
  const tamil = all.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ta'));
  // Prefer Indian Tamil, then higher-quality network voices.
  return (
    tamil.find((v) => v.lang.toLowerCase().includes('in') && !v.localService) ??
    tamil.find((v) => v.lang.toLowerCase().includes('in')) ??
    tamil[0]
  );
}

let generation = 0;
let audio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  generation++;
  audio?.pause();
  audio = null;
  if (hasTts()) speechSynthesis.cancel();
}

function playClip(url: string): Promise<void> {
  return new Promise((resolve) => {
    audio = new Audio(url);
    audio.onended = audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

async function ttsSay(text: string): Promise<void> {
  if (!hasTts()) return;
  const voice = await tamilVoice();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ta-IN';
    if (voice) u.voice = voice;
    u.rate = getProgress().settings.speechRate;
    // Some engines never fire onend; don't let a lesson hang on that.
    const timeout = setTimeout(resolve, 1500 + text.length * 350);
    u.onend = u.onerror = () => {
      clearTimeout(timeout);
      resolve();
    };
    speechSynthesis.speak(u);
  });
}

async function say(text: string): Promise<void> {
  const clips = await loadManifest();
  const clip = clips[text.normalize('NFC')];
  if (clip) return playClip(`${import.meta.env.BASE_URL}audio/${clip}`);
  return ttsSay(text);
}

/**
 * Says each text in turn, stopping anything already playing.
 * Resolves true if it finished, false if something else interrupted it.
 */
export async function speakSequence(
  texts: string[],
  { gapMs = 250, onItem }: { gapMs?: number; onItem?: (index: number) => void } = {},
): Promise<boolean> {
  stopSpeaking();
  const mine = generation;
  for (let i = 0; i < texts.length; i++) {
    if (generation !== mine) return false;
    onItem?.(i);
    await say(texts[i]);
    if (gapMs && i < texts.length - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return generation === mine;
}

export function speak(text: string): Promise<boolean> {
  return speakSequence([text]);
}

export const randomPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

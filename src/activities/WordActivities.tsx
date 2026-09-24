import { PROMPT } from '../content/prompts';
import { useState } from 'react';
import type { Word } from '../content/words';
import { spokenForm } from '../content/tamil';
import { NextButton, Prompt, SpeakerButton, useAutoSpeak } from '../components/common';
import { randomPraise, speak, speakSequence } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { useProgress } from '../lib/progress';

type Done = (mistakes: number) => void;

function English({ word }: { word: Word }) {
  const { settings } = useProgress();
  return settings.showEnglish ? <p className="en">{word.en}</p> : null;
}

/** Tap each letter to hear it, then hear them blend into the word. */
export function BlendWord({ word, onDone }: { word: Word; onDone: Done }) {
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [blended, setBlended] = useState(false);
  useAutoSpeak([PROMPT.tapEach]);

  const tap = (i: number) => {
    const next = new Set(tapped).add(i);
    setTapped(next);
    sfx.tap();
    if (next.size === word.tiles.length && !blended) {
      // Replay the sounds in order, then the whole word.
      // Reveal even if the audio was interrupted, so a child is never stuck here.
      speakSequence([...word.tiles.map(spokenForm), word.text], { gapMs: 150 }).then(() => {
        setBlended(true);
        sfx.correct();
      });
    } else {
      speak(spokenForm(word.tiles[i]));
    }
  };

  return (
    <div className="activity blend">
      <Prompt texts={[PROMPT.tapEach]}>👆 ஒவ்வொரு எழுத்தையும் தொடு</Prompt>
      <div className={`picture ${blended ? 'reveal' : 'hidden'}`}>{blended ? word.emoji : '❓'}</div>
      <div className={`tiles ${blended ? 'joined' : ''}`}>
        {word.tiles.map((t, i) => (
          <button key={i} className={`tile ${tapped.has(i) ? 'lit' : ''}`} onClick={() => tap(i)}>
            {t}
          </button>
        ))}
      </div>
      {blended && (
        <>
          <button className="word-big" onClick={() => speak(word.text)}>
            {word.text}
          </button>
          <English word={word} />
          <NextButton pulse onClick={() => onDone(0)} />
        </>
      )}
    </div>
  );
}

function useChoice<T>(correct: T, onRight: () => Promise<unknown>, onWrongSpeech: (choice: T) => string[]) {
  const [mistakes, setMistakes] = useState(0);
  const [shaking, setShaking] = useState<T | null>(null);
  const [solved, setSolved] = useState(false);
  const choose = (c: T, done: Done) => {
    if (solved) return;
    if (c === correct) {
      setSolved(true);
      sfx.correct();
      onRight().then(() => done(mistakes));
    } else {
      setMistakes((m) => m + 1);
      setShaking(c);
      sfx.wrong();
      speakSequence(onWrongSpeech(c));
      setTimeout(() => setShaking(null), 500);
    }
  };
  return { choose, shaking, solved };
}

/** Read the word, pick its picture. */
export function MatchPicture({ word, choices, onDone }: { word: Word; choices: Word[]; onDone: Done }) {
  useAutoSpeak([PROMPT.readAndPick]);
  const { choose, shaking, solved } = useChoice(
    word,
    () => speakSequence([word.text, randomPraise()]),
    () => [PROMPT.readAgain],
  );
  return (
    <div className="activity">
      <Prompt texts={[PROMPT.readAndPick]}>📖 படி, படத்தைத் தொடு</Prompt>
      <div className="word-row">
        <span className="word-big">{word.text}</span>
        <SpeakerButton texts={[word.text]} label="உதவி" />
      </div>
      <div className="choices">
        {choices.map((c) => (
          <button
            key={c.text}
            className={`pic-card ${shaking === c ? 'shake' : ''} ${solved && c === word ? 'correct' : ''}`}
            onClick={() => choose(c, onDone)}
            aria-label={c.en}
          >
            {c.emoji}
          </button>
        ))}
      </div>
      {solved && <English word={word} />}
    </div>
  );
}

/** Hear the word, pick how it is written. */
export function ListenWord({ word, choices, onDone }: { word: Word; choices: Word[]; onDone: Done }) {
  useAutoSpeak([word.text, PROMPT.whichWord]);
  const { choose, shaking, solved } = useChoice(
    word,
    () => speakSequence([word.text, randomPraise()]),
    (c) => [PROMPT.thisIs, c.text, word.text, PROMPT.where],
  );
  return (
    <div className="activity">
      <Prompt texts={[word.text]}>👂 எந்தச் சொல்?</Prompt>
      <div className="choices column">
        {choices.map((c) => (
          <button
            key={c.text}
            className={`word-card ${shaking === c ? 'shake' : ''} ${solved && c === word ? 'correct' : ''}`}
            onClick={() => choose(c, onDone)}
          >
            {c.text}
            {solved && c === word && <span className="emoji-inline">{c.emoji}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Put the letter tiles in order to build the pictured word. */
export function BuildWord({ word, tiles, onDone }: { word: Word; tiles: string[]; onDone: Done }) {
  const [placed, setPlaced] = useState<number[]>([]); // indices into `tiles`
  const [shaking, setShaking] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const complete = placed.length === word.tiles.length;
  useAutoSpeak([word.text, PROMPT.build]);

  const tap = (i: number) => {
    if (complete || placed.includes(i)) return;
    if (tiles[i] === word.tiles[placed.length]) {
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === word.tiles.length) {
        sfx.correct();
        speakSequence([word.text, randomPraise()]);
      } else {
        sfx.tap();
        speak(spokenForm(tiles[i]));
      }
    } else {
      sfx.wrong();
      setMistakes((m) => m + 1);
      setShaking(i);
      setTimeout(() => setShaking(null), 500);
    }
  };

  return (
    <div className="activity build">
      <Prompt texts={[word.text]}>🧩 சொல்லை உருவாக்கு</Prompt>
      <div className="picture reveal">{word.emoji}</div>
      <div className={`slots ${complete ? 'joined' : ''}`}>
        {word.tiles.map((_, i) => (
          <span key={i} className={`slot ${placed[i] !== undefined ? 'filled' : ''}`}>
            {placed[i] !== undefined ? tiles[placed[i]] : ''}
          </span>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((t, i) => (
          <button
            key={i}
            className={`tile ${placed.includes(i) ? 'used' : ''} ${shaking === i ? 'shake' : ''}`}
            onClick={() => tap(i)}
            disabled={placed.includes(i)}
          >
            {t}
          </button>
        ))}
      </div>
      {complete && (
        <>
          <English word={word} />
          <NextButton pulse onClick={() => onDone(mistakes)} />
        </>
      )}
    </div>
  );
}

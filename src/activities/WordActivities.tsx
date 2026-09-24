import { PROMPT } from '../content/prompts';
import { useState } from 'react';
import type { Word } from '../content/words';
import { spokenForm } from '../content/tamil';
import { NextButton, Prompt, useAutoSpeak, useFirstAnswer } from '../components/common';
import { LetterSlider } from '../components/LetterSlider';
import { randomPraise, speak, speakSequence } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { actions, useProgress } from '../lib/progress';

type Done = (mistakes: number) => void;

function English({ word }: { word: Word }) {
  const { settings } = useProgress();
  return settings.showEnglish ? <p className="en">{word.en}</p> : null;
}

/** Slide the parrot under the word to sound out each letter, then hear it blend. */
export function BlendWord({ word, onDone }: { word: Word; onDone: Done }) {
  const [blended, setBlended] = useState(false);
  useAutoSpeak([PROMPT.slide]);

  return (
    <div className="activity blend">
      <Prompt texts={[PROMPT.slide]}>🦜 கிளியை இழுத்துப் படி</Prompt>
      <div className={`picture ${blended ? 'reveal' : 'hidden'}`}>{blended ? word.emoji : '❓'}</div>
      <LetterSlider
        segments={word.tiles}
        spoken={spokenForm}
        whole={word.text}
        onComplete={() => {
          if (!blended) sfx.correct();
          setBlended(true);
        }}
      />
      {blended && (
        <>
          <English word={word} />
          <NextButton pulse onClick={() => onDone(0)} />
        </>
      )}
    </div>
  );
}

function useChoice(correct: Word, onRight: () => Promise<unknown>, onWrongSpeech: (choice: Word) => string[]) {
  const [mistakes, setMistakes] = useState(0);
  const [shaking, setShaking] = useState<Word | null>(null);
  const [solved, setSolved] = useState(false);
  const record = useFirstAnswer((ok: boolean) => actions.recordWord(correct.text, ok));
  const choose = (c: Word, done: Done) => {
    if (solved) return;
    record(c === correct);
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
      <LetterSlider segments={word.tiles} spoken={spokenForm} whole={word.text} />
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

  const record = useFirstAnswer((ok: boolean) => actions.recordWord(word.text, ok));

  const tap = (i: number) => {
    if (complete || placed.includes(i)) return;
    if (tiles[i] === word.tiles[placed.length]) {
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === word.tiles.length) {
        record(true);
        sfx.correct();
        speakSequence([word.text, randomPraise()]);
      } else {
        sfx.tap();
        speak(spokenForm(tiles[i]));
      }
    } else {
      record(false);
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

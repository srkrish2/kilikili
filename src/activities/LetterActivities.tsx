import { PROMPT } from '../content/prompts';
import { useState } from 'react';
import type { Letter } from '../content/letters';
import { graphemes } from '../content/tamil';
import { NextButton, Prompt, useAutoSpeak } from '../components/common';
import { randomPraise, speak, speakSequence } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { useProgress } from '../lib/progress';

type Done = (mistakes: number) => void;

/** Which letters of the example word to highlight: exact matches, else ones built on the letter. */
function highlightIndices(word: string, char: string): Set<number> {
  const g = graphemes(word);
  const exact = g.flatMap((x, i) => (x === char ? [i] : []));
  return new Set(exact.length ? exact : g.flatMap((x, i) => (x.startsWith(char) ? [i] : [])));
}

export function MeetLetter({ letter, onDone }: { letter: Letter; onDone: Done }) {
  const { settings } = useProgress();
  const [heard, setHeard] = useState(false);
  useAutoSpeak([letter.say, letter.say, letter.example.word], () => setHeard(true));
  const marks = highlightIndices(letter.example.word, letter.char);

  return (
    <div className="activity meet">
      <button className="letter-card huge bounce-in" onClick={() => speak(letter.say)}>
        {letter.char}
      </button>
      {letter.formula && (
        <div className="formula">
          <span>{letter.formula[0]}</span> + <span>{letter.formula[1]}</span> = <b>{letter.char}</b>
        </div>
      )}
      <button className="example" onClick={() => speakSequence([letter.say, letter.example.word])}>
        <span className="emoji">{letter.example.emoji}</span>
        <span className="tamil">
          {graphemes(letter.example.word).map((g, i) => (
            <span key={i} className={marks.has(i) ? 'mark' : ''}>
              {g}
            </span>
          ))}
        </span>
      </button>
      {settings.showEnglish && (
        <p className="en">
          “{letter.roman}” · {letter.example.en}
        </p>
      )}
      <NextButton pulse={heard} onClick={() => onDone(0)} />
    </div>
  );
}

export function FindLetter({ target, choices, onDone }: { target: Letter; choices: Letter[]; onDone: Done }) {
  const [mistakes, setMistakes] = useState(0);
  const [shaking, setShaking] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const ask = [target.say, PROMPT.where];
  useAutoSpeak(ask);

  const choose = (l: Letter) => {
    if (solved) return;
    if (l === target) {
      setSolved(true);
      sfx.correct();
      speakSequence([target.say, randomPraise()]).then(() => onDone(mistakes));
    } else {
      setMistakes((m) => m + 1);
      setShaking(l.char);
      sfx.wrong();
      // Name the wrong letter, then ask again — the mistake becomes a mini-lesson.
      speakSequence([PROMPT.thisIs, l.say, target.say, PROMPT.where], { gapMs: 150 });
      setTimeout(() => setShaking(null), 500);
    }
  };

  return (
    <div className="activity">
      <Prompt texts={ask}>👂 எங்கே?</Prompt>
      <div className="choices">
        {choices.map((l) => (
          <button
            key={l.char}
            className={`letter-card ${shaking === l.char ? 'shake' : ''} ${solved && l === target ? 'correct' : ''}`}
            onClick={() => choose(l)}
          >
            {l.char}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PopLetters({ target, bubbles, onDone }: { target: Letter; bubbles: Letter[]; onDone: Done }) {
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const remaining = bubbles.filter((b, i) => b === target && !popped.has(i)).length;
  const ask = [target.say, PROMPT.popAll];
  useAutoSpeak(ask);

  const tap = (b: Letter, i: number) => {
    if (popped.has(i) || remaining === 0) return;
    if (b === target) {
      sfx.pop();
      const next = new Set(popped).add(i);
      setPopped(next);
      if (remaining === 1) {
        sfx.win();
        speak(randomPraise());
      } else {
        speak(target.say);
      }
    } else {
      sfx.wrong();
      setMistakes((m) => m + 1);
      setShaking(i);
      speakSequence([PROMPT.thisIs, b.say], { gapMs: 100 });
      setTimeout(() => setShaking(null), 500);
    }
  };

  return (
    <div className="activity">
      <Prompt texts={ask}>
        🫧 <b className="target-chip">{target.char}</b> எல்லாவற்றையும் உடை!
      </Prompt>
      <div className="bubbles">
        {bubbles.map((b, i) => (
          <button
            key={i}
            className={`bubble ${popped.has(i) ? 'popped' : ''} ${shaking === i ? 'shake' : ''}`}
            style={{ animationDelay: `${(i % 5) * 0.3}s` }}
            onClick={() => tap(b, i)}
            disabled={popped.has(i)}
          >
            {b.char}
          </button>
        ))}
      </div>
      {remaining === 0 && <NextButton pulse onClick={() => onDone(mistakes)} />}
    </div>
  );
}

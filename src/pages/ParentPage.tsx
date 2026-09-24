import { PROMPT } from '../content/prompts';
import { useEffect, useState } from 'react';
import { ALL_LESSONS } from '../content/lessons';
import { BOOKS } from '../content/books';
import { actions, useProgress } from '../lib/progress';
import { speak, tamilVoice } from '../lib/speech';
import { confusedWith, needsPractice } from '../lib/practice';

/** A sum young children can't do yet but any adult can: keeps settings out of little hands. */
function ParentGate({ onPass }: { onPass: () => void }) {
  const [q] = useState(() => {
    const a = 11 + Math.floor(Math.random() * 20);
    const b = 11 + Math.floor(Math.random() * 20);
    const answer = a + b;
    const options = [answer, answer + 10, answer - 7].sort(() => Math.random() - 0.5);
    return { a, b, answer, options };
  });
  const [wrong, setWrong] = useState(false);
  return (
    <div className="page gate">
      <h1>👪 For parents</h1>
      <p>
        What is {q.a} + {q.b}?
      </p>
      <div className="row">
        {q.options.map((o) => (
          <button key={o} className="btn btn-soft" onClick={() => (o === q.answer ? onPass() : setWrong(true))}>
            {o}
          </button>
        ))}
      </div>
      {wrong && <p className="muted">Not quite — try again.</p>}
    </div>
  );
}

function VoiceStatus() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null | undefined>(undefined);
  useEffect(() => {
    tamilVoice().then((v) => setVoice(v ?? null));
  }, []);
  if (voice === undefined) return <p className="muted">Checking for a Tamil voice…</p>;
  return voice ? (
    <p>
      ✅ Tamil voice: <b>{voice.name}</b>
    </p>
  ) : (
    <div className="warn">
      <p>
        ⚠️ This device has no Tamil text-to-speech voice, so letters and books may be read in the wrong
        language.
      </p>
      <ul>
        <li>Android: Settings → Text-to-speech → Google → install Tamil (தமிழ்) voice data.</li>
        <li>Windows: Settings → Time &amp; language → Speech → add Tamil.</li>
        <li>iPad/iPhone: no built-in Tamil voice — use recorded audio clips (see the project README).</li>
      </ul>
    </div>
  );
}

export function ParentPage() {
  const [unlocked, setUnlocked] = useState(false);
  const progress = useProgress();
  const { settings } = progress;

  if (!unlocked) return <ParentGate onPass={() => setUnlocked(true)} />;

  const lessonsDone = ALL_LESSONS.filter((l) => l.id in progress.stars).length;
  const booksRead = BOOKS.filter((b) => progress.booksRead[b.id]).length;

  return (
    <div className="page parent">
      <header className="top-bar">
        <h1>👪 Parents</h1>
      </header>

      <section className="card">
        <h2>Progress</h2>
        <div className="progress-track big">
          <div className="progress-fill" style={{ width: `${(lessonsDone / ALL_LESSONS.length) * 100}%` }} />
        </div>
        <p>
          {lessonsDone} of {ALL_LESSONS.length} lessons · {booksRead} of {BOOKS.length} books read
        </p>
      </section>

      <TrickyItems />

      <section className="card">
        <h2>Voice</h2>
        <VoiceStatus />
        <label className="setting">
          <span>Speech speed</span>
          <input
            type="range"
            min={0.5}
            max={1.2}
            step={0.05}
            value={settings.speechRate}
            onChange={(e) => actions.updateSettings({ speechRate: Number(e.target.value) })}
          />
        </label>
        <button className="btn btn-soft small" onClick={() => speak(PROMPT.hello)}>
          ▶ Test voice
        </button>
      </section>

      <section className="card">
        <h2>Settings</h2>
        <label className="setting">
          <span>Show English translations</span>
          <input
            type="checkbox"
            checked={settings.showEnglish}
            onChange={(e) => actions.updateSettings({ showEnglish: e.target.checked })}
          />
        </label>
        <label className="setting">
          <span>Books read one word at a time</span>
          <input
            type="checkbox"
            checked={settings.readMode === 'word'}
            onChange={(e) => actions.updateSettings({ readMode: e.target.checked ? 'word' : 'sentence' })}
          />
        </label>
        <label className="setting">
          <span>Unlock all lessons and books</span>
          <input
            type="checkbox"
            checked={settings.unlockAll}
            onChange={(e) => actions.updateSettings({ unlockAll: e.target.checked })}
          />
        </label>
      </section>

      <section className="card">
        <h2>Reset</h2>
        <button
          className="btn btn-danger small"
          onClick={() => {
            if (confirm('Erase all stars and progress on this device?')) actions.reset();
          }}
        >
          Reset progress
        </button>
      </section>
    </div>
  );
}

function TrickyItems() {
  const { letterStats, wordStats, confusions } = useProgress();
  const letters = needsPractice(letterStats);
  const words = needsPractice(wordStats);
  return (
    <section className="card">
      <h2>Tricky letters &amp; words</h2>
      {!letters.length && !words.length ? (
        <p className="muted">Nothing yet. Letters and words your child gets wrong will show up here and in a 🔁 practice session on the path.</p>
      ) : (
        <ul className="tricky">
          {letters.map((c) => {
            const mixed = confusedWith(confusions, c)[0];
            return (
              <li key={c}>
                <b className="tamil-lg">{c}</b>
                <span>
                  missed {letterStats[c].wrong}× of {letterStats[c].wrong + letterStats[c].right}
                  {mixed && (
                    <>
                      {' '}· confused with <b className="tamil-lg">{mixed}</b> ({confusions[c][mixed]}×)
                    </>
                  )}
                </span>
              </li>
            );
          })}
          {words.map((w) => (
            <li key={w}>
              <b className="tamil-lg">{w}</b>
              <span>
                missed {wordStats[w].wrong}× of {wordStats[w].wrong + wordStats[w].right}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

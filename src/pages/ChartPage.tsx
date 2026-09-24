import { useState } from 'react';
import { AYTHAM, CONSONANTS, UYIR, mei, spokenForm, uyirmei } from '../content/tamil';
import { speak } from '../lib/speech';
import { useProgress } from '../lib/progress';

type Tab = 'uyir' | 'mei' | 'uyirmei';

function Cell({ char, className = '' }: { char: string; className?: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className={`chart-cell ${className} ${pressed ? 'pressed' : ''}`}
      onClick={() => {
        setPressed(true);
        speak(spokenForm(char)).then(() => setPressed(false));
      }}
    >
      {char}
    </button>
  );
}

/** Free-play alphabet chart: tap any letter to hear it. */
export function ChartPage() {
  const [tab, setTab] = useState<Tab>('uyir');
  const [row, setRow] = useState(CONSONANTS[0]);
  const { settings } = useProgress();

  return (
    <div className="page">
      <header className="top-bar">
        <h1>🔤 எழுத்துகள்</h1>
      </header>
      <div className="segmented">
        {(
          [
            ['uyir', 'உயிர்', 'Vowels'],
            ['mei', 'மெய்', 'Consonants'],
            ['uyirmei', 'உயிர்மெய்', 'Combined'],
          ] as const
        ).map(([key, ta, en]) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
            {ta}
            {settings.showEnglish && <small>{en}</small>}
          </button>
        ))}
      </div>

      {tab === 'uyir' && (
        <div className="chart-grid">
          {[...UYIR, AYTHAM].map((c) => (
            <Cell key={c} char={c} className="uyir" />
          ))}
        </div>
      )}

      {tab === 'mei' && (
        <div className="chart-grid">
          {CONSONANTS.map((c) => (
            <Cell key={c} char={mei(c)} className="mei" />
          ))}
        </div>
      )}

      {tab === 'uyirmei' && (
        <>
          {/* One consonant row at a time keeps cells big enough for small fingers. */}
          <div className="row-picker">
            {CONSONANTS.map((c) => (
              <button key={c} className={row === c ? 'on' : ''} onClick={() => setRow(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="chart-grid">
            {UYIR.map((v, i) => (
              <div key={v} className="chart-combo">
                <Cell char={uyirmei(row, i)} className="uyirmei" />
                <span className="combo-hint">
                  {mei(row)} + {v}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

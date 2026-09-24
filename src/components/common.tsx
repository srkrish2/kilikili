import { useEffect, useMemo, type ReactNode } from 'react';
import { speakSequence, stopSpeaking } from '../lib/speech';

/** Speaks the given texts when the component mounts (and stops on unmount). */
export function useAutoSpeak(texts: string[], onFinished?: () => void) {
  const key = texts.join('|');
  useEffect(() => {
    let live = true;
    // A short delay lets a previous screen's sound effect finish first.
    const t = setTimeout(() => {
      speakSequence(texts).then((done) => live && done && onFinished?.());
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
      stopSpeaking();
    };
  }, [key]);
}

export function SpeakerButton({ texts, label = 'கேள்', big }: { texts: string[]; label?: string; big?: boolean }) {
  return (
    <button
      className={`speaker ${big ? 'speaker-big' : ''}`}
      aria-label={label}
      onClick={() => speakSequence(texts)}
    >
      🔊
    </button>
  );
}

export function NextButton({ onClick, pulse, children = '➜' }: { onClick: () => void; pulse?: boolean; children?: ReactNode }) {
  return (
    <button className={`btn btn-go ${pulse ? 'pulse' : ''}`} onClick={onClick} aria-label="அடுத்து">
      {children}
    </button>
  );
}

export function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${count} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'star on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

const COLORS = ['#ff8a3d', '#2bb673', '#7b61ff', '#ffcc00', '#ff5d8f', '#3dc6ff'];

export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 1.8 + Math.random() * 1.5,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
      })),
    [pieces],
  );
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            left: `${b.left}%`,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            transform: `rotate(${b.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function Prompt({ children, texts }: { children: ReactNode; texts: string[] }) {
  return (
    <div className="prompt">
      <SpeakerButton texts={texts} />
      <span>{children}</span>
    </div>
  );
}

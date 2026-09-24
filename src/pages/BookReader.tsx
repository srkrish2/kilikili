import { PROMPT } from '../content/prompts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getBook, pageWords } from '../content/books';
import { actions, isBookUnlocked, useProgress } from '../lib/progress';
import { speak, speakSequence, stopSpeaking } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { Confetti, NextButton } from '../components/common';

export function BookReader() {
  const { id = '' } = useParams();
  return <Reader key={id} id={id} />;
}

function Reader({ id }: { id: string }) {
  const book = getBook(id);
  const progress = useProgress();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [lit, setLit] = useState<number | 'all' | null>(null);
  const swipeX = useRef<number | null>(null);

  const total = book?.pages.length ?? 0;
  const atEnd = page >= total;
  const current = book && !atEnd ? book.pages[page] : null;
  const words = current ? pageWords(current.text) : [];

  const readPage = useCallback(() => {
    if (!current) return;
    const ws = pageWords(current.text);
    if (progress.settings.readMode === 'word') {
      speakSequence(
        ws.map((w) => w.spoken),
        { gapMs: 120, onItem: setLit },
      ).then((done) => done && setLit(null));
    } else {
      setLit('all');
      speak(current.text).then((done) => done && setLit(null));
    }
  }, [current, progress.settings.readMode]);

  // Read each page aloud when it opens.
  useEffect(() => {
    setLit(null);
    if (atEnd) {
      if (book) actions.markBookRead(book.id);
      sfx.win();
      speak(PROMPT.theEnd);
      return;
    }
    const t = setTimeout(readPage, 500);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [page]);

  if (!book || !isBookUnlocked(progress, book)) return <Navigate to="/books" replace />;

  const go = (delta: number) => {
    const next = Math.min(Math.max(page + delta, 0), total);
    if (next !== page) {
      sfx.tap();
      setPage(next);
    }
  };

  if (atEnd) {
    return (
      <div className="reader end" style={{ background: book.color }}>
        <Confetti />
        <div className="cover-art big bounce-in">{book.cover}</div>
        <h1>முற்றும்!</h1>
        {progress.settings.showEnglish && <p className="en">The End</p>}
        <div className="row">
          <button className="btn btn-soft" onClick={() => setPage(0)} aria-label="மீண்டும் படி">
            ↺
          </button>
          <NextButton onClick={() => navigate('/books')}>📚</NextButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className="reader"
      style={{ background: book.color }}
      onPointerDown={(e) => (swipeX.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeX.current === null) return;
        const dx = e.clientX - swipeX.current;
        swipeX.current = null;
        if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
      }}
    >
      <header className="lesson-bar">
        <Link to="/books" className="close" aria-label="மூடு">
          ✕
        </Link>
        <div className="page-dots">
          {book.pages.map((_, i) => (
            <span key={i} className={i === page ? 'on' : ''} />
          ))}
        </div>
      </header>

      <div className="page-art" key={page}>
        {current!.art}
      </div>

      <p className="page-text">
        {words.map((w, i) => (
          <button
            key={i}
            className={`word ${lit === 'all' || lit === i ? 'lit' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setLit(i);
              speak(w.spoken).then(() => setLit(null));
            }}
          >
            {w.display}
          </button>
        ))}
      </p>
      {progress.settings.showEnglish && <p className="en">{current!.en}</p>}

      <nav className="reader-controls">
        <button className="btn btn-soft" onClick={() => go(-1)} disabled={page === 0} aria-label="முந்தைய">
          ◀
        </button>
        <button className="btn btn-read" onClick={readPage} aria-label="படித்துக் காட்டு">
          🔊
        </button>
        <button className="btn btn-go" onClick={() => go(1)} aria-label="அடுத்து">
          ▶
        </button>
      </nav>
    </div>
  );
}

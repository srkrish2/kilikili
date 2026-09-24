import { useNavigate } from 'react-router-dom';
import { BOOKS } from '../content/books';
import { isBookUnlocked, useProgress } from '../lib/progress';
import { sfx } from '../lib/sfx';

export function BooksPage() {
  const progress = useProgress();
  const navigate = useNavigate();
  return (
    <div className="page">
      <header className="top-bar">
        <h1>📚 புத்தகங்கள்</h1>
      </header>
      <div className="shelf">
        {BOOKS.map((book) => {
          const unlocked = isBookUnlocked(progress, book);
          const reads = progress.booksRead[book.id] ?? 0;
          return (
            <button
              key={book.id}
              className={`book-cover ${unlocked ? '' : 'locked'}`}
              style={{ background: book.color }}
              disabled={!unlocked}
              onClick={() => {
                sfx.tap();
                navigate(`/books/${book.id}`);
              }}
            >
              <span className="cover-art">{unlocked ? book.cover : '🔒'}</span>
              <span className="cover-title">{book.title}</span>
              {progress.settings.showEnglish && <span className="cover-en">{book.titleEn}</span>}
              {reads > 0 && <span className="read-badge">✓ {reads}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

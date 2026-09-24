import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UNITS, type Lesson } from '../content/lessons';
import { getWord } from '../content/words';
import { currentLessonId, isLessonUnlocked, totalStars, useProgress } from '../lib/progress';
import { Stars } from '../components/common';
import { sfx } from '../lib/sfx';

function nodeLabel(lesson: Lesson) {
  if (lesson.kind === 'letters') {
    // Long lessons show their first few letters; the node is a tap target, not a list.
    return <span className="node-letters">{lesson.items.slice(0, 3).join(' ')}</span>;
  }
  return <span className="node-emoji">{getWord(lesson.words[0]).emoji}</span>;
}

// Zig-zag offsets for the winding path, as a percentage of the maximum sideways shift.
const WAVE = [0, 45, 70, 45, 0, -45, -70, -45];

export function PathPage() {
  const progress = useProgress();
  const navigate = useNavigate();
  const current = currentLessonId(progress);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  let n = 0;
  return (
    <div className="page path-page">
      <header className="top-bar">
        <h1 className="logo">
          கிளிகிளி <span aria-hidden>🦜</span>
        </h1>
        <div className="star-count">
          ★ {totalStars(progress)}
        </div>
      </header>

      {UNITS.map((unit) => (
        <section key={unit.id} className="unit" style={{ ['--unit' as string]: unit.color }}>
          <div className="unit-banner">
            <h2>{unit.title}</h2>
            {progress.settings.showEnglish && <p>{unit.titleEn}</p>}
          </div>
          <div className="path">
            {unit.lessons.map((lesson) => {
              const unlocked = isLessonUnlocked(progress, lesson.id);
              const stars = progress.stars[lesson.id];
              const isCurrent = lesson.id === current;
              const shift = WAVE[n++ % WAVE.length];
              return (
                <div key={lesson.id} className="node-wrap" style={{ ['--shift' as string]: shift / 100 }}>
                  <button
                    ref={isCurrent ? currentRef : undefined}
                    className={`node ${lesson.kind} ${unlocked ? '' : 'locked'} ${isCurrent ? 'current' : ''} ${stars ? 'complete' : ''}`}
                    disabled={!unlocked}
                    onClick={() => {
                      sfx.tap();
                      navigate(`/lesson/${lesson.id}`);
                    }}
                    aria-label={lesson.id}
                  >
                    {unlocked ? nodeLabel(lesson) : '🔒'}
                  </button>
                  {stars ? <Stars count={stars} /> : isCurrent ? <span className="start-flag">▶</span> : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="path-end">🏆</div>
    </div>
  );
}

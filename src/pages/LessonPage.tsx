import { PROMPT } from '../content/prompts';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getLesson, unitOf } from '../content/lessons';
import { buildPlan, buildPracticePlan, starsFor, type Step } from '../lib/lessonPlan';
import { actions, getProgress, isLessonUnlocked, useProgress } from '../lib/progress';
import { speakSequence, stopSpeaking } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { Confetti, NextButton, Stars } from '../components/common';
import { FindLetter, MeetLetter, PopLetters } from '../activities/LetterActivities';
import { TraceLetter } from '../activities/TraceLetter';
import { BlendWord, BuildWord, ListenWord, MatchPicture } from '../activities/WordActivities';

function StepView({ step, onDone }: { step: Step; onDone: (mistakes: number) => void }) {
  switch (step.type) {
    case 'meet':
      return <MeetLetter letter={step.letter} onDone={onDone} />;
    case 'trace':
      return <TraceLetter letter={step.letter} onDone={onDone} />;
    case 'find':
      return <FindLetter target={step.target} choices={step.choices} onDone={onDone} />;
    case 'pop':
      return <PopLetters target={step.target} bubbles={step.bubbles} onDone={onDone} />;
    case 'blend':
      return <BlendWord word={step.word} onDone={onDone} />;
    case 'match':
      return <MatchPicture word={step.word} choices={step.choices} onDone={onDone} />;
    case 'listen':
      return <ListenWord word={step.word} choices={step.choices} onDone={onDone} />;
    case 'build':
      return <BuildWord word={step.word} tiles={step.tiles} onDone={onDone} />;
  }
}

export function LessonPage() {
  const { id = '' } = useParams();
  // Keyed so moving between lessons starts fresh instead of reusing step state.
  return <LessonRun key={id} id={id} />;
}

function LessonRun({ id }: { id: string }) {
  const lesson = getLesson(id);
  const progress = useProgress();
  // Built once per visit; confusions steer the "where is…?" choices.
  const steps = useMemo(() => (lesson ? buildPlan(lesson, Math.random, getProgress().confusions) : []), [lesson]);
  if (!lesson || !isLessonUnlocked(progress, lesson.id)) return <Navigate to="/" replace />;
  return (
    <LessonPlayer
      steps={steps}
      color={unitOf(lesson.id)?.color ?? '#2bb673'}
      onFinish={(stars) => actions.completeLesson(lesson.id, stars)}
    />
  );
}

/** Practice session built from the child's tricky letters and words. */
export function PracticePage() {
  const steps = useMemo(() => buildPracticePlan(getProgress()), []);
  if (!steps.length) return <Navigate to="/" replace />;
  return <LessonPlayer steps={steps} color="#ff5d8f" />;
}

function LessonPlayer({ steps, color, onFinish }: { steps: Step[]; color: string; onFinish?: (stars: number) => void }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const finished = index >= steps.length;
  const stars = starsFor(mistakes);

  useEffect(() => {
    if (!finished) return;
    onFinish?.(stars);
    sfx.win();
    speakSequence([PROMPT.wellDone, PROMPT.lessonDone]);
    // Only when the lesson flips to finished.
  }, [finished]);

  useEffect(() => stopSpeaking, []);

  if (finished) {
    return (
      <div className="lesson done-screen" style={{ ['--unit' as string]: color }}>
        <Confetti />
        <div className="trophy bounce-in">🦜</div>
        <h1>அருமை!</h1>
        <Stars count={stars} />
        <NextButton pulse onClick={() => navigate('/')}>
          🏠
        </NextButton>
      </div>
    );
  }

  return (
    <div className="lesson" style={{ ['--unit' as string]: color }}>
      <header className="lesson-bar">
        <Link to="/" className="close" aria-label="மூடு">
          ✕
        </Link>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(index / steps.length) * 100}%` }} />
        </div>
      </header>
      <main className="lesson-body">
        <StepView
          key={index}
          step={steps[index]}
          onDone={(m) => {
            setMistakes((x) => x + m);
            setIndex((i) => i + 1);
          }}
        />
      </main>
    </div>
  );
}

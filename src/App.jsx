import { useEffect, useMemo, useState } from 'react';
import rawQuestions from './data/questions.json';
import config from './data/config.json';
import { advance, answerCurrent, createQuiz, isRestorable, phaseOf, validateQuestions } from './lib/quiz.js';
import { clearState, loadState, saveState } from './lib/storage.js';
import Home from './components/Home.jsx';
import Question from './components/Question.jsx';
import Feedback from './components/Feedback.jsx';
import Result from './components/Result.jsx';

const { questions, errors } = validateQuestions(rawQuestions);
if (errors.length) console.warn('[quiz] 검증에 실패해 제외된 문항', errors);
const questionsById = new Map(questions.map((q) => [q.id, q]));

function restore() {
  const saved = loadState();
  return isRestorable(saved, questionsById, config.modes) ? saved : null;
}

export default function App() {
  const [quiz, setQuiz] = useState(restore);

  useEffect(() => {
    if (quiz) saveState(quiz);
    else clearState();
  }, [quiz]);

  const mode = useMemo(() => config.modes.find((m) => m.id === quiz?.modeId), [quiz?.modeId]);

  const start = (modeId) => {
    const next = config.modes.find((m) => m.id === modeId);
    setQuiz(createQuiz(next, questions, config.questionCount));
  };
  const goHome = () => setQuiz(null);

  let screen;
  if (!quiz) {
    screen = <Home config={config} onStart={start} />;
  } else {
    const phase = phaseOf(quiz);
    const current = questionsById.get(quiz.questionIds[quiz.currentIndex]);
    const progress = { index: quiz.currentIndex + 1, total: quiz.questionIds.length };
    if (phase === 'question') {
      screen = (
        <Question
          key={current.id}
          question={current}
          mode={mode}
          progress={progress}
          onAnswer={(selected) => setQuiz((s) => answerCurrent(s, current, selected))}
          onQuit={goHome}
        />
      );
    } else if (phase === 'feedback') {
      screen = (
        <Feedback
          key={current.id}
          question={current}
          answer={quiz.answers[quiz.currentIndex]}
          streak={quiz.streak}
          progress={progress}
          onNext={() => setQuiz((s) => advance(s))}
        />
      );
    } else {
      screen = (
        <Result
          quiz={quiz}
          mode={mode}
          modes={config.modes}
          labels={config.resultLabels}
          questionsById={questionsById}
          onStart={start}
          onHome={goHome}
        />
      );
    }
  }

  return (
    <div className="app">
      <main className="container">{screen}</main>
      {(config.eventName || config.logoUrl) && (
        <footer className="event">
          {config.logoUrl && <img src={config.logoUrl} alt="" className="event-logo" />}
          {config.eventName && <span>{config.eventName}</span>}
        </footer>
      )}
    </div>
  );
}

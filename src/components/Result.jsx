import { gradeFor } from '../lib/quiz.js';
import useFocusOnMount from './useFocusOnMount.js';

const ox = (value) => (value ? 'O' : 'X');

export default function Result({ quiz, mode, modes, isUnlocked, labels, questionsById, onStart, onHome }) {
  const titleRef = useFocusOnMount();
  const total = quiz.questionIds.length;
  const grade = gradeFor(quiz.correctCount, total, labels);
  const nextMode = modes.find((m) => m.id === mode.next && isUnlocked(m));
  const wrong = quiz.answers.filter((a) => !a.correct);

  return (
    <section className="screen result">
      <p className="result-mode">{mode.label} {total}문제 도전 완료</p>
      <span className="result-emoji" aria-hidden="true">{grade.emoji}</span>
      <h1 ref={titleRef} tabIndex={-1}>{grade.label}</h1>
      <p className="score">
        <strong>{quiz.correctCount}</strong> / {total} 정답
      </p>
      {quiz.maxStreak >= 3 && <p className="streak">🔥 최대 {quiz.maxStreak}문제 연속 정답</p>}
      <p className="result-message">{grade.message}</p>

      {nextMode?.unlockedBy === mode.id && (
        <p className="unlock-notice">
          {nextMode.emoji} <strong>{nextMode.label}</strong> 도전이 열렸어요!
        </p>
      )}

      <div className="result-actions">
        {nextMode && (
          <button type="button" className={`btn-primary btn-next-${nextMode.id}`} onClick={() => onStart(nextMode.id)}>
            {nextMode.emoji} {nextMode.label} 도전하기
          </button>
        )}
        <button
          type="button"
          className={nextMode ? 'btn-secondary' : 'btn-primary'}
          onClick={() => onStart(mode.id)}
        >
          {mode.label} 다시 도전 (새 문제)
        </button>
        <button type="button" className="btn-text" onClick={onHome}>
          처음으로
        </button>
      </div>

      {wrong.length > 0 && (
        <details className="review">
          <summary>틀린 문제 다시 보기 ({wrong.length})</summary>
          <ol>
            {wrong.map((a) => {
              const q = questionsById.get(a.questionId);
              return (
                <li key={q.id}>
                  <p className="review-q">{q.question}</p>
                  <p className="review-a">
                    <strong>정답 {ox(q.answer)}</strong> · 내가 고른 답 {ox(a.selected)}
                  </p>
                  <p className="review-e">{q.explanation}</p>
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </section>
  );
}

import useFocusOnMount from './useFocusOnMount.js';
import Progress from './Progress.jsx';

const ox = (value) => (value ? 'O' : 'X');

export default function Feedback({ question, answer, streak, progress, onNext }) {
  const titleRef = useFocusOnMount();
  const isLast = progress.index === progress.total;
  const { correct } = answer;

  return (
    <section className={`screen feedback ${correct ? 'is-correct' : 'is-wrong'}`}>
      <Progress {...progress} />
      <div className="feedback-head">
        <span className="feedback-emoji" aria-hidden="true">{correct ? '🎉' : '🌱'}</span>
        <h1 ref={titleRef} tabIndex={-1}>
          {correct ? '정답이에요!' : '아쉽지만 배웠어요'}
        </h1>
        {correct && streak >= 3 && <p className="streak">🔥 {streak}문제 연속 정답!</p>}
      </div>
      <p className="feedback-question">{question.question}</p>
      <div className="answer-box">
        <p className="answer-line">
          <strong>정답 {ox(question.answer)}</strong>
          {!correct && <span className="my-answer">내가 고른 답 {ox(answer.selected)}</span>}
        </p>
        <p className="explanation">{question.explanation}</p>
      </div>
      <div className="sticky-cta">
        <button type="button" className="btn-primary" onClick={onNext}>
          {isLast ? '결과 보기' : '다음 문제'} →
        </button>
      </div>
    </section>
  );
}

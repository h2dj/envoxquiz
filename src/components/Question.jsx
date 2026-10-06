import { useEffect, useRef, useState } from 'react';
import useFocusOnMount from './useFocusOnMount.js';
import Progress from './Progress.jsx';

const TAP_FEEDBACK_MS = 150;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function Question({ question, mode, progress, onAnswer, onQuit }) {
  const titleRef = useFocusOnMount();
  const [selected, setSelected] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (value) => {
    if (selected !== null) return; // 첫 입력 이후 재입력 방지
    setSelected(value);
    timer.current = setTimeout(() => onAnswer(value), prefersReducedMotion() ? 0 : TAP_FEEDBACK_MS);
  };

  const quit = () => {
    if (window.confirm('퀴즈를 그만두고 처음 화면으로 갈까요?')) onQuit();
  };

  return (
    <section className="screen quiz">
      <div className="quiz-top">
        <Progress {...progress} />
        <button type="button" className="quit" onClick={quit}>
          그만하기
        </button>
      </div>
      <span className={`badge badge-${mode.id}`}>{mode.label}</span>
      <h1 ref={titleRef} tabIndex={-1} className="question-text">
        {question.question}
      </h1>
      <div className="ox-buttons">
        <button
          type="button"
          className={`ox ox-o${selected === true ? ' is-selected' : ''}`}
          aria-label="O, 맞다"
          disabled={selected !== null}
          onClick={() => choose(true)}
        >
          <span className="ox-mark" aria-hidden="true">O</span>
          <span className="ox-word" aria-hidden="true">맞다</span>
        </button>
        <button
          type="button"
          className={`ox ox-x${selected === false ? ' is-selected' : ''}`}
          aria-label="X, 아니다"
          disabled={selected !== null}
          onClick={() => choose(false)}
        >
          <span className="ox-mark" aria-hidden="true">X</span>
          <span className="ox-word" aria-hidden="true">아니다</span>
        </button>
      </div>
      <p className="hint">모르면 찍어도 괜찮아요. 답을 고르면 짧은 해설이 나와요.</p>
    </section>
  );
}

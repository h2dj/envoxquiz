import { describe, expect, it } from 'vitest';
import questions from '../data/questions.json';
import config from '../data/config.json';
import {
  advance,
  answerCurrent,
  createQuiz,
  gradeFor,
  isRestorable,
  phaseOf,
  pickQuestionIds,
  poolForMode,
  validateQuestions,
} from './quiz.js';

const easy = config.modes.find((m) => m.id === 'easy');
const advanced = config.modes.find((m) => m.id === 'advanced');
const byId = new Map(questions.map((q) => [q.id, q]));

// 재현 가능한 난수
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

describe('출제', () => {
  it('쉬움은 1~80번에서, 조금 어려움은 81~150번에서 중복 없이 10문항', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const e = createQuiz(easy, questions, 10, { rng: seeded(seed) }).questionIds;
      const a = createQuiz(advanced, questions, 10, { rng: seeded(seed) }).questionIds;
      expect(new Set(e).size).toBe(10);
      expect(new Set(a).size).toBe(10);
      expect(e.every((id) => id >= 1 && id <= 80)).toBe(true);
      expect(a.every((id) => id >= 81 && id <= 150)).toBe(true);
    }
  });

  it('active=false 문항은 출제되지 않는다', () => {
    const data = questions.map((q) => (q.id <= 75 ? { ...q, active: false } : q));
    for (let seed = 1; seed <= 50; seed++) {
      const ids = createQuiz(easy, data, 10, { rng: seeded(seed) }).questionIds;
      expect(ids.sort((x, y) => x - y)).toEqual([76, 77, 78, 79, 80]);
    }
  });

  it('같은 유사 그룹 문항은 한 회차에 함께 나오지 않는다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      for (const mode of [easy, advanced]) {
        const groups = createQuiz(mode, questions, 10, { rng: seeded(seed) })
          .questionIds.map((id) => byId.get(id).similarGroup)
          .filter(Boolean);
        expect(new Set(groups).size).toBe(groups.length);
      }
    }
  });

  it('후보가 모자라면 유사 그룹 문항으로 채운다', () => {
    const pool = [
      { id: 1, similarGroup: 'a' },
      { id: 2, similarGroup: 'a' },
      { id: 3 },
    ];
    expect(pickQuestionIds(pool, 3, seeded(1)).sort()).toEqual([1, 2, 3]);
  });

  it('poolForMode는 모드의 난이도만 고른다', () => {
    expect(poolForMode(questions, easy)).toHaveLength(80);
    expect(poolForMode(questions, advanced)).toHaveLength(70);
  });
});

describe('채점과 상태 전이', () => {
  const quiz = () => createQuiz(easy, questions, 10, { rng: seeded(7), now: 1 });

  it('문제 → 피드백 → 다음 문제 → … → 결과', () => {
    let s = quiz();
    for (let i = 0; i < 10; i++) {
      expect(phaseOf(s)).toBe('question');
      const q = byId.get(s.questionIds[s.currentIndex]);
      s = answerCurrent(s, q, i % 2 === 0 ? q.answer : !q.answer);
      expect(phaseOf(s)).toBe('feedback');
      s = advance(s, 99);
    }
    expect(phaseOf(s)).toBe('result');
    expect(s.correctCount).toBe(5);
    expect(s.answers).toHaveLength(10);
    expect(s.completedAt).toBe(99);
  });

  it('한 문제에 두 번 답할 수 없다', () => {
    const s0 = quiz();
    const q = byId.get(s0.questionIds[0]);
    const s1 = answerCurrent(s0, q, q.answer);
    expect(answerCurrent(s1, q, !q.answer)).toBe(s1);
  });

  it('연속 정답과 최대 연속 정답을 센다', () => {
    let s = quiz();
    const pattern = [true, true, true, false, true];
    for (const right of pattern) {
      const q = byId.get(s.questionIds[s.currentIndex]);
      s = advance(answerCurrent(s, q, right ? q.answer : !q.answer));
    }
    expect(s.streak).toBe(1);
    expect(s.maxStreak).toBe(3);
  });
});

describe('결과 등급', () => {
  const label = (c, t) => gradeFor(c, t, config.resultLabels).label;
  it('정답률 구간대로 등급을 정한다', () => {
    expect(label(0, 10)).toBe('환경 새싹');
    expect(label(3, 10)).toBe('환경 새싹');
    expect(label(4, 10)).toBe('초록 실천가');
    expect(label(6, 10)).toBe('초록 실천가');
    expect(label(7, 10)).toBe('지구 지킴이');
    expect(label(8, 10)).toBe('지구 지킴이');
    expect(label(9, 10)).toBe('탄소중립 고수');
    expect(label(10, 10)).toBe('탄소중립 고수');
  });
});

describe('이어서 풀기 복구', () => {
  it('정상 상태는 복구한다', () => {
    const s = createQuiz(easy, questions, 10);
    expect(isRestorable(s, byId, config.modes)).toBe(true);
  });

  it('깨졌거나 데이터와 맞지 않는 상태는 버린다', () => {
    const s = createQuiz(easy, questions, 10);
    expect(isRestorable(null, byId, config.modes)).toBe(false);
    expect(isRestorable({ ...s, modeId: 'quick5' }, byId, config.modes)).toBe(false);
    expect(isRestorable({ ...s, questionIds: [...s.questionIds.slice(1), 999] }, byId, config.modes)).toBe(false);
    expect(isRestorable({ ...s, currentIndex: 10 }, byId, config.modes)).toBe(false);
    expect(isRestorable({ ...s, answers: [{}, {}] }, byId, config.modes)).toBe(false);
  });
});

describe('validateQuestions', () => {
  it('정답이 없거나 id가 중복된 문항을 제외한다', () => {
    const base = { level: 'easy', question: 'q', explanation: 'e', active: true };
    const { questions: ok, errors } = validateQuestions([
      { ...base, id: 1, answer: true },
      { ...base, id: 2 },
      { ...base, id: 1, answer: false },
    ]);
    expect(ok.map((q) => q.id)).toEqual([1]);
    expect(errors).toHaveLength(2);
  });
});

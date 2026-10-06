import { describe, expect, it } from 'vitest';
import questions from './questions.json';
import config from './config.json';
import { validateQuestions } from '../lib/quiz.js';

// 원문 PDF 마지막 쪽 '정답 한눈에 보기' 표 (1번부터 10개씩)
const ANSWER_TABLE = [
  'X O O X O X O O X O', 'O X O X O O X O O X', 'O X O X X O X O O X', 'X X O O O O O O X O',
  'X O O O X O X O O X', 'O X O O O O X X X O', 'O X X O O X O X X X', 'O O X X O O X O O O',
  'O X O X O X O O X O', 'X X O O X O O X O X', 'O X O X O O O X O O', 'O X O O O O X O O O',
  'O X O X X X O O O X', 'O O X O X X X O O X', 'O O X O O O O X X O',
].join(' ').split(' ');

describe('questions.json', () => {
  it('150문항, ID 1~150 중복·누락 없음', () => {
    expect(questions).toHaveLength(150);
    expect(questions.map((q) => q.id)).toEqual(Array.from({ length: 150 }, (_, i) => i + 1));
  });

  it('모든 문항이 검증을 통과한다', () => {
    expect(validateQuestions(questions).errors).toEqual([]);
  });

  it('난이도 easy 80 / medium 50 / hard 20, 원문 번호 구간과 일치', () => {
    for (const q of questions) {
      const expected = q.id <= 80 ? 'easy' : q.id <= 130 ? 'medium' : 'hard';
      expect(q.level, `#${q.id}`).toBe(expected);
    }
  });

  it('정답이 원문 정답표와 일치한다', () => {
    expect(ANSWER_TABLE).toHaveLength(150);
    for (const q of questions) {
      expect(q.answer ? 'O' : 'X', `#${q.id}`).toBe(ANSWER_TABLE[q.id - 1]);
    }
  });

  it('source.number가 id와 같다', () => {
    for (const q of questions) expect(q.source.number).toBe(q.id);
  });

  it('문항·해설에 PDF 변환 흔적(O/X 표기, 연속 공백)이 없다', () => {
    for (const q of questions) {
      expect(q.question, `#${q.id}`).not.toMatch(/\(\s*O\s*\/|\s{2,}/);
      expect(q.explanation, `#${q.id}`).not.toMatch(/\s{2,}/);
    }
  });

  it('유사 그룹은 2문항 이상으로 구성된다', () => {
    const counts = {};
    for (const q of questions) if (q.similarGroup) counts[q.similarGroup] = (counts[q.similarGroup] ?? 0) + 1;
    for (const [group, n] of Object.entries(counts)) expect(n, group).toBeGreaterThanOrEqual(2);
  });

  it('각 모드에 출제할 문항이 충분하다', () => {
    for (const mode of config.modes) {
      const pool = questions.filter((q) => q.active && mode.levels.includes(q.level));
      expect(pool.length, mode.id).toBeGreaterThanOrEqual(config.questionCount);
    }
  });
});

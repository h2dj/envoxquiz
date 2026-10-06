export const LEVELS = ['easy', 'medium', 'hard'];

// 앱 시작 시 문항 데이터를 검증하고, 출제에 쓸 수 없는 문항은 제외한다.
export function validateQuestions(raw) {
  const errors = [];
  const seen = new Set();
  const questions = [];
  for (const q of Array.isArray(raw) ? raw : []) {
    const problems = [];
    if (!Number.isInteger(q?.id)) problems.push('id');
    if (!LEVELS.includes(q?.level)) problems.push('level');
    if (typeof q?.question !== 'string' || !q.question.trim()) problems.push('question');
    if (typeof q?.answer !== 'boolean') problems.push('answer');
    if (typeof q?.explanation !== 'string' || !q.explanation.trim()) problems.push('explanation');
    if (typeof q?.active !== 'boolean') problems.push('active');
    if (seen.has(q?.id)) problems.push('duplicate id');
    if (problems.length) {
      errors.push({ id: q?.id, problems });
      continue;
    }
    seen.add(q.id);
    questions.push(q);
  }
  return { questions, errors };
}

export function poolForMode(questions, mode) {
  return questions.filter((q) => q.active && mode.levels.includes(q.level));
}

// Fisher-Yates
export function shuffle(items, rng = Math.random) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 같은 similarGroup 문항은 한 회차에 하나만 뽑는다.
// 후보가 모자랄 때만 건너뛴 문항으로 채운다.
export function pickQuestionIds(pool, count, rng = Math.random) {
  const picked = [];
  const skipped = [];
  const groups = new Set();
  for (const q of shuffle(pool, rng)) {
    if (picked.length === count) break;
    if (q.similarGroup && groups.has(q.similarGroup)) {
      skipped.push(q);
      continue;
    }
    if (q.similarGroup) groups.add(q.similarGroup);
    picked.push(q);
  }
  for (const q of skipped) {
    if (picked.length === count) break;
    picked.push(q);
  }
  if (picked.length < count) {
    console.warn(`[quiz] 요청 ${count}문항 중 ${picked.length}문항만 출제 가능합니다.`);
  }
  return picked.map((q) => q.id);
}

export function createQuiz(mode, questions, count, { rng = Math.random, now = Date.now() } = {}) {
  return {
    modeId: mode.id,
    questionIds: pickQuestionIds(poolForMode(questions, mode), count, rng),
    currentIndex: 0,
    answers: [],
    correctCount: 0,
    streak: 0,
    maxStreak: 0,
    startedAt: now,
    completedAt: null,
  };
}

export function phaseOf(state) {
  if (state.completedAt) return 'result';
  return state.answers.length > state.currentIndex ? 'feedback' : 'question';
}

export function answerCurrent(state, question, selected) {
  if (phaseOf(state) !== 'question' || question.id !== state.questionIds[state.currentIndex]) {
    return state;
  }
  const correct = selected === question.answer;
  const streak = correct ? state.streak + 1 : 0;
  return {
    ...state,
    answers: [...state.answers, { questionId: question.id, selected, correct }],
    correctCount: state.correctCount + (correct ? 1 : 0),
    streak,
    maxStreak: Math.max(state.maxStreak, streak),
  };
}

export function advance(state, now = Date.now()) {
  if (phaseOf(state) !== 'feedback') return state;
  if (state.currentIndex + 1 >= state.questionIds.length) {
    return { ...state, completedAt: now };
  }
  return { ...state, currentIndex: state.currentIndex + 1 };
}

export function gradeFor(correctCount, total, labels) {
  const percent = total ? Math.round((correctCount / total) * 100) : 0;
  const sorted = labels.slice().sort((a, b) => b.minPercent - a.minPercent);
  return { percent, ...(sorted.find((l) => percent >= l.minPercent) ?? sorted[sorted.length - 1]) };
}

// sessionStorage에서 복구한 상태가 현재 데이터와 맞는지 확인한다.
export function isRestorable(state, questionsById, modes) {
  if (!state || typeof state !== 'object') return false;
  if (!modes.some((m) => m.id === state.modeId)) return false;
  if (!Array.isArray(state.questionIds) || !state.questionIds.length) return false;
  if (!state.questionIds.every((id) => questionsById.has(id))) return false;
  if (!Array.isArray(state.answers)) return false;
  if (!Number.isInteger(state.currentIndex)) return false;
  if (state.currentIndex < 0 || state.currentIndex >= state.questionIds.length) return false;
  if (state.answers.length !== state.currentIndex && state.answers.length !== state.currentIndex + 1) {
    return false;
  }
  return true;
}

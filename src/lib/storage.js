const KEY = 'envoxquiz:quiz:v1';

// 새로고침 시 이어서 풀기. 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서도 퀴즈는 동작해야 한다.
export function loadState() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 저장 실패 시 새로고침하면 처음부터 시작한다.
  }
}

export function clearState() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

const COMPLETED_KEY = 'envoxquiz:completed:v1';

// 끝까지 푼 모드 목록. 고난이도 잠금 해제에 쓰며, 진행 상태와 같이 탭을 닫으면 사라진다.
export function loadCompleted() {
  try {
    const list = JSON.parse(sessionStorage.getItem(COMPLETED_KEY) ?? '[]');
    return Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveCompleted(list) {
  try {
    sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(list));
  } catch {
    // 저장 실패 시 새로고침하면 다시 잠긴다.
  }
}

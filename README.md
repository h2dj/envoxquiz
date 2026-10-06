# envoxquiz
탄소중립/환경/제로웨이스트 분야 행사용 OX퀴즈

행사장에서 QR로 들어와 1~3분 안에 풀 수 있는 모바일 우선 O/X 퀴즈 웹앱이다.
가입 없이 난이도를 골라 10문제를 풀고, 답할 때마다 정답과 해설을 바로 본다.

## 진행 방식

| 선택 | 출제 범위 | 문항 수 |
|---|---|---|
| 🌱 쉬움 | 원문 하 (1~80번) | 10 |
| 🌳 조금 어려움 | 원문 중·상 (81~150번) | 10 |

- 선택한 범위의 `active: true` 문항에서 중복 없이 랜덤으로 뽑는다 (Fisher-Yates).
- 같은 `similarGroup` 문항은 한 회차에 하나만 나온다.
- 진행 상태는 sessionStorage에 저장되어 새로고침해도 이어서 푼다. 탭을 닫으면 처음부터 시작한다.
- 결과 등급은 정답률로 정한다: 0~39% 환경 새싹 · 40~69% 초록 실천가 · 70~89% 지구 지킴이 · 90~100% 탄소중립 고수.

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # 데이터 검증 + 퀴즈 로직 테스트
npm run build    # dist/ 에 정적 파일 생성
```

Vite + React 정적 앱이라 백엔드가 없다. Vercel에 저장소를 연결하면 Vite 프로젝트로 자동 인식되어
`npm run build` 결과(`dist/`)가 배포된다.

## 운영자가 바꾸는 파일

코드를 고치지 않고 아래 두 파일만 수정해 다시 배포하면 된다.

### `src/data/questions.json` — 문제은행 150문항

| 필드 | 설명 |
|---|---|
| `id` | 원문 문제 번호 (1~150) |
| `level` | `easy`(1~80) / `medium`(81~130) / `hard`(131~150) |
| `question`, `explanation` | 원문 문항과 해설 |
| `answer` | O=`true`, X=`false` |
| `active` | `false`로 바꾸면 출제에서 빠진다 |
| `similarGroup` | 비슷한 개념 문항 묶음 (선택) |
| `source.number` | 원문 번호 추적 |

원문과 다르게 고친 내용은 [`docs/content-changes.md`](docs/content-changes.md)에 기록한다.
`npm test`가 150문항 개수, ID, 난이도 구간, 원문 정답표와의 일치를 자동으로 확인한다.

### `src/data/config.json` — 행사 설정

- `title`, `subtitle`: 홈 화면 문구
- `eventName`, `logoUrl`: 값을 넣으면 화면 하단에 행사명·로고가 표시된다 (로고 파일은 `public/`에 넣고 `/logo.png`처럼 지정)
- `questionCount`: 한 회차 문항 수 (기본 10)
- `modes`: 난이도 선택지와 출제 범위(`levels`)
- `resultLabels`: 결과 등급 이름, 기준 정답률, 메시지

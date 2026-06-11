# The Hunters TODAY QUEST

정적 웹앱으로 구현된 `TODAY QUEST + Hunter Match` 초기 버전입니다.

## 실행

```bash
python3 -m http.server 4173
```

- TODAY QUEST: http://127.0.0.1:4173/today/
- Hunter Match: http://127.0.0.1:4173/match/
- 퀴즈 관리자: http://127.0.0.1:4173/admin/

## 퀴즈 운영

프론트는 진입 시 `/api/today-quiz`를 먼저 호출하도록 설계되어 있습니다. API가 실패하면 관리자 화면에서 저장한 localStorage 데이터를 사용하고, 그것도 없으면 `data/todayQuizData.js`의 `fallbackQuizData`를 사용합니다.

시장 데이터형 퀴즈는 코드에 정답을 박제하지 말고 `/api/today-quiz` 또는 관리자 화면으로 매일 갱신하세요. 24시간 이상 지난 데이터는 화면에 `업데이트 필요`로 표시됩니다.

## Backend TODO

- `/api/today-quiz` 서버리스 함수 추가
- OpenDART 또는 KRX 기반 최신 데이터 수집
- API 키는 서버 환경변수로만 보관
- 관리자 퀴즈 저장을 localStorage에서 DB 또는 CMS로 이전
- TODAY QUEST 참여 기록과 Hunter Match 프로필을 회원 DB에 연결

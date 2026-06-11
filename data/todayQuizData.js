export const quizTypes = {
  MARKET_CAP_TOP: "MARKET_CAP_TOP",
  DAILY_GAINER: "DAILY_GAINER",
  DAILY_VOLUME_TOP: "DAILY_VOLUME_TOP",
  DISCLOSURE_RECENT: "DISCLOSURE_RECENT",
  BASIC_FINANCE: "BASIC_FINANCE",
  THE_HUNTERS_INTERNAL: "THE_HUNTERS_INTERNAL",
};

// 운영자가 API 연동 전 하루 1회 교체하는 fallback 데이터입니다.
// 시장 데이터형 퀴즈는 이 파일 또는 관리자 화면에서 최신값으로 관리하세요.
export const fallbackQuizData = {
  id: "manual-2026-06-11-basic-001",
  date: "2026-06-11",
  type: quizTypes.BASIC_FINANCE,
  question: "PER은 무엇을 의미하나?",
  choices: ["주가수익비율", "배당수익률", "자기자본이익률", "영업이익률"],
  answer: "주가수익비율",
  source: "수동 관리자 입력",
  updatedAt: "2026-06-11T09:00:00+09:00",
};

export const emergencyQuizData = {
  id: "emergency-basic-finance-001",
  date: "2026-06-11",
  type: quizTypes.BASIC_FINANCE,
  question: "ETF는 무엇에 가까운가?",
  choices: ["상장지수펀드", "기업공시", "채권 이자", "외환 수수료"],
  answer: "상장지수펀드",
  source: "기본 금융상식",
  updatedAt: "2026-06-11T09:00:00+09:00",
};

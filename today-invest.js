import { emergencyQuizData, fallbackQuizData, quizTypes } from "./data/todayQuizData.js";

const STORAGE_KEYS = {
  battle: "todayBattleChoice",
  quizAnswer: "todayQuizAnswer",
  quizCorrect: "todayQuizCorrect",
  pick: "todayPick",
  rankingViewed: "universityRankingViewed",
  completed: "todayInvestCompleted",
  completedAt: "todayInvestCompletedAt",
  elapsedTime: "elapsedTime",
  purpose: "hunterMatchPurpose",
  style: "investorStyle",
  stocks: "interestedStocks",
  requestSent: "matchRequestSent",
  adminQuiz: "todayQuizAdminData",
  points: "todayInvestPoints",
  startAt: "todayInvestStartedAt",
};

const app = document.querySelector("#app");

const state = {
  route: normalizeRoute(location.pathname),
  todayStep: 0,
  selected: "",
  feedback: "",
  quiz: null,
  matchStep: 0,
  matchIndex: 0,
  interestedStocks: readJSON(STORAGE_KEYS.stocks, []),
};

const flowCards = ["⚔️ 오늘의 배틀", "🎯 오늘의 퀴즈", "🚀 오늘의 떡상픽", "🏆 대학 랭킹"];
const currentUser = { university: "이화여대" };
const rankings = [
  { school: "서울대", points: 12540 },
  { school: "연세대", points: 11830 },
  { school: "고려대", points: 10920 },
  { school: "이화여대", points: 9870, today: 32 },
];
const matches = [
  {
    score: 92,
    university: "이화여대",
    style: "가치투자",
    stocks: ["엔비디아", "삼성전자", "브로드컴"],
    goal: "리서치센터",
  },
  {
    score: 88,
    university: "연세대",
    style: "성장주",
    stocks: ["테슬라", "네이버", "애플"],
    goal: "기업분석 파트너",
  },
  {
    score: 84,
    university: "고려대",
    style: "ETF",
    stocks: ["삼성전자", "SK하이닉스", "브로드컴"],
    goal: "스터디 팀",
  },
];

function normalizeRoute(path) {
  const cleanPath = path.replace(/\/$/, "");
  if (cleanPath === "/match") return "match";
  if (cleanPath === "/admin") return "admin";
  return "today";
}

function navigate(route) {
  const path = route === "today" ? "/today" : `/${route}`;
  history.pushState({}, "", path);
  state.route = route;
  render();
}

window.addEventListener("popstate", () => {
  state.route = normalizeRoute(location.pathname);
  render();
});

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function save(key, value) {
  if (typeof value === "object") writeJSON(key, value);
  else localStorage.setItem(key, String(value));
}

function isComplete() {
  return localStorage.getItem(STORAGE_KEYS.completed) === "true";
}

function completedCount() {
  return [
    localStorage.getItem(STORAGE_KEYS.battle),
    localStorage.getItem(STORAGE_KEYS.quizAnswer),
    localStorage.getItem(STORAGE_KEYS.pick),
    localStorage.getItem(STORAGE_KEYS.rankingViewed),
  ].filter(Boolean).length;
}

function addPoints(points) {
  const current = Number(localStorage.getItem(STORAGE_KEYS.points) || 0);
  save(STORAGE_KEYS.points, current + points);
}

async function getTodayQuiz() {
  try {
    const response = await fetch("/api/today-quiz", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("quiz api failed");
    const data = await response.json();
    if (!data?.question || !data?.answer || !Array.isArray(data?.choices)) throw new Error("invalid quiz");
    return data;
  } catch {
    const adminQuiz = readJSON(STORAGE_KEYS.adminQuiz, null);
    if (adminQuiz?.question && adminQuiz?.answer) return { ...adminQuiz, source: adminQuiz.source || "관리자 입력" };
    return fallbackQuizData?.question ? fallbackQuizData : emergencyQuizData;
  }
}

function isQuizStale(quiz) {
  const updated = Date.parse(quiz?.updatedAt || "");
  if (!updated) return true;
  return Date.now() - updated > 24 * 60 * 60 * 1000;
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "업데이트 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function screen(content) {
  app.innerHTML = `<main class="app-shell"><section class="screen">${content}</section></main>`;
}

function topbar(progress = `${completedCount()} / 4`) {
  return `
    <div class="topbar">
      <div class="brand">THE HUNTERS</div>
      <div class="progress-pill">${progress}</div>
    </div>
  `;
}

function render() {
  if (state.route === "match") return renderMatch();
  if (state.route === "admin") return renderAdmin();
  return renderToday();
}

function renderToday() {
  if (state.todayStep === 1) return renderBattle();
  if (state.todayStep === 2) return renderQuiz();
  if (state.todayStep === 3) return renderPick();
  if (state.todayStep === 4) return renderRanking();
  if (state.todayStep === 5 || isComplete()) return renderComplete();
  renderHome();
}

function renderHome() {
  const count = completedCount();
  screen(`
    ${topbar(`${count} / 4`)}
    <div class="hero">
      <div class="eyebrow">TODAY INVEST</div>
      <h1>TODAY<br />INVEST</h1>
      <p class="subtitle">20초 안에 오늘의 투자 감각을 남기고 포인트를 받으세요.</p>
    </div>
    <div class="card-grid">
      ${flowCards.map((item, index) => `<div class="feature-card ${index < count ? "done" : ""}"><span>${item}</span><span>${index < count ? "완료" : ""}</span></div>`).join("")}
    </div>
    <div class="card-grid">
      <button class="primary-button" data-action="start">오늘의 투자 시작</button>
      <button class="footer-link" data-action="admin">오늘의 퀴즈 수정</button>
    </div>
  `);
  bind("[data-action='start']", () => {
    save(STORAGE_KEYS.startAt, Date.now());
    state.todayStep = 1;
    render();
  });
  bind("[data-action='admin']", () => navigate("admin"));
}

function renderBattle() {
  screen(`
    ${topbar("0 / 4")}
    <div class="hero">
      <div class="eyebrow">오늘의 배틀</div>
      <h2>오늘 더 강할 종목은?</h2>
    </div>
    <div class="option-list">
      ${["삼성전자", "SK하이닉스"].map((item) => `<button class="option-button" data-choice="${item}">${item}</button>`).join("")}
    </div>
    <div class="feedback ${state.feedback ? "show" : ""}">${state.feedback}</div>
  `);
  bindAll("[data-choice]", (button) => {
    selectAndNext(button, () => {
      save(STORAGE_KEYS.battle, button.dataset.choice);
      addPoints(5);
      state.todayStep = 2;
    }, "참여 +5P");
  });
}

async function renderQuiz() {
  if (!state.quiz) state.quiz = await getTodayQuiz();
  const quiz = state.quiz;
  screen(`
    ${topbar("1 / 4")}
    <div class="hero">
      <div class="eyebrow">오늘의 퀴즈</div>
      <h2>${escapeHTML(quiz.question)}</h2>
    </div>
    <div class="option-list">
      ${quiz.choices.map((item) => `<button class="option-button" data-choice="${escapeHTML(item)}">${escapeHTML(item)}</button>`).join("")}
    </div>
    <div class="feedback ${state.feedback ? "show" : ""}">${state.feedback}</div>
    <div class="quiz-meta">
      <span>업데이트: ${formatUpdatedAt(quiz.updatedAt)}</span>
      <span class="${isQuizStale(quiz) ? "stale" : ""}">${isQuizStale(quiz) ? "업데이트 필요" : quiz.source}</span>
    </div>
  `);
  bindAll("[data-choice]", (button) => {
    const answer = button.dataset.choice;
    const correct = answer === quiz.answer;
    selectAndNext(button, () => {
      save(STORAGE_KEYS.quizAnswer, answer);
      save(STORAGE_KEYS.quizCorrect, correct);
      addPoints(correct ? 10 : 3);
      state.todayStep = 3;
    }, correct ? "정답 +10P" : "아쉽다");
  });
}

function renderPick() {
  screen(`
    ${topbar("2 / 4")}
    <div class="hero">
      <div class="eyebrow">오늘의 떡상픽</div>
      <h2>다음 주 가장 기대되는 종목은?</h2>
    </div>
    <div class="option-list">
      ${["엔비디아", "테슬라", "삼성전자"].map((item) => `<button class="option-button" data-choice="${item}">${item}</button>`).join("")}
      <button class="option-button" data-action="custom-pick">직접 입력</button>
    </div>
    <div id="customPick"></div>
    <div class="feedback ${state.feedback ? "show" : ""}">${state.feedback}</div>
  `);
  bindAll("[data-choice]", (button) => {
    selectAndNext(button, () => {
      save(STORAGE_KEYS.pick, button.dataset.choice);
      addPoints(5);
      state.todayStep = 4;
    }, "픽 저장 +5P");
  });
  bind("[data-action='custom-pick']", () => {
    document.querySelector("#customPick").innerHTML = `
      <form class="input-wrap" data-form="custom-pick">
        <input class="text-input" name="pick" placeholder="종목명 입력" autocomplete="off" autofocus />
        <button class="primary-button">확인</button>
      </form>
    `;
    document.querySelector("[name='pick']").focus();
    bind("[data-form='custom-pick']", (event) => {
      event.preventDefault();
      const value = new FormData(event.currentTarget).get("pick").trim();
      if (!value) return;
      save(STORAGE_KEYS.pick, value);
      addPoints(5);
      state.feedback = "픽 저장 +5P";
      render();
      window.setTimeout(() => {
        state.feedback = "";
        state.todayStep = 4;
        render();
      }, 300);
    }, "submit");
  });
}

function renderRanking() {
  screen(`
    ${topbar("3 / 4")}
    <div class="hero">
      <div class="eyebrow">대학 랭킹</div>
      <h2>오늘 학교 기여도</h2>
    </div>
    <div class="ranking-list">
      ${rankings.map((rank, index) => `
        <div class="ranking-card ${rank.school === currentUser.university ? "current" : ""}">
          <div>
            <div class="rank-title">${index + 1}위 ${rank.school}</div>
            ${rank.today ? `<div class="muted">${rank.school} 현재 ${index + 1}위, 오늘 +${rank.today}P</div>` : ""}
          </div>
          <div class="rank-points">${rank.points.toLocaleString()}P</div>
        </div>
      `).join("")}
    </div>
    <button class="primary-button" data-action="finish">완료하기</button>
  `);
  window.setTimeout(() => {
    const button = document.querySelector("[data-action='finish']");
    if (button) button.style.opacity = "1";
  }, 1200);
  bind("[data-action='finish']", () => {
    save(STORAGE_KEYS.rankingViewed, "true");
    addPoints(2);
    addPoints(10);
    save(STORAGE_KEYS.completed, "true");
    save(STORAGE_KEYS.completedAt, new Date().toISOString());
    const startedAt = Number(localStorage.getItem(STORAGE_KEYS.startAt) || Date.now());
    save(STORAGE_KEYS.elapsedTime, Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
    state.todayStep = 5;
    render();
  });
}

function renderComplete() {
  const elapsed = localStorage.getItem(STORAGE_KEYS.elapsedTime) || "20";
  const points = localStorage.getItem(STORAGE_KEYS.points) || "0";
  screen(`
    ${topbar("4 / 4")}
    <div class="hero">
      <div class="eyebrow">COMPLETE</div>
      <h2>오늘의 투자 완료</h2>
      <p class="subtitle">Hunter Match에서 투자 친구까지 바로 찾아보세요.</p>
    </div>
    <div class="result-grid">
      <div class="stat-card"><div class="stat-label">소요시간</div><div class="stat-value">${elapsed}초</div></div>
      <div class="stat-card"><div class="stat-label">오늘 참여자</div><div class="stat-value">1,284명</div></div>
      <div class="stat-card"><div class="stat-label">획득 포인트</div><div class="stat-value">+${points}P</div></div>
      <div class="stat-card"><div class="stat-label">학교 기여</div><div class="stat-value">+32P</div></div>
    </div>
    <div class="button-row">
      <button class="primary-button" data-action="match">투자 친구 찾기</button>
      <button class="secondary-button" data-action="exit">종료</button>
    </div>
  `);
  bind("[data-action='match']", () => navigate("match"));
  bind("[data-action='exit']", () => {
    state.todayStep = 0;
    renderHome();
  });
}

function renderMatch() {
  if (state.matchStep === 1) return renderStyle();
  if (state.matchStep === 2) return renderStocks();
  if (state.matchStep === 3) return renderMatchResult();
  renderPurpose();
}

function renderPurpose() {
  screen(`
    ${topbar("Hunter Match")}
    <div class="hero">
      <div class="eyebrow">HUNTER MATCH</div>
      <h2>어떤 투자 친구를 찾고 있나?</h2>
    </div>
    <div class="option-list">
      ${["투자 친구", "스터디 팀원", "취준 동료", "기업분석 파트너"].map((item) => `<button class="option-button" data-choice="${item}">${item}</button>`).join("")}
    </div>
  `);
  bindAll("[data-choice]", (button) => {
    selectAndNext(button, () => {
      save(STORAGE_KEYS.purpose, button.dataset.choice);
      state.matchStep = 1;
    }, "저장");
  });
}

function renderStyle() {
  screen(`
    ${topbar("Hunter Match")}
    <div class="hero">
      <div class="eyebrow">투자 성향</div>
      <h2>투자 성향은?</h2>
    </div>
    <div class="option-list">
      ${["가치투자", "성장주", "ETF", "배당", "단타", "퀀트", "아직 모름"].map((item) => `<button class="option-button compact" data-choice="${item}">${item}</button>`).join("")}
    </div>
  `);
  bindAll("[data-choice]", (button) => {
    selectAndNext(button, () => {
      save(STORAGE_KEYS.style, button.dataset.choice);
      state.matchStep = 2;
    }, "저장");
  });
}

function renderStocks() {
  const stocks = ["삼성전자", "SK하이닉스", "네이버", "카카오", "엔비디아", "테슬라", "애플", "브로드컴"];
  screen(`
    ${topbar(`${state.interestedStocks.length} / 3`)}
    <div class="hero">
      <div class="eyebrow">관심 종목</div>
      <h2>관심 종목 3개를 골라줘</h2>
    </div>
    <div class="option-list">
      ${stocks.map((item) => `<button class="option-button compact ${state.interestedStocks.includes(item) ? "selected" : ""}" data-stock="${item}">${item}</button>`).join("")}
      <button class="option-button compact" data-action="custom-stock">직접 입력</button>
    </div>
    <div id="customStock"></div>
  `);
  bindAll("[data-stock]", (button) => toggleStock(button.dataset.stock));
  bind("[data-action='custom-stock']", () => {
    document.querySelector("#customStock").innerHTML = `
      <form class="input-wrap" data-form="custom-stock">
        <input class="text-input" name="stock" placeholder="종목명 입력" autocomplete="off" autofocus />
      </form>
    `;
    document.querySelector("[name='stock']").focus();
    bind("[data-form='custom-stock']", (event) => {
      event.preventDefault();
      const value = new FormData(event.currentTarget).get("stock").trim();
      if (value) toggleStock(value);
    }, "submit");
  });
}

function toggleStock(stock) {
  const exists = state.interestedStocks.includes(stock);
  if (exists) state.interestedStocks = state.interestedStocks.filter((item) => item !== stock);
  else if (state.interestedStocks.length < 3) state.interestedStocks = [...state.interestedStocks, stock];
  save(STORAGE_KEYS.stocks, state.interestedStocks);
  if (state.interestedStocks.length === 3) {
    addPoints(20);
    window.setTimeout(() => {
      state.matchStep = 3;
      render();
    }, 300);
  } else {
    render();
  }
}

function renderMatchResult() {
  const match = matches[state.matchIndex % matches.length];
  const sent = localStorage.getItem(STORAGE_KEYS.requestSent) === "true";
  screen(`
    ${topbar("Match Result")}
    <div class="hero">
      <div class="eyebrow">추천 매칭</div>
      <h2>잘 맞는 헌터를 찾았어요</h2>
    </div>
    <div class="match-card">
      <div class="match-score">${match.score}% 일치</div>
      <div class="match-line"><span>학교</span><strong>${match.university}</strong></div>
      <div class="match-line"><span>성향</span><strong>${match.style}</strong></div>
      <div class="match-line"><span>관심종목</span><strong>${match.stocks.join(", ")}</strong></div>
      <div class="match-line"><span>목표</span><strong>${match.goal}</strong></div>
    </div>
    <div class="notice-card">${sent ? "신청이 전달되었습니다" : "대화 신청을 보내거나 다음 사람을 볼 수 있어요."}</div>
    <div class="button-row">
      <button class="primary-button" data-action="send">대화 신청</button>
      <button class="secondary-button" data-action="next">다음 사람 보기</button>
    </div>
  `);
  bind("[data-action='send']", () => {
    save(STORAGE_KEYS.requestSent, "true");
    renderMatchResult();
  });
  bind("[data-action='next']", () => {
    state.matchIndex += 1;
    save(STORAGE_KEYS.requestSent, "false");
    renderMatchResult();
  });
}

function renderAdmin() {
  const quiz = readJSON(STORAGE_KEYS.adminQuiz, fallbackQuizData);
  screen(`
    ${topbar("Admin")}
    <div class="hero">
      <div class="eyebrow">관리자</div>
      <h2>오늘의 퀴즈 수정</h2>
      <p class="subtitle">API 키 없이도 운영자가 최신 퀴즈로 교체할 수 있습니다.</p>
    </div>
    <form class="admin-panel" data-form="admin-quiz">
      <h3>퀴즈 데이터</h3>
      <input class="admin-input" name="id" value="${escapeAttribute(quiz.id)}" placeholder="id" />
      <input class="admin-input" name="date" value="${escapeAttribute(quiz.date)}" placeholder="YYYY-MM-DD" />
      <select class="admin-input" name="type">
        ${Object.values(quizTypes).map((type) => `<option ${quiz.type === type ? "selected" : ""}>${type}</option>`).join("")}
      </select>
      <textarea class="admin-textarea" name="question" placeholder="질문">${escapeHTML(quiz.question)}</textarea>
      <input class="admin-input" name="choices" value="${escapeAttribute(quiz.choices.join(", "))}" placeholder="선택지 쉼표 구분" />
      <input class="admin-input" name="answer" value="${escapeAttribute(quiz.answer)}" placeholder="정답" />
      <input class="admin-input" name="source" value="${escapeAttribute(quiz.source)}" placeholder="출처" />
      <input class="admin-input" name="updatedAt" value="${escapeAttribute(new Date().toISOString())}" placeholder="updatedAt" />
      <button class="primary-button">저장</button>
    </form>
    <button class="secondary-button" data-action="today">TODAY INVEST로</button>
  `);
  bind("[data-form='admin-quiz']", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextQuiz = {
      id: form.get("id").trim(),
      date: form.get("date").trim(),
      type: form.get("type"),
      question: form.get("question").trim(),
      choices: form.get("choices").split(",").map((item) => item.trim()).filter(Boolean),
      answer: form.get("answer").trim(),
      source: form.get("source").trim() || "관리자 입력",
      updatedAt: form.get("updatedAt").trim() || new Date().toISOString(),
    };
    save(STORAGE_KEYS.adminQuiz, nextQuiz);
    state.quiz = nextQuiz;
    navigate("today");
  }, "submit");
  bind("[data-action='today']", () => navigate("today"));
}

function selectAndNext(button, commit, message) {
  button.classList.add("selected");
  state.feedback = message;
  const feedback = document.querySelector(".feedback");
  if (feedback) {
    feedback.textContent = message;
    feedback.classList.add("show");
  }
  window.setTimeout(() => {
    state.feedback = "";
    commit();
    render();
  }, 300);
}

function bind(selector, handler, event = "click") {
  const element = document.querySelector(selector);
  if (element) element.addEventListener(event, handler);
}

function bindAll(selector, handler) {
  document.querySelectorAll(selector).forEach((element) => {
    element.addEventListener("click", () => handler(element));
  });
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function escapeAttribute(value = "") {
  return escapeHTML(value).replace(/`/g, "&#096;");
}

if (location.pathname === "/") history.replaceState({}, "", "/today");
render();

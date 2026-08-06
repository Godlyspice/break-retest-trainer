"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasSupabase, supabase } from "@/lib/supabase-browser";

type Role = "user" | "moderator" | "admin" | "owner";
type Tab = "train" | "daily" | "mistakes" | "achievements" | "leaderboard" | "ai" | "profile" | "settings" | "admin";
type Candle = { open: number; high: number; low: number; close: number };
type Scenario = {
  id: string;
  setup: "bull_retest" | "bear_retest" | "bull_fakeout" | "bear_fakeout" | "chop";
  answer: "buy" | "sell" | "wait";
  level: number;
  candles: Candle[];
  xp: number;
};

const demoLeaders = [
  { name: "CandleKnight", xp: 4820, streak: 18 },
  { name: "MESMaster", xp: 4390, streak: 12 },
  { name: "RetestRanger", xp: 4010, streak: 9 },
  { name: "BreakoutScout", xp: 3660, streak: 14 },
  { name: "Demo Trader", xp: 1240, streak: 3 }
];


const achievementCatalog = [
  { id: "first_correct", title: "First Confirmation", description: "Get your first scenario correct.", icon: "✓", requirement: 1 },
  { id: "fakeout_finder", title: "Fakeout Finder", description: "Correctly identify 10 failed breaks.", icon: "↩", requirement: 10 },
  { id: "retest_rookie", title: "Retest Rookie", description: "Complete 25 scenarios.", icon: "R", requirement: 25 },
  { id: "retest_master", title: "Retest Master", description: "Complete 100 scenarios.", icon: "M", requirement: 100 },
  { id: "streak_7", title: "Seven-Day Discipline", description: "Reach a 7-day challenge streak.", icon: "🔥", requirement: 7 },
  { id: "patient_trader", title: "Patience Pays", description: "Choose Wait correctly 20 times.", icon: "⏳", requirement: 20 }
];

const practiceModes = [
  { id: "mixed", label: "Main Mode", description: "All break-and-retest situations mixed together." },
  { id: "weakness", label: "Practice Weakness", description: "Focus on the setup type you miss most." },
  { id: "clean", label: "Clean Retests", description: "Optional focused practice for clear confirmations." },
  { id: "fakeouts", label: "Fakeouts", description: "Optional focused practice for failed breaks." },
  { id: "wait", label: "No-Trade", description: "Optional patience and invalid-setup practice." }
];


function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}


function playTone(enabled: boolean, positive: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audio = new AudioContextCtor();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = positive ? 660 : 180;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.24);
    oscillator.addEventListener("ended", () => audio.close());
  } catch {
    // Audio is optional and may be blocked by browser settings.
  }
}

function generateScenario(daily = false, mode = "mixed"): Scenario {
  const modePools: Record<string, Scenario["setup"][]> = {
    mixed: ["bull_retest", "bear_retest", "bull_fakeout", "bear_fakeout", "chop"],
    clean: ["bull_retest", "bear_retest"],
    fakeouts: ["bull_fakeout", "bear_fakeout"],
    wait: ["bull_fakeout", "bear_fakeout", "chop"],
    weakness: ["bull_fakeout", "bear_fakeout", "chop"]
  };
  const pool = daily
    ? (["bull_retest", "bear_retest", "bull_fakeout", "bear_fakeout", "chop"] as Scenario["setup"][])
    : modePools[mode] || modePools.mixed;
  const setup = pool[daily ? new Date().getDate() % pool.length : Math.floor(Math.random() * pool.length)];

  const level = Math.round(random(5200, 5600) * 4) / 4;
  const candles: Candle[] = [];
  let price = level + random(-7, 7);

  const add = (close: number, volatility = 1) => {
    const open = price;
    const wick = random(0.35, 2.4) * volatility;
    candles.push({
      open,
      close,
      high: Math.max(open, close) + random(0.2, wick),
      low: Math.min(open, close) - random(0.2, wick)
    });
    price = close;
  };

  for (let i = 0; i < 28; i++) {
    add(price + (level - price) * 0.08 + random(-1.6, 1.6));
  }

  if (setup === "bull_retest") {
    add(level + 4.5, 1.5);
    add(level + 1.1);
    add(level + 2.4);
    add(level + 4.2);
  } else if (setup === "bear_retest") {
    add(level - 4.5, 1.5);
    add(level - 1.1);
    add(level - 2.4);
    add(level - 4.2);
  } else if (setup === "bull_fakeout") {
    add(level + 3.2, 1.5);
    add(level - 1.2, 1.4);
    add(level - 3.2);
  } else if (setup === "bear_fakeout") {
    add(level - 3.2, 1.5);
    add(level + 1.2, 1.4);
    add(level + 3.2);
  } else {
    for (let i = 0; i < 5; i++) add(level + random(-1.4, 1.4));
  }

  return {
    id: crypto.randomUUID(),
    setup,
    answer: setup === "bull_retest" ? "buy" : setup === "bear_retest" ? "sell" : "wait",
    level,
    candles,
    xp: daily ? 150 : 40
  };
}

function Chart({
  scenario,
  reveal,
  choice
}: {
  scenario: Scenario;
  reveal: boolean;
  choice: string | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;

      ctx.fillStyle = "#0a0f15";
      ctx.fillRect(0, 0, w, h);

      const pad = { l: 54, r: reveal ? 190 : 26, t: 22, b: 34 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;
      const values = scenario.candles.flatMap(c => [c.high, c.low]).concat(scenario.level);
      let min = Math.min(...values);
      let max = Math.max(...values);
      const extra = (max - min) * 0.12;
      min -= extra;
      max += extra;
      const y = (v: number) => pad.t + ((max - v) / (max - min)) * plotH;
      const step = plotW / scenario.candles.length;

      ctx.strokeStyle = "#1d2630";
      ctx.fillStyle = "#7d8996";
      ctx.font = "11px system-ui";
      for (let i = 0; i <= 6; i++) {
        const yy = pad.t + (plotH * i) / 6;
        ctx.beginPath();
        ctx.moveTo(pad.l, yy);
        ctx.lineTo(w - pad.r, yy);
        ctx.stroke();
        ctx.fillText((max - ((max - min) * i) / 6).toFixed(2), 5, yy + 4);
      }

      const levelY = y(scenario.level);
      ctx.setLineDash([7, 5]);
      ctx.strokeStyle = "#398bea";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, levelY);
      ctx.lineTo(w - pad.r, levelY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#65a7f1";
      ctx.fillText(`KEY LEVEL ${scenario.level.toFixed(2)}`, pad.l + 8, levelY - 7);

      scenario.candles.forEach((c, i) => {
        const x = pad.l + i * step + step / 2;
        const up = c.close >= c.open;
        ctx.strokeStyle = up ? "#1bb386" : "#dd5669";
        ctx.fillStyle = up ? "#1bb386" : "#dd5669";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y(c.high));
        ctx.lineTo(x, y(c.low));
        ctx.stroke();
        const top = y(Math.max(c.open, c.close));
        const bottom = y(Math.min(c.open, c.close));
        ctx.fillRect(x - step * 0.27, top, step * 0.54, Math.max(2, bottom - top));
      });

      if (reveal) {
        const last = scenario.candles.length - 1;
        const anchors =
          scenario.setup === "bull_retest"
            ? [
                { i: last - 3, v: scenario.candles[last - 3].high, t: "1  Breakout close", c: "#398bea" },
                { i: last - 2, v: scenario.level, t: "2  Retest holds", c: "#d9a63c" },
                { i: last, v: scenario.candles[last].close, t: "3  Bull confirmation", c: "#1bb386" }
              ]
            : scenario.setup === "bear_retest"
            ? [
                { i: last - 3, v: scenario.candles[last - 3].low, t: "1  Breakdown close", c: "#398bea" },
                { i: last - 2, v: scenario.level, t: "2  Retest rejects", c: "#d9a63c" },
                { i: last, v: scenario.candles[last].close, t: "3  Bear confirmation", c: "#dd5669" }
              ]
            : scenario.setup === "bull_fakeout"
            ? [
                { i: last - 2, v: scenario.candles[last - 2].high, t: "1  Brief break above", c: "#d9a63c" },
                { i: last - 1, v: scenario.candles[last - 1].close, t: "2  Closes below level", c: "#dd5669" }
              ]
            : scenario.setup === "bear_fakeout"
            ? [
                { i: last - 2, v: scenario.candles[last - 2].low, t: "1  Brief break below", c: "#d9a63c" },
                { i: last - 1, v: scenario.candles[last - 1].close, t: "2  Reclaims level", c: "#1bb386" }
              ]
            : [{ i: last - 2, v: scenario.level, t: "No clean confirmation", c: "#d9a63c" }];

        // Labels use dedicated lanes in the right margin, preventing overlap and clipping.
        anchors.forEach((a, index) => {
          const x1 = pad.l + a.i * step + step / 2;
          const y1 = y(a.v);
          const laneY = 48 + index * 56;
          const elbowX = w - pad.r + 24;
          const labelX = w - pad.r + 34;

          ctx.strokeStyle = a.c;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(elbowX, y1);
          ctx.lineTo(elbowX, laneY);
          ctx.lineTo(labelX - 6, laneY);
          ctx.stroke();

          ctx.fillStyle = a.c;
          ctx.beginPath();
          ctx.arc(x1, y1, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#111a23";
          ctx.strokeStyle = a.c;
          ctx.fillRect(labelX, laneY - 15, 145, 30);
          ctx.strokeRect(labelX, laneY - 15, 145, 30);
          ctx.fillStyle = "#e9eef4";
          ctx.font = "12px system-ui";
          ctx.fillText(a.t, labelX + 8, laneY + 4);
        });

        ctx.fillStyle = choice === scenario.answer ? "#1bb386" : "#dd5669";
        ctx.font = "600 13px system-ui";
        ctx.fillText(
          choice === scenario.answer ? "YOUR DECISION: CORRECT" : `BEST DECISION: ${scenario.answer.toUpperCase()}`,
          pad.l,
          16
        );
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [scenario, reveal, choice]);

  return <canvas ref={ref} className="chart" aria-label="Synthetic MES candlestick training chart" />;
}

export default function FuturesAcademy() {
  const [tab, setTab] = useState<Tab>("train");
  const [scenario, setScenario] = useState(() => generateScenario());
  const [dailyScenario] = useState(() => generateScenario(true));
  const [choice, setChoice] = useState<"buy" | "sell" | "wait" | null>(null);
  const [reveal, setReveal] = useState(false);
  const [xp, setXp] = useState(1240);
  const [streak, setStreak] = useState(3);
  const [role, setRole] = useState<Role>("owner");
  const [premium, setPremium] = useState(true);
  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("Ask about breakouts, retests, risk, or a scenario you just completed.");
  const [aiLoading, setAiLoading] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [correctWaits, setCorrectWaits] = useState(0);
  const [fakeoutsFound, setFakeoutsFound] = useState(0);
  const [mistakes, setMistakes] = useState<Array<{ scenario: Scenario; selected: string; createdAt: string }>>([]);
  const [selectedMistake, setSelectedMistake] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [practiceMode, setPracticeMode] = useState("mixed");
  const [users, setUsers] = useState([
    { id: "1", email: "owner@example.com", role: "owner" as Role, premium: true, xp: 1240 },
    { id: "2", email: "student@example.com", role: "user" as Role, premium: false, xp: 680 },
    { id: "3", email: "coach@example.com", role: "moderator" as Role, premium: true, xp: 1910 }
  ]);

  const level = Math.floor(xp / 500) + 1;
  const accuracy = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const unlockedAchievements = achievementCatalog.filter(item =>
    item.id === "first_correct" ? correctAttempts >= 1 :
    item.id === "fakeout_finder" ? fakeoutsFound >= item.requirement :
    item.id === "retest_rookie" ? totalAttempts >= item.requirement :
    item.id === "retest_master" ? totalAttempts >= item.requirement :
    item.id === "streak_7" ? streak >= item.requirement :
    correctWaits >= item.requirement
  );
  const canAdmin = role === "owner" || role === "admin";

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.email) setEmail(data.session.user.email);
    });
  }, []);

  async function auth(mode: "signin" | "signup") {
    if (!supabase) {
      setAuthMessage("Demo mode is active. Add Supabase environment variables to enable real accounts.");
      return;
    }
    const action =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });
    const { error } = await action;
    setAuthMessage(error ? error.message : mode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Signed in.");
  }

  async function submitAnswer(activeScenario = scenario, daily = false) {
    if (!choice) return;
    setReveal(true);
    setTotalAttempts(v => v + 1);
    const correct = choice === activeScenario.answer;
    playTone(soundEnabled, correct);

    if (correct) {
      setCorrectAttempts(v => v + 1);
      if (choice === "wait") setCorrectWaits(v => v + 1);
      if (activeScenario.setup.includes("fakeout")) setFakeoutsFound(v => v + 1);
      setXp(v => v + activeScenario.xp);
      setStreak(v => v + 1);
      setShowCelebration(true);
      window.setTimeout(() => setShowCelebration(false), reducedMotion ? 250 : 1100);
    } else {
      setStreak(0);
      setMistakes(current => [
        { scenario: activeScenario, selected: choice, createdAt: new Date().toISOString() },
        ...current
      ]);
    }

    if (supabase) {
      await supabase.from("attempts").insert({
        scenario_type: activeScenario.setup,
        answer: choice,
        correct,
        xp_awarded: correct ? activeScenario.xp : 0,
        is_daily: daily,
        mistake_reason: correct ? null : `Selected ${choice}; best answer was ${activeScenario.answer}`
      });
    }
  }

  function nextScenario() {
    setScenario(generateScenario(false, practiceMode));
    setChoice(null);
    setReveal(false);
  }

  function changePracticeMode(mode: string) {
    setPracticeMode(mode);
    setScenario(generateScenario(false, mode));
    setChoice(null);
    setReveal(false);
  }

  async function askAi() {
    if (!question.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: `${scenario.setup}; key level ${scenario.level}; best answer ${scenario.answer}`
        })
      });
      const data = await response.json();
      setAiAnswer(data.answer || data.error || "No response.");
    } catch {
      setAiAnswer("The tutor could not connect.");
    } finally {
      setAiLoading(false);
    }
  }

  function updateUser(id: string, patch: Partial<(typeof users)[number]>) {
    setUsers(current => current.map(user => (user.id === id ? { ...user, ...patch } : user)));
  }

  const content = useMemo(() => {
    if (tab === "train") {
      return (
        <section className={`workspace ${showCelebration ? "celebrate" : ""}`}>
          {showCelebration && <div className="xp-pop">+{scenario.xp} XP</div>}
          <div className="chart-panel">
            <div className="instrument-bar">
              <div><strong>MES</strong><span>Micro E-mini S&amp;P 500 · Synthetic replay</span></div>
              <div className="mode-control">
                <label htmlFor="practiceMode">Practice mode</label>
                <select id="practiceMode" value={practiceMode} onChange={e => changePracticeMode(e.target.value)}>
                  {practiceModes.map(mode => <option value={mode.id} key={mode.id}>{mode.label}</option>)}
                </select>
              </div>
              <div className="market-chip">{practiceMode === "mixed" ? "MAIN MODE" : "FOCUSED"}</div>
            </div>
            <Chart scenario={scenario} reveal={reveal} choice={choice} />
          </div>
          <aside className="ticket">
            <h2>{practiceMode === "mixed" ? "Main mixed trainer" : "Focused practice"}</h2>
            <p className="mode-description">
              {practiceModes.find(mode => mode.id === practiceMode)?.description}
            </p>
            <div className="quote-grid">
              <div><span>Instrument</span><strong>MES</strong></div>
              <div><span>Quantity</span><strong>1</strong></div>
            </div>
            <p className="label">Your decision</p>
            <div className="decision-grid">
              {(["buy", "sell", "wait"] as const).map(item => (
                <button
                  key={item}
                  className={`decision ${item} ${choice === item ? "active" : ""}`}
                  onClick={() => !reveal && setChoice(item)}
                  type="button"
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="primary" type="button" disabled={!choice || reveal} onClick={() => submitAnswer()}>
              Submit decision
            </button>
            {reveal && (
              <div className={`feedback ${choice === scenario.answer ? "good" : "bad"}`}>
                <strong>{choice === scenario.answer ? "Correct setup read" : `Best answer: ${scenario.answer.toUpperCase()}`}</strong>
                <p>
                  {scenario.setup === "bull_retest"
                    ? "Price closed above resistance, returned to the level, held it as support, and confirmed continuation."
                    : scenario.setup === "bear_retest"
                    ? "Price closed below support, retested from underneath, rejected the level, and confirmed continuation."
                    : scenario.setup.includes("fakeout")
                    ? "Price crossed the level but quickly returned through it. The failed break makes waiting safer."
                    : "Price remained choppy around the level without a clean close, retest, and confirmation sequence."}
                </p>
                <button className="secondary" type="button" onClick={nextScenario}>Next scenario</button>
              </div>
            )}
          </aside>
        </section>
      );
    }

    if (tab === "daily") {
      return (
        <section className="page-section">
          <div className="section-heading">
            <div><span className="eyebrow">Daily challenge</span><h2>One attempt · 150 XP</h2></div>
            <div className="streak">🔥 {streak}-day streak</div>
          </div>
          <div className="challenge-card">
            <Chart scenario={dailyScenario} reveal={reveal} choice={choice} />
            <div className="challenge-actions">
              {(["buy", "sell", "wait"] as const).map(item => (
                <button key={item} className={`decision ${item} ${choice === item ? "active" : ""}`} onClick={() => !reveal && setChoice(item)}>
                  {item.toUpperCase()}
                </button>
              ))}
              <button className="primary" disabled={!choice || reveal} onClick={() => submitAnswer(dailyScenario, true)}>Lock answer</button>
            </div>
          </div>
        </section>
      );
    }


    if (tab === "mistakes") {
      const current = selectedMistake === null ? null : mistakes[selectedMistake];
      return (
        <section className="page-section">
          <div className="section-heading">
            <div><span className="eyebrow">Targeted practice</span><h2>Mistake replay</h2></div>
            <span className="role-badge">{mistakes.length} SAVED</span>
          </div>
          {mistakes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>No mistakes saved yet</h3>
              <p>Incorrect scenarios will automatically appear here for focused review.</p>
            </div>
          ) : (
            <div className="mistake-layout">
              <div className="mistake-list">
                {mistakes.map((item, index) => (
                  <button key={`${item.scenario.id}-${index}`} className={selectedMistake === index ? "active" : ""} onClick={() => setSelectedMistake(index)}>
                    <strong>{item.scenario.setup.replaceAll("_", " ")}</strong>
                    <span>You chose {item.selected.toUpperCase()} · Correct: {item.scenario.answer.toUpperCase()}</span>
                  </button>
                ))}
              </div>
              <div className="mistake-review">
                {current ? (
                  <>
                    <Chart scenario={current.scenario} reveal={true} choice={current.selected} />
                    <div className="feedback bad">
                      <strong>Replay explanation</strong>
                      <p>
                        Review the numbered chart labels in order. The goal is to identify exactly where the setup stopped matching a valid break-and-retest sequence.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="empty-state"><p>Select a saved mistake to review it.</p></div>
                )}
              </div>
            </div>
          )}
        </section>
      );
    }

    if (tab === "achievements") {
      return (
        <section className="page-section">
          <div className="section-heading">
            <div><span className="eyebrow">Progression</span><h2>Achievements</h2></div>
            <span className="role-badge">{unlockedAchievements.length}/{achievementCatalog.length}</span>
          </div>
          <div className="achievement-grid">
            {achievementCatalog.map(item => {
              const unlocked = unlockedAchievements.some(unlockedItem => unlockedItem.id === item.id);
              return (
                <div key={item.id} className={`achievement ${unlocked ? "unlocked" : "locked-achievement"}`}>
                  <div className="achievement-icon">{item.icon}</div>
                  <div><strong>{item.title}</strong><span>{item.description}</span></div>
                  <b>{unlocked ? "UNLOCKED" : "LOCKED"}</b>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (tab === "leaderboard") {
      return (
        <section className="page-section">
          <div className="section-heading"><div><span className="eyebrow">Community</span><h2>Weekly leaderboard</h2></div></div>
          <div className="leaderboard">
            {demoLeaders.map((leader, index) => (
              <div className={`leader ${index < 3 ? "podium" : ""}`} key={leader.name}>
                <span className="rank">#{index + 1}</span>
                <div><strong>{leader.name}</strong><span>{leader.streak}-day streak</span></div>
                <b>{leader.xp.toLocaleString()} XP</b>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (tab === "ai") {
      return (
        <section className="page-section ai-layout">
          <div>
            <span className="eyebrow">AI coach</span>
            <h2>Ask the futures tutor</h2>
            <p className="muted">Educational explanations only. It does not predict guaranteed outcomes or replace risk management.</p>
          </div>
          <div className="ai-card">
            <div className="ai-answer" aria-live="polite">{aiLoading ? "Analyzing your question…" : aiAnswer}</div>
            <label>
              Your question
              <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Why was this a fakeout instead of a valid breakout?" />
            </label>
            <button className="primary" onClick={askAi} disabled={aiLoading}>Ask tutor</button>
          </div>
        </section>
      );
    }

    if (tab === "profile") {
      return (
        <section className="page-section profile-grid">
          <div className="profile-card">
            <div className="avatar">DT</div>
            <h2>Demo Trader</h2>
            <span className="premium-badge">{premium ? "PREMIUM" : "FREE"}</span>
            <div className="profile-stats">
              <div><strong>{level}</strong><span>Level</span></div>
              <div><strong>{xp}</strong><span>Total XP</span></div>
              <div><strong>{streak}</strong><span>Streak</span></div><div><strong>{accuracy}%</strong><span>Accuracy</span></div><div><strong>{mistakes.length}</strong><span>Mistakes saved</span></div>
            </div>
          </div>
          <div className="auth-card">
            <h2>Account access</h2>
            <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" /></label>
            <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" /></label>
            <div className="auth-buttons">
              <button className="primary" onClick={() => auth("signin")}>Sign in</button>
              <button className="secondary" onClick={() => auth("signup")}>Create account</button>
            </div>
            <p className="muted">{authMessage || (hasSupabase ? "Supabase accounts are enabled." : "Demo mode: no database keys configured.")}</p>
          </div>
        </section>
      );
    }


    if (tab === "settings") {
      return (
        <section className="page-section settings-grid">
          <div>
            <span className="eyebrow">Accessibility</span>
            <h2>Game settings</h2>
            <p className="muted">Adjust the training experience without changing scoring.</p>
          </div>
          <div className="settings-card">
            <label className="setting-row">
              <div><strong>Sound effects</strong><span>Correct, incorrect, XP, and level feedback.</span></div>
              <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
            </label>
            <label className="setting-row">
              <div><strong>Reduced motion</strong><span>Shortens celebration and transition effects.</span></div>
              <input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} />
            </label>
            <div className="settings-note">Audio remains optional and can be muted at any time.</div>
          </div>
        </section>
      );
    }

    return (
      <section className="page-section">
        <div className="section-heading">
          <div><span className="eyebrow">Owner controls</span><h2>Private admin dashboard</h2></div>
          <span className="role-badge">{role.toUpperCase()}</span>
        </div>
        {!canAdmin ? (
          <div className="locked">This page is restricted to administrators and the owner.</div>
        ) : (
          <>
            <div className="metric-grid">
              <div className="metric"><span>Total accounts</span><strong>{users.length}</strong></div>
              <div className="metric"><span>Premium users</span><strong>{users.filter(u => u.premium).length}</strong></div>
              <div className="metric"><span>Active this week</span><strong>{users.length}</strong></div>
              <div className="metric"><span>Attempts logged</span><strong>1,284</strong></div>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>User</th><th>XP</th><th>Premium</th><th>Permission</th></tr></thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.xp}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={user.premium}
                          disabled={role !== "owner" && user.role === "owner"}
                          onChange={e => updateUser(user.id, { premium: e.target.checked })}
                        />
                      </td>
                      <td>
                        <select
                          value={user.role}
                          disabled={role !== "owner" || user.role === "owner"}
                          onChange={e => updateUser(user.id, { role: e.target.value as Role })}
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    );
  }, [tab, scenario, dailyScenario, choice, reveal, xp, streak, role, premium, email, password, authMessage, question, aiAnswer, aiLoading, users, canAdmin, level, practiceMode, accuracy, mistakes, selectedMistake, unlockedAchievements, soundEnabled, reducedMotion, showCelebration, totalAttempts]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">FA</span>
          <div><strong>Futures Academy</strong><span>Break · Retest · Master</span></div>
        </div>
        <div className="top-stats">
          <span>LVL {level}</span>
          <div className="xp-track"><i style={{ width: `${(xp % 500) / 5}%` }} /></div>
          <b>{xp.toLocaleString()} XP</b>
        </div>
      </header>
      <nav className="nav">
        {[
          ["train", "Trainer"],
          ["daily", "Daily"],
          ["mistakes", "Mistakes"],
          ["achievements", "Badges"],
          ["leaderboard", "Leaders"],
          ["ai", "AI Coach"],
          ["profile", "Profile"],
          ["settings", "Settings"],
          ["admin", "Admin"]
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id as Tab); setReveal(false); setChoice(null); }}>
            {label}
          </button>
        ))}
      </nav>
      {content}
      <footer>Educational simulation only — synthetic market data, not live trade signals.</footer>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasSupabase, supabase } from "@/lib/supabase-browser";

type Role = "user" | "moderator" | "admin" | "owner";
type Tab = "home" | "train" | "daily" | "career" | "mistakes" | "achievements" | "leaderboard" | "ai" | "profile" | "settings" | "admin";
type Candle = { open: number; high: number; low: number; close: number; volume: number };
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
  {
    id: "mixed",
    label: "Main Simulator",
    short: "MIXED",
    icon: "◆",
    difficulty: "Adaptive",
    reward: "40–100 XP",
    description: "Every break-and-retest situation is mixed together. No hints about what comes next.",
    callout: "Read the chart. Trust the process."
  },
  {
    id: "weakness",
    label: "Weakness Hunt",
    short: "FOCUS",
    icon: "◎",
    difficulty: "Personalized",
    reward: "Bonus XP",
    description: "Targets the scenario types you miss most and saves them to Mistake Replay.",
    callout: "Turn your weakest setup into your strongest."
  },
  {
    id: "clean",
    label: "Confirmation Lab",
    short: "GUIDED",
    icon: "✓",
    difficulty: "Beginner",
    reward: "30 XP",
    description: "Clear bullish and bearish retests with stronger visual guidance and calmer pacing.",
    callout: "Build confidence before increasing difficulty."
  },
  {
    id: "fakeouts",
    label: "Fakeout Arena",
    short: "HARD",
    icon: "↯",
    difficulty: "Advanced",
    reward: "75 XP",
    description: "Failed breaks, traps, and fast reversals. Waiting is often the winning decision.",
    callout: "Do not let the first breakout candle fool you."
  },
  {
    id: "wait",
    label: "Patience Protocol",
    short: "DISCIPLINE",
    icon: "◷",
    difficulty: "Mental",
    reward: "Streak XP",
    description: "Choppy markets and invalid setups designed to train the hardest action: doing nothing.",
    callout: "A skipped bad trade is a successful decision."
  }
];

const careerRanks = [
  { name: "Retail Rookie", min: 0, icon: "I" },
  { name: "Chart Scout", min: 1000, icon: "II" },
  { name: "Retest Specialist", min: 2500, icon: "III" },
  { name: "Prop Candidate", min: 5000, icon: "IV" },
  { name: "Funded Operator", min: 9000, icon: "V" },
  { name: "Market Veteran", min: 15000, icon: "VI" }
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
      low: Math.min(open, close) - random(0.2, wick),
      volume: Math.round(random(180, 1200) * volatility)
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


function HelpTip({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="help-wrap">
      <button
        type="button"
        className="help-button"
        aria-label={`Explain ${title}`}
        aria-expanded={open}
        onClick={event => {
          event.stopPropagation();
          setOpen(value => !value);
        }}
      >
        ?
      </button>
      {open && (
        <span className="help-popover" role="tooltip">
          <strong>{title}</strong>
          <span>{text}</span>
        </span>
      )}
    </span>
  );
}

function Chart({
  scenario,
  reveal,
  choice,
  entryPrice,
  stopPrice,
  targetPrice,
  visibleCandles,
  activePlacement,
  onPlaceLevel,
  onChangeLevel
}: {
  scenario: Scenario;
  reveal: boolean;
  choice: string | null;
  entryPrice?: string;
  stopPrice?: string;
  targetPrice?: string;
  visibleCandles?: number;
  activePlacement?: "entry" | "stop" | "target" | null;
  onPlaceLevel?: (kind: "entry" | "stop" | "target", value: number) => void;
  onChangeLevel?: (kind: "entry" | "stop" | "target", value: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let zoom = 1;
    let crossX: number | null = null;
    let crossY: number | null = null;
    let dragging: "entry" | "stop" | "target" | null = null;
    let dragPreview: { kind: "entry" | "stop" | "target"; value: number } | null = null;

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
      const displayCandles = scenario.candles.slice(0, visibleCandles ?? scenario.candles.length);
      const values = displayCandles.flatMap(c => [c.high, c.low]).concat(scenario.level);
      let min = Math.min(...values);
      let max = Math.max(...values);
      const extra = (max - min) * 0.12;
      min -= extra;
      max += extra;
      const y = (v: number) => pad.t + ((max - v) / (max - min)) * plotH;
      const step = (plotW / Math.max(displayCandles.length, 1)) * zoom;

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

      displayCandles.forEach((c, i) => {
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
        const candleWidth = Math.max(3, Math.min(11, step * 0.54));
        ctx.fillRect(x - candleWidth / 2, top, candleWidth, Math.max(2, bottom - top));
      });

      const volumeHeight = 62;
      const maxVolume = Math.max(...displayCandles.map(c => c.volume), 1);
      displayCandles.forEach((c, i) => {
        const x = pad.l + i * step + step / 2;
        const barH = (c.volume / maxVolume) * volumeHeight;
        ctx.fillStyle = c.close >= c.open ? "rgba(27,179,134,.35)" : "rgba(221,86,105,.35)";
        const volumeWidth = Math.max(3, Math.min(11, step * 0.44));
        ctx.fillRect(x - volumeWidth / 2, h - pad.b - barH, volumeWidth, barH);
      });
      ctx.fillStyle = "#6f7c89";
      ctx.font = "10px system-ui";
      ctx.fillText("VOLUME", pad.l + 4, h - pad.b - volumeHeight - 6);

      const previewValue = (kind: "entry" | "stop" | "target", fallback: number) =>
        dragPreview?.kind === kind ? dragPreview.value : fallback;

      const tradeLevels = [
        { label: "ENTRY", value: previewValue("entry", Number(entryPrice)), color: "#398bea", kind: "entry" as const },
        { label: "STOP", value: previewValue("stop", Number(stopPrice)), color: "#dd5669", kind: "stop" as const },
        { label: "TARGET", value: previewValue("target", Number(targetPrice)), color: "#1bb386", kind: "target" as const }
      ].filter(item => Number.isFinite(item.value));

      const entryLevel = tradeLevels.find(item => item.kind === "entry");
      const stopLevel = tradeLevels.find(item => item.kind === "stop");
      const targetLevel = tradeLevels.find(item => item.kind === "target");

      // Tradovate-style risk/reward zones.
      if (entryLevel && stopLevel) {
        const entryY = y(entryLevel.value);
        const stopY = y(stopLevel.value);
        const top = Math.min(entryY, stopY);
        const zoneHeight = Math.abs(entryY - stopY);
        ctx.fillStyle = "rgba(221, 86, 105, 0.14)";
        ctx.fillRect(pad.l, top, plotW, zoneHeight);

        const bracketX = w - pad.r - 13;
        ctx.strokeStyle = "#dd5669";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bracketX, entryY);
        ctx.lineTo(bracketX, stopY);
        ctx.moveTo(bracketX - 8, entryY);
        ctx.lineTo(bracketX + 1, entryY);
        ctx.moveTo(bracketX - 8, stopY);
        ctx.lineTo(bracketX + 1, stopY);
        ctx.stroke();

        const riskPoints = Math.abs(entryLevel.value - stopLevel.value);
        ctx.fillStyle = "#321820";
        ctx.strokeStyle = "#dd5669";
        const labelY = (entryY + stopY) / 2;
        ctx.fillRect(bracketX - 112, labelY - 17, 94, 34);
        ctx.strokeRect(bracketX - 112, labelY - 17, 94, 34);
        ctx.fillStyle = "#ff9aaa";
        ctx.font = "600 11px system-ui";
        ctx.fillText(`RISK ${riskPoints.toFixed(2)} pts`, bracketX - 105, labelY - 2);
        ctx.font = "10px system-ui";
        ctx.fillText(`$${(riskPoints * 5).toFixed(2)} / MES`, bracketX - 105, labelY + 11);
      }

      if (entryLevel && targetLevel) {
        const entryY = y(entryLevel.value);
        const targetY = y(targetLevel.value);
        const top = Math.min(entryY, targetY);
        const zoneHeight = Math.abs(entryY - targetY);
        ctx.fillStyle = "rgba(27, 179, 134, 0.13)";
        ctx.fillRect(pad.l, top, plotW, zoneHeight);

        const bracketX = w - pad.r - 13;
        ctx.strokeStyle = "#1bb386";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bracketX, entryY);
        ctx.lineTo(bracketX, targetY);
        ctx.moveTo(bracketX - 8, entryY);
        ctx.lineTo(bracketX + 1, entryY);
        ctx.moveTo(bracketX - 8, targetY);
        ctx.lineTo(bracketX + 1, targetY);
        ctx.stroke();

        const rewardPoints = Math.abs(targetLevel.value - entryLevel.value);
        const riskPoints = stopLevel ? Math.abs(entryLevel.value - stopLevel.value) : 0;
        const rr = riskPoints > 0 ? rewardPoints / riskPoints : 0;
        ctx.fillStyle = "#102b23";
        ctx.strokeStyle = "#1bb386";
        const labelY = (entryY + targetY) / 2;
        ctx.fillRect(bracketX - 128, labelY - 23, 110, 46);
        ctx.strokeRect(bracketX - 128, labelY - 23, 110, 46);
        ctx.fillStyle = "#82e7c7";
        ctx.font = "600 11px system-ui";
        ctx.fillText(`REWARD ${rewardPoints.toFixed(2)} pts`, bracketX - 121, labelY - 8);
        ctx.font = "10px system-ui";
        ctx.fillText(`$${(rewardPoints * 5).toFixed(2)} / MES`, bracketX - 121, labelY + 5);
        if (rr > 0) ctx.fillText(`R:R ${rr.toFixed(2)} : 1`, bracketX - 121, labelY + 18);
      }

      // Draw order lines above the shaded zones.
      tradeLevels.forEach(item => {
        const yy = y(item.value);
        ctx.setLineDash(item.kind === "entry" ? [] : [5, 4]);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.kind === "entry" ? 2.2 : 1.7;
        ctx.beginPath();
        ctx.moveTo(pad.l, yy);
        ctx.lineTo(w - pad.r, yy);
        ctx.stroke();
        ctx.setLineDash([]);

        const tagWidth = item.kind === "entry" ? 122 : 132;
        ctx.fillStyle =
          item.kind === "entry" ? "#15304a" :
          item.kind === "stop" ? "#321820" :
          "#102b23";
        ctx.strokeStyle = item.color;
        ctx.fillRect(pad.l + 7, yy - 16, tagWidth, 23);
        ctx.strokeRect(pad.l + 7, yy - 16, tagWidth, 23);
        ctx.fillStyle = item.color;
        ctx.font = "600 11px system-ui";
        ctx.fillText(`${item.label}  ${item.value.toFixed(2)}`, pad.l + 14, yy);
      });

      if (crossX !== null && crossY !== null) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(220,230,240,.35)";
        ctx.beginPath();
        ctx.moveTo(crossX, pad.t);
        ctx.lineTo(crossX, h - pad.b);
        ctx.moveTo(pad.l, crossY);
        ctx.lineTo(w - pad.r, crossY);
        ctx.stroke();
        ctx.setLineDash([]);
        const crossPrice = max - ((crossY - pad.t) / plotH) * (max - min);
        ctx.fillStyle = "#dce5ee";
        ctx.fillText(crossPrice.toFixed(2), w - pad.r - 54, crossY - 5);
      }

      if (activePlacement) {
        ctx.fillStyle = "#d9a63c";
        ctx.font = "600 12px system-ui";
        ctx.fillText(`Tap chart to place ${activePlacement.toUpperCase()}`, pad.l + 8, h - 12);
      }

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

    const getGeometry = () => {
      const rect = canvas.getBoundingClientRect();
      const pad = { l: 54, r: reveal ? 190 : 26, t: 22, b: 34 };
      const displayCandles = scenario.candles.slice(0, visibleCandles ?? scenario.candles.length);
      const values = displayCandles.flatMap(c => [c.high, c.low]).concat(scenario.level);
      let min = Math.min(...values);
      let max = Math.max(...values);
      const extra = (max - min) * 0.12;
      min -= extra;
      max += extra;
      const plotH = rect.height - pad.t - pad.b;
      const priceFromY = (clientY: number) => {
        const localY = clientY - rect.top;
        return max - ((localY - pad.t) / plotH) * (max - min);
      };
      return { rect, pad, priceFromY, min, max };
    };

    const nearestLine = (clientY: number) => {
      const { rect, pad, min, max } = getGeometry();
      const localY = clientY - rect.top;
      const plotH = rect.height - pad.t - pad.b;
      const yFor = (v: number) => pad.t + ((max - v) / (max - min)) * plotH;
      const candidates = [
        { kind: "entry" as const, value: Number(entryPrice) },
        { kind: "stop" as const, value: Number(stopPrice) },
        { kind: "target" as const, value: Number(targetPrice) }
      ].filter(x => Number.isFinite(x.value));
      const match = candidates
        .map(x => ({ ...x, distance: Math.abs(localY - yFor(x.value)) }))
        .sort((a,b) => a.distance - b.distance)[0];
      return match && match.distance < 12 ? match.kind : null;
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      crossX = event.clientX - rect.left;
      crossY = event.clientY - rect.top;
      if (dragging) {
        dragPreview = {
          kind: dragging,
          value: Math.round(getGeometry().priceFromY(event.clientY) * 4) / 4
        };
      }
      draw();
    };

    const onDown = (event: PointerEvent) => {
      if (activePlacement && onPlaceLevel) {
        onPlaceLevel(activePlacement, Math.round(getGeometry().priceFromY(event.clientY) * 4) / 4);
        return;
      }
      dragging = nearestLine(event.clientY);
      if (dragging) {
        const startingValue =
          dragging === "entry" ? Number(entryPrice) :
          dragging === "stop" ? Number(stopPrice) :
          Number(targetPrice);
        dragPreview = { kind: dragging, value: startingValue };
        canvas.setPointerCapture(event.pointerId);
      }
    };

    const onUp = (event: PointerEvent) => {
      if (dragging && dragPreview && onChangeLevel) {
        onChangeLevel(dragging, dragPreview.value);
      }
      dragging = null;
      dragPreview = null;
      try { canvas.releasePointerCapture(event.pointerId); } catch {}
      draw();
    };

    const onLeave = () => {
      if (!dragging) {
        crossX = null;
        crossY = null;
        draw();
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom = Math.min(1.6, Math.max(.65, zoom + (event.deltaY < 0 ? .08 : -.08)));
      draw();
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [scenario, reveal, choice, entryPrice, stopPrice, targetPrice, visibleCandles, activePlacement, onPlaceLevel, onChangeLevel]);

  return <canvas ref={ref} className="chart" aria-label="Synthetic MES candlestick training chart" />;
}

export default function FuturesAcademy() {
  const [tab, setTab] = useState<Tab>("home");
  const [scenario, setScenario] = useState(() => generateScenario());
  const [dailyScenario] = useState(() => generateScenario(true));
  const [choice, setChoice] = useState<"buy" | "sell" | "wait" | null>(null);
  const [entryPrice, setEntryPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [planFeedback, setPlanFeedback] = useState("");
  const [activePlacement, setActivePlacement] = useState<"entry" | "stop" | "target" | null>(null);
  const [visibleCandles, setVisibleCandles] = useState(18);
  const [replayRunning, setReplayRunning] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(700);
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [contracts, setContracts] = useState(1);
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
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(6);
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
  const currentRankIndex = careerRanks.reduce((found, rank, index) => xp >= rank.min ? index : found, 0);
  const currentRank = careerRanks[currentRankIndex];
  const nextRank = careerRanks[currentRankIndex + 1];
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((xp - currentRank.min) / (nextRank.min - currentRank.min)) * 100))
    : 100;
  const currentMode = practiceModes.find(mode => mode.id === practiceMode) || practiceModes[0];
  const dailyProgress = Math.min(10, correctAttempts % 11);
  const canAdmin = role === "owner" || role === "admin";

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.email) setEmail(data.session.user.email);
    });
  }, []);

  useEffect(() => {
    if (!replayRunning) return;
    const timer = window.setInterval(() => {
      setVisibleCandles(current => {
        if (current >= scenario.candles.length) {
          setReplayRunning(false);
          return current;
        }
        return current + 1;
      });
    }, replaySpeed);
    return () => window.clearInterval(timer);
  }, [replayRunning, replaySpeed, scenario.candles.length]);

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

    const entry = Number(entryPrice);
    const stop = Number(stopPrice);
    const target = Number(targetPrice);
    let planMessage = "";

    if (choice === "wait") {
      planMessage = "No entry, stop, or target is required for a Wait decision.";
    } else if (![entry, stop, target].every(Number.isFinite)) {
      planMessage = "Direction submitted, but the trade plan was incomplete.";
    } else {
      const risk = choice === "buy" ? entry - stop : stop - entry;
      const reward = choice === "buy" ? target - entry : entry - target;
      const validSide =
        choice === "buy"
          ? stop < entry && target > entry
          : stop > entry && target < entry;
      const rr = risk > 0 ? reward / risk : 0;

      if (!validSide) {
        planMessage = "The stop and target are on the wrong sides of the entry.";
      } else if (rr < 1) {
        planMessage = `Trade plan is valid, but reward-to-risk is only ${rr.toFixed(1)}:1.`;
      } else if (rr < 2) {
        planMessage = `Trade plan is valid with about ${rr.toFixed(1)}:1 reward-to-risk.`;
      } else {
        planMessage = `Strong trade plan: about ${rr.toFixed(1)}:1 reward-to-risk.`;
      }
    }
    setPlanFeedback(planMessage);

    if (correct) {
      setCorrectAttempts(v => v + 1);
      setCombo(current => {
        const next = current + 1;
        setBestCombo(best => Math.max(best, next));
        return next;
      });
      if (choice === "wait") setCorrectWaits(v => v + 1);
      if (activeScenario.setup.includes("fakeout")) setFakeoutsFound(v => v + 1);
      setXp(v => v + activeScenario.xp);
      setStreak(v => v + 1);
      setShowCelebration(true);
      window.setTimeout(() => setShowCelebration(false), reducedMotion ? 250 : 1100);
    } else {
      setStreak(0);
      setCombo(0);
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
    setEntryPrice("");
    setStopPrice("");
    setTargetPrice("");
    setPlanFeedback("");
    setReveal(false);
  }

  function changePracticeMode(mode: string) {
    setPracticeMode(mode);
    setScenario(generateScenario(false, mode));
    setVisibleCandles(24);
    setReplayRunning(false);
    setChoice(null);
    setEntryPrice("");
    setStopPrice("");
    setTargetPrice("");
    setPlanFeedback("");
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

  const entryNum = Number(entryPrice);
  const stopNum = Number(stopPrice);
  const targetNum = Number(targetPrice);
  const pointValue = 5 * contracts;
  const liveRiskPoints =
    choice === "buy" ? entryNum - stopNum :
    choice === "sell" ? stopNum - entryNum : 0;
  const liveRewardPoints =
    choice === "buy" ? targetNum - entryNum :
    choice === "sell" ? entryNum - targetNum : 0;
  const liveRR = liveRiskPoints > 0 ? liveRewardPoints / liveRiskPoints : 0;
  const estimatedLoss = liveRiskPoints > 0 ? liveRiskPoints * pointValue : 0;
  const estimatedProfit = liveRewardPoints > 0 ? liveRewardPoints * pointValue : 0;

  function setLevel(kind: "entry" | "stop" | "target", value: number) {
    const formatted = value.toFixed(2);
    if (kind === "entry") setEntryPrice(formatted);
    if (kind === "stop") setStopPrice(formatted);
    if (kind === "target") setTargetPrice(formatted);
    setActivePlacement(null);
  }

  function adjustLevel(kind: "entry" | "stop" | "target", amount: number) {
    const current =
      kind === "entry" ? Number(entryPrice) :
      kind === "stop" ? Number(stopPrice) :
      Number(targetPrice);
    const base = Number.isFinite(current) ? current : scenario.candles[Math.min(visibleCandles, scenario.candles.length) - 1]?.close || scenario.level;
    setLevel(kind, Math.round((base + amount) * 4) / 4);
  }

  function resetReplay() {
    setReplayRunning(false);
    setVisibleCandles(18);
    setReveal(false);
    setChoice(null);
    setEntryPrice("");
    setStopPrice("");
    setTargetPrice("");
    setPlanFeedback("");
  }

  const content = useMemo(() => {
    if (tab === "home") {
      return (
        <section className="command-center">
          <div className="hero-panel">
            <div className="hero-copy">
              <span className="hero-kicker">TRADING COMMAND CENTER</span>
              <h1>Welcome back, Trader.</h1>
              <p>Master break-and-retest decisions through missions, replay, and focused review.</p>
              <div className="hero-actions">
                <button className="launch-button" type="button" onClick={() => setTab("train")}>
                  <span>▶</span>
                  <div><strong>Continue simulator</strong><small>{currentMode.label} · MES replay</small></div>
                </button>
                <button className="ghost-launch" type="button" onClick={() => setTab("daily")}>Open daily mission</button>
              </div>
            </div>
            <div className="rank-orbit">
              <div className="rank-ring">
                <span>{currentRank.icon}</span>
                <strong>{currentRank.name}</strong>
                <small>Career rank</small>
              </div>
              <div className="rank-progress"><i style={{ width: `${rankProgress}%` }} /></div>
              <p>{nextRank ? `${nextRank.min - xp} XP to ${nextRank.name}` : "Maximum rank reached"}</p>
            </div>
          </div>

          <div className="hud-grid">
            <div className="hud-card accent-card">
              <span>LEVEL</span><strong>{level}</strong>
              <div className="mini-track"><i style={{ width: `${(xp % 500) / 5}%` }} /></div>
              <small>{xp.toLocaleString()} total XP</small>
            </div>
            <div className="hud-card fire-card">
              <span>COMBO</span><strong>×{combo}</strong><small>Best ×{bestCombo}</small>
            </div>
            <div className="hud-card">
              <span>ACCURACY</span><strong>{accuracy}%</strong><small>{correctAttempts}/{totalAttempts} correct</small>
            </div>
            <div className="hud-card">
              <span>DAILY STREAK</span><strong>🔥 {streak}</strong><small>Keep the chain alive</small>
            </div>
          </div>

          <div className="mission-grid">
            <article className="mission-card daily-mission">
              <div className="mission-top"><span>🔥 DAILY MISSION</span><b>ONE DAY LEFT</b></div>
              <h2>Confirmation Under Pressure</h2>
              <p>Complete 10 mixed scenarios with at least 70% accuracy.</p>
              <div className="mission-progress-label"><span>{dailyProgress}/10 completed</span><strong>+600 XP</strong></div>
              <div className="mission-track"><i style={{ width: `${dailyProgress * 10}%` }} /></div>
              <button type="button" onClick={() => setTab("daily")}>Enter mission</button>
            </article>

            <article className="mission-card simulator-mission">
              <div className="mission-top"><span>◆ MAIN SIMULATOR</span><b>UNLIMITED</b></div>
              <h2>Mixed Market Operations</h2>
              <p>Breaks, retests, fakeouts, and no-trade situations with no advance warning.</p>
              <div className="difficulty-row"><span>Difficulty</span><strong>★★★★☆</strong></div>
              <button type="button" onClick={() => { changePracticeMode("mixed"); setTab("train"); }}>Launch replay</button>
            </article>

            <article className="mission-card review-mission">
              <div className="mission-top"><span>◎ REVIEW CENTER</span><b>{mistakes.length} SAVED</b></div>
              <h2>Eliminate Repeat Mistakes</h2>
              <p>Replay the exact charts that trapped you and study the numbered explanation lanes.</p>
              <div className="difficulty-row"><span>Priority</span><strong>{mistakes.length ? "HIGH" : "CLEAR"}</strong></div>
              <button type="button" onClick={() => setTab("mistakes")}>Review mistakes</button>
            </article>
          </div>

          <div className="program-section">
            <div className="section-heading">
              <div><span className="eyebrow">Choose your operation</span><h2>Training programs</h2></div>
              <button className="text-button" type="button" onClick={() => setTab("career")}>View career path →</button>
            </div>
            <div className="program-grid">
              {practiceModes.map(mode => (
                <button
                  type="button"
                  key={mode.id}
                  className={`program-card program-${mode.id}`}
                  onClick={() => { changePracticeMode(mode.id); setTab("train"); }}
                >
                  <span className="program-icon">{mode.icon}</span>
                  <div><b>{mode.short}</b><strong>{mode.label}</strong><small>{mode.description}</small></div>
                  <em>{mode.reward}</em>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (tab === "train") {
      return (
        <section className={`simulator-screen mode-${practiceMode} ${showCelebration ? "celebrate" : ""}`}>
          {showCelebration && <div className="xp-pop">PERFECT · +{scenario.xp} XP · COMBO ×{combo}</div>}
          <div className="mode-hero">
            <div className="mode-symbol">{currentMode.icon}</div>
            <div>
              <span>{currentMode.short} PROGRAM</span>
              <h2>{currentMode.label}</h2>
              <p>{currentMode.callout}</p>
            </div>
            <div className="mode-meta">
              <small>DIFFICULTY</small><strong>{currentMode.difficulty}</strong>
              <small>REWARD</small><strong>{currentMode.reward}</strong>
            </div>
          </div>
          <div className="mode-deck">
            {practiceModes.map(mode => (
              <button
                type="button"
                key={mode.id}
                className={practiceMode === mode.id ? "active" : ""}
                onClick={() => changePracticeMode(mode.id)}
              >
                <span>{mode.icon}</span><b>{mode.short}</b>
              </button>
            ))}
          </div>
          <div className="workspace">
          <div className="chart-panel">
            <div className="instrument-bar">
              <div><strong>MES</strong><span>Micro E-mini S&amp;P 500 · Synthetic replay</span></div>
              <div className="market-chip">{currentMode.short}</div>
            </div>
            <div className="replay-toolbar">
              <div className="control-with-help">
                <button type="button" className="secondary compact" onClick={() => setReplayRunning(v => !v)}>
                  {replayRunning ? "Pause" : "Play"}
                </button>
                <HelpTip title="Replay" text="Play reveals future candles one at a time. Pause stops the replay at the current candle." />
              </div>
              <div className="control-with-help">
                <button type="button" className="secondary compact" onClick={() => setVisibleCandles(v => Math.min(v + 1, scenario.candles.length))}>
                  +1 candle
                </button>
                <HelpTip title="Advance one candle" text="Reveals exactly one additional candle so you can inspect price action slowly." />
              </div>
              <div className="control-with-help">
                <button type="button" className="secondary compact" onClick={resetReplay}>Reset</button>
                <HelpTip title="Reset replay" text="Returns the scenario to its starting candles and clears your current trade plan." />
              </div>
              <label>Speed
                <select value={replaySpeed} onChange={e => setReplaySpeed(Number(e.target.value))}>
                  <option value={1200}>Slow</option>
                  <option value={700}>Normal</option>
                  <option value={350}>Fast</option>
                </select>
              </label>
              <span>{visibleCandles}/{scenario.candles.length} candles</span>
            </div>
            <Chart
              scenario={scenario}
              reveal={reveal}
              choice={choice}
              entryPrice={entryPrice}
              stopPrice={stopPrice}
              targetPrice={targetPrice}
              visibleCandles={visibleCandles}
              activePlacement={activePlacement}
              onPlaceLevel={setLevel}
              onChangeLevel={setLevel}
            />
          </div>
          <aside className="ticket">
            <h2>{practiceMode === "mixed" ? "Main mixed trainer" : "Focused practice"}</h2>
            <p className="mode-description">
              {practiceModes.find(mode => mode.id === practiceMode)?.description}
            </p>
            <div className="quote-grid">
              <div><span>Instrument</span><strong>MES</strong></div>
              <label>
                <span className="label-with-help">Contracts <HelpTip title="Contracts" text="The number of MES contracts in the simulated trade. More contracts increase both potential profit and potential loss." /></span>
                <input type="number" min="1" max="10" value={contracts} onChange={e => setContracts(Math.max(1, Number(e.target.value) || 1))} />
              </label>
            </div>
            <div className="order-type-row">
              <div>
                <button type="button" className={orderType === "market" ? "active" : ""} onClick={() => setOrderType("market")}>MARKET</button>
                <HelpTip title="Market order" text="Enters at the best available current price. It favors speed over exact entry price." />
              </div>
              <div>
                <button type="button" className={orderType === "limit" ? "active" : ""} onClick={() => setOrderType("limit")}>LIMIT</button>
                <HelpTip title="Limit order" text="Only enters at your chosen price or better. The order may never fill if price does not return to it." />
              </div>
              <div>
                <button type="button" className={orderType === "stop" ? "active" : ""} onClick={() => setOrderType("stop")}>STOP</button>
                <HelpTip title="Stop entry order" text="Activates after price reaches your trigger. Traders often use it to enter after confirmation or continuation." />
              </div>
            </div>
            <p className="label">Your decision</p>
            <div className="decision-grid">
              <div>
                <button className={`decision buy ${choice === "buy" ? "active" : ""}`} onClick={() => !reveal && setChoice("buy")} type="button">BUY</button>
                <HelpTip title="Buy" text="Choose Buy when you expect price to move higher after a valid bullish break and retest." />
              </div>
              <div>
                <button className={`decision sell ${choice === "sell" ? "active" : ""}`} onClick={() => !reveal && setChoice("sell")} type="button">SELL</button>
                <HelpTip title="Sell" text="Choose Sell when you expect price to move lower after a valid bearish break and retest." />
              </div>
              <div>
                <button className={`decision wait ${choice === "wait" ? "active" : ""}`} onClick={() => !reveal && setChoice("wait")} type="button">WAIT</button>
                <HelpTip title="Wait" text="Choose Wait when the break, retest, or confirmation is missing, unclear, or invalid." />
              </div>
            </div>

            {choice !== "wait" && (
              <>
                <div className="trade-plan-grid">
                  {([
                    ["entry", "Entry", entryPrice, setEntryPrice],
                    ["stop", "Stop-loss", stopPrice, setStopPrice],
                    ["target", "Take-profit", targetPrice, setTargetPrice]
                  ] as const).map(([kind, label, value, setter]) => (
                    <div className="level-control" key={kind}>
                      <div className="level-heading">
                        <span className="label-with-help">
                          {label}
                          <HelpTip
                            title={label}
                            text={
                              kind === "entry"
                                ? "The price where your simulated position opens."
                                : kind === "stop"
                                ? "The price that exits the trade to limit your loss when the setup fails."
                                : "The price where the trade closes for your planned profit."
                            }
                          />
                        </span>
                        <button
                          type="button"
                          className={activePlacement === kind ? "targeting active" : "targeting"}
                          onClick={() => setActivePlacement(activePlacement === kind ? null : kind)}
                          title={`Tap, then place ${label} on chart`}
                        >
                          ⊕
                        </button>
                      </div>
                      <input
                        inputMode="decimal"
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder="Price"
                        disabled={reveal}
                      />
                      <div className="tick-row">
                        <button type="button" onClick={() => adjustLevel(kind, -1)}>-1.00</button>
                        <button type="button" onClick={() => adjustLevel(kind, -.25)}>-0.25</button>
                        <button type="button" onClick={() => adjustLevel(kind, .25)}>+0.25</button>
                        <button type="button" onClick={() => adjustLevel(kind, 1)}>+1.00</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bracket-legend">
                  <span><i className="legend-swatch reward-zone" />Green area: planned profit zone</span>
                  <span><i className="legend-swatch risk-zone" />Red area: planned loss zone</span>
                  <HelpTip title="Risk/reward brackets" text="The shaded green and red areas visualize your planned reward and risk. The side brackets show the distance from entry to target and from entry to stop." />
                </div>
                <div className="risk-card">
                  <div><span className="label-with-help">Risk <HelpTip title="Risk" text="The distance from entry to stop-loss, measured in index points." /></span><strong>{liveRiskPoints > 0 ? `${liveRiskPoints.toFixed(2)} pts` : "—"}</strong></div>
                  <div><span className="label-with-help">Reward <HelpTip title="Reward" text="The distance from entry to take-profit, measured in index points." /></span><strong>{liveRewardPoints > 0 ? `${liveRewardPoints.toFixed(2)} pts` : "—"}</strong></div>
                  <div><span className="label-with-help">R:R <HelpTip title="Reward-to-risk" text="Compares planned reward with planned risk. A value of 2:1 means two units of reward for each unit risked." /></span><strong>{liveRR > 0 ? `${liveRR.toFixed(2)}:1` : "—"}</strong></div>
                  <div><span className="label-with-help">Est. loss <HelpTip title="Estimated loss" text="Approximate simulated dollar loss if the stop is reached, based on MES point value and contract count." /></span><strong>{estimatedLoss > 0 ? `$${estimatedLoss.toFixed(2)}` : "—"}</strong></div>
                  <div><span className="label-with-help">Est. profit <HelpTip title="Estimated profit" text="Approximate simulated dollar profit if the target is reached, based on MES point value and contract count." /></span><strong>{estimatedProfit > 0 ? `$${estimatedProfit.toFixed(2)}` : "—"}</strong></div>
                </div>
              </>
            )}

            <div className="submit-with-help">
            <button
              className="primary"
              type="button"
              disabled={
                !choice ||
                reveal ||
                (choice !== "wait" && (!entryPrice || !stopPrice || !targetPrice))
              }
              onClick={() => submitAnswer()}
            >
              Submit trade plan
            </button>
            <HelpTip title="Submit trade plan" text="Locks your direction, entry, stop, and target, then grades the complete plan and reveals the explanation." />
            </div>
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
                <div className="score-breakdown">
                  <div><span>Direction</span><strong>{choice === scenario.answer ? "10/10" : "0/10"}</strong></div>
                  <div><span>Entry plan</span><strong>{choice === "wait" ? "N/A" : entryPrice ? "8/10" : "0/10"}</strong></div>
                  <div><span>Stop placement</span><strong>{choice === "wait" ? "N/A" : liveRiskPoints > 0 ? "8/10" : "0/10"}</strong></div>
                  <div><span>Target</span><strong>{choice === "wait" ? "N/A" : liveRR >= 2 ? "10/10" : liveRR >= 1 ? "7/10" : "3/10"}</strong></div>
                  <div><span>Risk management</span><strong>{choice === "wait" ? "10/10" : liveRR >= 2 ? "10/10" : liveRR >= 1 ? "6/10" : "2/10"}</strong></div>
                </div>
                <div className="plan-grade">
                  <strong>Coach feedback</strong>
                  <span>{planFeedback}</span>
                </div>
                <button className="secondary" type="button" onClick={nextScenario}>Next scenario</button>
              </div>
            )}
          </aside>
          </div>
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
            <Chart scenario={dailyScenario} reveal={reveal} choice={choice} entryPrice={entryPrice} stopPrice={stopPrice} targetPrice={targetPrice} />
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


    if (tab === "career") {
      return (
        <section className="career-page">
          <div className="career-hero">
            <span className="eyebrow">Career progression</span>
            <h2>Rise through the trading ranks</h2>
            <p>Ranks represent training consistency—not real-world trading status or guaranteed profitability.</p>
          </div>
          <div className="career-path">
            {careerRanks.map((rank, index) => {
              const unlocked = xp >= rank.min;
              const active = index === currentRankIndex;
              return (
                <div className={`rank-node ${unlocked ? "unlocked" : ""} ${active ? "active" : ""}`} key={rank.name}>
                  <div className="rank-medal">{rank.icon}</div>
                  <div><strong>{rank.name}</strong><span>{rank.min.toLocaleString()} XP required</span></div>
                  <b>{active ? "CURRENT" : unlocked ? "UNLOCKED" : "LOCKED"}</b>
                </div>
              );
            })}
          </div>
          <div className="career-rewards">
            <h3>Next-rank rewards</h3>
            <div className="reward-grid">
              <div><span>◆</span><strong>New chart atmosphere</strong><small>Visual customization</small></div>
              <div><span>↯</span><strong>Harder fakeouts</strong><small>Advanced scenario pool</small></div>
              <div><span>★</span><strong>Profile title</strong><small>Leaderboard recognition</small></div>
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
  }, [tab, scenario, dailyScenario, choice, reveal, xp, streak, role, premium, email, password, authMessage, question, aiAnswer, aiLoading, users, canAdmin, level, practiceMode, accuracy, mistakes, selectedMistake, unlockedAchievements, soundEnabled, reducedMotion, showCelebration, totalAttempts, entryPrice, stopPrice, targetPrice, planFeedback, visibleCandles, replayRunning, replaySpeed, activePlacement, contracts, orderType, liveRiskPoints, liveRewardPoints, liveRR, estimatedLoss, estimatedProfit, combo, bestCombo, currentRankIndex, currentRank, nextRank, rankProgress, currentMode, dailyProgress]);

  return (
    <main className={`app-shell app-mode-${practiceMode}`}>
      <header className="topbar">
        <button className="brand brand-button" type="button" onClick={() => setTab("home")}>
          <span className="brand-mark">FA</span>
          <div><strong>Futures Academy</strong><span>Break · Retest · Master</span></div>
        </button>
        <div className="top-stats">
          <span>LVL {level}</span>
          <div className="xp-track"><i style={{ width: `${(xp % 500) / 5}%` }} /></div>
          <b>{xp.toLocaleString()} XP</b>
        </div>
      </header>
      <nav className="nav">
        {[
          ["home", "Command Center"],
          ["train", "Simulator"],
          ["daily", "Daily Mission"],
          ["career", "Career"],
          ["mistakes", "Review"],
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

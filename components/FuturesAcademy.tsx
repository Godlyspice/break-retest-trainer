"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasSupabase, supabase } from "@/lib/supabase-browser";
import OwnerDashboard from "@/components/admin/OwnerDashboard";
import Marketplace from "@/components/marketplace/Marketplace";
import { marketplaceCatalog, type MarketplaceItem } from "@/lib/marketplace";
import AccountSelector from "@/components/evaluations/AccountSelector";
import EvaluationHUD from "@/components/evaluations/EvaluationHUD";
import PatternRecognition from "@/components/handbook/PatternRecognition";
import EmptyLeaderboard from "@/components/leaderboards/EmptyLeaderboard";
import { careerRanks, evaluationAccounts } from "@/lib/evaluations";
import { useEvaluation } from "@/hooks/useEvaluation";

type Role = "user" | "moderator" | "admin" | "owner";
type Tab = "home" | "train" | "daily" | "career" | "accounts" | "exams" | "handbook" | "mistakes" | "achievements" | "trophies" | "leaderboard" | "balance" | "shop" | "stats" | "ai" | "profile" | "settings" | "admin";
type Candle = { open: number; high: number; low: number; close: number; volume: number };
type Scenario = {
  id: string;
  setup: "bull_retest" | "bear_retest" | "bull_fakeout" | "bear_fakeout" | "chop";
  answer: "buy" | "sell" | "wait";
  level: number;
  candles: Candle[];
  xp: number;
};

const achievementCatalog = [
  { id: "first_correct", title: "First Confirmation", description: "Get your first scenario correct.", icon: "🧭", requirement: 1 },
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
    icon: "📈",
    difficulty: "Adaptive",
    reward: "40–100 XP",
    description: "Every break-and-retest situation is mixed together. No hints about what comes next.",
    callout: "Read the chart. Trust the process."
  },
  {
    id: "weakness",
    label: "Weakness Hunt",
    short: "FOCUS",
    icon: "🎯",
    difficulty: "Personalized",
    reward: "Bonus XP",
    description: "Targets the scenario types you miss most and saves them to Mistake Replay.",
    callout: "Turn your weakest setup into your strongest."
  },
  {
    id: "clean",
    label: "Confirmation Lab",
    short: "GUIDED",
    icon: "🧭",
    difficulty: "Beginner",
    reward: "30 XP",
    description: "Clear bullish and bearish retests with stronger visual guidance and calmer pacing.",
    callout: "Build confidence before increasing difficulty."
  },
  {
    id: "fakeouts",
    label: "Fakeout Arena",
    short: "HARD",
    icon: "⚡",
    difficulty: "Advanced",
    reward: "75 XP",
    description: "Failed breaks, traps, and fast reversals. Waiting is often the winning decision.",
    callout: "Do not let the first breakout candle fool you."
  },
  {
    id: "wait",
    label: "Patience Protocol",
    short: "DISCIPLINE",
    icon: "🛡️",
    difficulty: "Mental",
    reward: "Streak XP",
    description: "Choppy markets and invalid setups designed to train the hardest action: doing nothing.",
    callout: "A skipped bad trade is a successful decision."
  }
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
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const closeOtherTips = () => setOpen(false);
    window.addEventListener("close-help-tips", closeOtherTips);
    return () => window.removeEventListener("close-help-tips", closeOtherTips);
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <span className="help-wrap" ref={wrapRef}>
      <button
        type="button"
        className="help-button"
        aria-label={`Explain ${title}`}
        aria-expanded={open}
        onClick={event => {
          event.stopPropagation();
          if (!open) window.dispatchEvent(new CustomEvent("close-help-tips"));
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
  onChangeLevel,
  lastPlacedLevel
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
  lastPlacedLevel?: "entry" | "stop" | "target" | null;
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
      const virtualSlots = Math.max(34, Math.min(42, scenario.candles.length));
      const step = (plotW / virtualSlots) * zoom;
      const chartOffset = 0;

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
        const x = pad.l + chartOffset + i * step + step / 2;
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
        const x = pad.l + chartOffset + i * step + step / 2;
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
        if (lastPlacedLevel === item.kind) {
          ctx.shadowColor = item.color;
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        ctx.moveTo(pad.l, yy);
        ctx.lineTo(w - pad.r, yy);
        ctx.stroke();
        ctx.shadowBlur = 0;
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
  const [identityMode, setIdentityMode] = useState<"landing" | "guest" | "demo" | "account">("landing");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [guestPrompt, setGuestPrompt] = useState("");
  const [handbookQuery, setHandbookQuery] = useState("");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Demo Trader");
  const [profileRole, setProfileRole] = useState<"user" | "moderator" | "admin" | "owner">("user");
  const [profilePremium, setProfilePremium] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [showGuestImport, setShowGuestImport] = useState(false);
  const [guestSnapshot, setGuestSnapshot] = useState<any>(null);
  const [scenario, setScenario] = useState(() => generateScenario());
  const [dailyScenario] = useState(() => generateScenario(true));
  const [choice, setChoice] = useState<"buy" | "sell" | "wait" | null>(null);
  const [entryPrice, setEntryPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [planFeedback, setPlanFeedback] = useState("");
  const [activePlacement, setActivePlacement] = useState<"entry" | "stop" | "target" | null>(null);
  const [lastPlacedLevel, setLastPlacedLevel] = useState<"entry" | "stop" | "target" | null>(null);
  const [visibleCandles, setVisibleCandles] = useState(18);
  const [replayRunning, setReplayRunning] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(700);
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [contracts, setContracts] = useState(1);
  const [reveal, setReveal] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [role, setRole] = useState<Role>("owner");
  const [premium, setPremium] = useState(true);
  const [email, setEmail] = useState("");
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
  const [bestCombo, setBestCombo] = useState(0);
  const [points, setPoints] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState("starter");
  const [paperBalance, setPaperBalance] = useState(10000);
  const [peakBalance, setPeakBalance] = useState(10000);
  const [ownedShopItems, setOwnedShopItems] = useState<string[]>([]);
  const [equippedShopItems, setEquippedShopItems] = useState<
    Partial<Record<MarketplaceItem["slot"], string>>
  >({});
  const [shopMessage, setShopMessage] = useState("");

  const {
    activeEvaluation,
    activeAccount,
    startEvaluation,
    applyTradeResult
  } = useEvaluation(authUserId);

  const [correctWaits, setCorrectWaits] = useState(0);
  const [fakeoutsFound, setFakeoutsFound] = useState(0);
  const [mistakes, setMistakes] = useState<Array<{ scenario: Scenario; selected: string; createdAt: string }>>([]);
  const [selectedMistake, setSelectedMistake] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [practiceMode, setPracticeMode] = useState("mixed");

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
  const membershipLabel =
    profileRole === "owner" ? "👑 Academy Founder" :
    profileRole === "admin" ? "🛡️ Administrator" :
    profileRole === "moderator" ? "🧭 Moderator" :
    identityMode === "guest" ? "👤 Guest Trader" :
    identityMode === "demo" ? "🎮 Demo" :
    "⭐ Academy Member";

  const selectedAccount =
    activeAccount ||
    evaluationAccounts.find(account => account.id === selectedAccountId) ||
    evaluationAccounts[0];
  const trailingDrawdownFloor = Math.max(
    selectedAccount.balance - selectedAccount.maxDrawdown,
    peakBalance - selectedAccount.maxDrawdown
  );
  const drawdownRemaining = Math.max(0, paperBalance - trailingDrawdownFloor);
  const accountFailed = paperBalance <= trailingDrawdownFloor;

  const currentRankIndex = careerRanks.reduce((found, rank, index) => xp >= rank.min && reputation >= rank.reputation ? index : found, 0);
  const currentRank = careerRanks[currentRankIndex];
  const nextRank = careerRanks[currentRankIndex + 1];
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((xp - currentRank.min) / (nextRank.min - currentRank.min)) * 100))
    : 100;
  const currentMode = practiceModes.find(mode => mode.id === practiceMode) || practiceModes[0];
  const dailyProgress = Math.min(10, correctAttempts % 11);
  const canAdmin = role === "owner" || role === "admin";

  useEffect(() => {
  const client = supabase;

  if (!client) {
    setAuthReady(true);
    return;
  }

  let mounted = true;

  const loadAuthenticatedProfile = async (session: any) => {
      if (!mounted) return;

      if (!session?.user) {
        setAuthUserId(null);
        setProfileName("Demo Trader");
        setProfileRole("user");
        setProfilePremium(false);
        setRole("user");
        setPremium(false);
        setAuthReady(true);
        return;
      }

      const user = session.user;
      setAuthUserId(user.id);
      setEmail(user.email || "");
      setIdentityMode("account");

      const { data: profile } = await client
        .from("profiles")
        .select("display_name, role, premium, xp, streak, credits, reputation")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      setProfileName(
        profile?.display_name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Academy Member"
      );
      const resolvedRole = (profile?.role || "user") as "user" | "moderator" | "admin" | "owner";
      const resolvedPremium = Boolean(profile?.premium);
      setProfileRole(resolvedRole);
      setProfilePremium(resolvedPremium);
      setRole(resolvedRole);
      setPremium(resolvedPremium);

      setXp(typeof profile?.xp === "number" ? profile.xp : 0);
      setStreak(typeof profile?.streak === "number" ? profile.streak : 0);
      setPoints(typeof profile?.credits === "number" ? profile.credits : 0);
      setReputation(
        typeof profile?.reputation === "number" ? profile.reputation : 0
      );

      try {
        const savedGuest = window.localStorage.getItem("futures-academy-guest-v2-fresh");
        if (savedGuest) {
          const parsed = JSON.parse(savedGuest);
          setGuestSnapshot(parsed);
          setShowGuestImport(true);
        }
      } catch {}

      setAuthReady(true);
    };

    client.auth.getSession().then(({ data }) => loadAuthenticatedProfile(data.session));

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      loadAuthenticatedProfile(session);
    });

    const refreshAuthenticatedProfile = () => {
      client.auth.getSession().then(({ data }) => {
        loadAuthenticatedProfile(data.session);
      });
    };

    window.addEventListener(
      "futures-academy-profile-updated",
      refreshAuthenticatedProfile
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener(
        "futures-academy-profile-updated",
        refreshAuthenticatedProfile
      );
    };
  }, []);

  useEffect(() => {
    if (!activeEvaluation) return;
    setSelectedAccountId(activeEvaluation.accountId);
    setPaperBalance(activeEvaluation.currentBalance);
    setPeakBalance(activeEvaluation.peakBalance);
  }, [activeEvaluation]);

  useEffect(() => {
    if (typeof window === "undefined" || !authReady || authUserId) return;
    const saved = window.localStorage.getItem("futures-academy-guest-v2-fresh");
    if (!saved) return;
    try {
      const guest = JSON.parse(saved);
      if (guest.identityMode === "guest") {
        setIdentityMode("guest");
        setXp(guest.xp ?? 0);
        setPoints(guest.points ?? 0);
        setReputation(guest.reputation ?? 0);
        setPaperBalance(guest.paperBalance ?? 10000);
        setPeakBalance(guest.peakBalance ?? 10000);
        setSelectedAccountId("starter");
      }
    } catch {}
  }, [authReady, authUserId]);

  useEffect(() => {
    if (typeof window === "undefined" || identityMode !== "guest") return;
    window.localStorage.setItem("futures-academy-guest-v2-fresh", JSON.stringify({
      identityMode,
      xp,
      points,
      reputation,
      paperBalance,
      peakBalance
    }));
  }, [identityMode, xp, points, reputation, paperBalance, peakBalance]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedOwned = window.localStorage.getItem(
        "futures-academy-marketplace-owned"
      );
      const savedEquipped = window.localStorage.getItem(
        "futures-academy-marketplace-equipped"
      );
      if (savedOwned) setOwnedShopItems(JSON.parse(savedOwned));
      if (savedEquipped) setEquippedShopItems(JSON.parse(savedEquipped));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "futures-academy-marketplace-owned",
      JSON.stringify(ownedShopItems)
    );
    window.localStorage.setItem(
      "futures-academy-marketplace-equipped",
      JSON.stringify(equippedShopItems)
    );
  }, [ownedShopItems, equippedShopItems]);

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

  async function signOutAccount() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthUserId(null);
    setIdentityMode("landing");
    setProfileName("Demo Trader");
    setProfileRole("user");
    setProfilePremium(false);
    setRole("user");
    setPremium(false);
    setTab("home");
  }

  async function importGuestProgress() {
    if (!guestSnapshot) {
      setShowGuestImport(false);
      return;
    }

    setXp(Math.max(xp, guestSnapshot.xp ?? 0));
    setPoints(Math.max(points, guestSnapshot.points ?? 0));
    setReputation(Math.max(reputation, guestSnapshot.reputation ?? 0));
    setPaperBalance(Math.max(paperBalance, guestSnapshot.paperBalance ?? 0));
    setPeakBalance(Math.max(peakBalance, guestSnapshot.peakBalance ?? 0));

    if (supabase && authUserId) {
      await supabase
        .from("profiles")
        .update({
          xp: Math.max(xp, guestSnapshot.xp ?? 0),
          streak
        })
        .eq("id", authUserId);
    }

    window.localStorage.removeItem("futures-academy-guest-v2-fresh");
    setGuestSnapshot(null);
    setShowGuestImport(false);
  }

  function discardGuestProgress() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("futures-academy-guest-v2-fresh");
    }
    setGuestSnapshot(null);
    setShowGuestImport(false);
  }

  function enterGuestMode() {
    setIdentityMode("guest");
    setXp(0);
    setStreak(0);
    setPoints(0);
    setReputation(0);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    setCombo(0);
    setBestCombo(0);
    setCorrectWaits(0);
    setFakeoutsFound(0);
    setMistakes([]);
    setSelectedAccountId("starter");
    setPaperBalance(10000);
    setPeakBalance(10000);
    setShowOnboarding(true);
    setTourStep(0);
  }

  function enterDemoMode() {
    setIdentityMode("demo");
    setXp(0);
    setStreak(0);
    setPoints(0);
    setReputation(0);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    setCombo(0);
    setBestCombo(0);
    setCorrectWaits(0);
    setFakeoutsFound(0);
    setMistakes([]);
    setSelectedAccountId("starter");
    setPaperBalance(10000);
    setPeakBalance(10000);
    setPracticeMode("clean");
    setTab("train");
    setShowOnboarding(true);
    setTourStep(0);
  }

  function enterAccountMode() {
    setIdentityMode("account");
    setTab("profile");
  }

  const tourSteps = [
    { title: "Welcome to Futures Academy", text: "This quick tour shows the chart, trade plan, replay, and paper-account rules." },
    { title: "Read the chart first", text: "Identify the key level, then decide whether price has broken, retested, and confirmed." },
    { title: "Choose Buy, Sell, or Wait", text: "Wait is a valid answer whenever the setup is incomplete, unclear, or invalid." },
    { title: "Build the trade plan", text: "Set entry, stop-loss, and take-profit. The simulator calculates risk and reward automatically." },
    { title: "Protect the paper account", text: "Your paper balance and trailing drawdown remain visible in the sticky account bar." }
  ];

  function progressionReward() {
    if (practiceMode === "fakeouts") return { xp: 25, credits: 8, reputation: 4 };
    if (practiceMode === "weakness" || practiceMode === "wait") return { xp: 18, credits: 6, reputation: 3 };
    if (practiceMode === "clean") return { xp: 10, credits: 3, reputation: 1 };
    return { xp: 15, credits: 5, reputation: 2 };
  }

  async function submitAnswer(activeScenario = scenario, daily = false) {
    if (!choice) return;
    setReveal(true);
    setTotalAttempts(v => v + 1);
    const correct = choice === activeScenario.answer;
    playTone(soundEnabled, correct);

    const evaluationNet =
      correct
        ? choice !== "wait" && Number.isFinite(estimatedProfit) && estimatedProfit > 0
          ? estimatedProfit
          : 10
        : choice !== "wait" && Number.isFinite(estimatedLoss) && estimatedLoss > 0
        ? -estimatedLoss
        : -25;

    if (activeEvaluation) {
      const evaluationResult = await applyTradeResult(evaluationNet);
      if (!evaluationResult.ok) {
        setPlanFeedback(evaluationResult.message);
      } else if (evaluationResult.passed || evaluationResult.failed) {
        setPlanFeedback(evaluationResult.message);
      }
    }

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
      const reward = progressionReward();
      setPoints(value => value + reward.credits);
      setReputation(value => value + reward.reputation);

      if (choice !== "wait" && Number.isFinite(estimatedProfit) && estimatedProfit > 0) {
        setPaperBalance(current => {
          const next = current + estimatedProfit;
          setPeakBalance(peak => Math.max(peak, next));
          return next;
        });
      } else {
        setPaperBalance(current => {
          const next = current + 10;
          setPeakBalance(peak => Math.max(peak, next));
          return next;
        });
      }

      setCorrectAttempts(v => v + 1);
      setCombo(current => {
        const next = current + 1;
        setBestCombo(best => Math.max(best, next));
        return next;
      });
      if (choice === "wait") setCorrectWaits(v => v + 1);
      if (activeScenario.setup.includes("fakeout")) setFakeoutsFound(v => v + 1);
      setXp(v => v + progressionReward().xp);
      setStreak(v => v + 1);
      setShowCelebration(true);
      window.setTimeout(() => setShowCelebration(false), reducedMotion ? 250 : 1100);
    } else {
      setReputation(value => Math.max(0, value - 1));
      if (choice !== "wait" && Number.isFinite(estimatedLoss) && estimatedLoss > 0) {
        setPaperBalance(current => current - estimatedLoss);
      } else {
        setPaperBalance(current => current - 25);
      }
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
    setLastPlacedLevel(kind);
    window.setTimeout(() => setLastPlacedLevel(null), 450);
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

  async function launchEvaluation(accountId: string) {
    const account = evaluationAccounts.find(item => item.id === accountId);
    if (!account) return { ok: false, message: "Account not found." };

    const result = await startEvaluation(account, reputation, identityMode);

    if (!result.ok) {
      setShopMessage(result.message);
      return result;
    }

    setSelectedAccountId(account.id);
    setPaperBalance(account.balance);
    setPeakBalance(account.balance);
    setShopMessage(`${account.name} started successfully.`);
    return { ok: true };
  }

  function resetPaperAccount() {
    if (points < selectedAccount.resetCost) {
      setShopMessage(`You need ${selectedAccount.resetCost - points} more points to reset this account.`);
      return;
    }
    setPoints(value => value - selectedAccount.resetCost);
    setPaperBalance(selectedAccount.balance);
    setPeakBalance(selectedAccount.balance);
    setShopMessage(`${selectedAccount.name} reset successfully.`);
  }

  function buyShopItem(item: MarketplaceItem) {
    if (ownedShopItems.includes(item.id)) return;

    if (item.premiumOnly && !profilePremium) {
      setShopMessage(`${item.name} requires Premium.`);
      return;
    }

    if (item.minLevel && level < item.minLevel) {
      setShopMessage(`${item.name} requires Level ${item.minLevel}.`);
      return;
    }

    if (item.minReputation && reputation < item.minReputation) {
      setShopMessage(
        `${item.name} requires ${item.minReputation.toLocaleString()} reputation.`
      );
      return;
    }

    if (points < item.price) {
      setShopMessage(
        `You need ${(item.price - points).toLocaleString()} more points for ${item.name}.`
      );
      return;
    }

    setPoints(value => value - item.price);
    setOwnedShopItems(current => [...current, item.id]);
    setShopMessage(`${item.name} unlocked.`);
  }

  function equipShopItem(item: MarketplaceItem) {
    if (!ownedShopItems.includes(item.id)) return;
    setEquippedShopItems(current => ({
      ...current,
      [item.slot]: item.id
    }));
    setShopMessage(`${item.name} equipped.`);
  }

  const content = useMemo(() => {
    if (tab === "home") {
      return (
        <section className="command-center">
          <div className="hero-panel hero-illustrated">
            <div className="hero-copy">
              <span className="hero-kicker">TRADING COMMAND CENTER</span>
              <h1>Welcome back, Trader.</h1>
              <p>Master break-and-retest decisions through missions, replay, and focused review.</p>
              <div className="hero-motto">🕯️ Read the candle. 🧠 Trust the setup. 🎯 Execute the plan.</div>
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
              <p>{nextRank ? `${Math.max(0, nextRank.min - xp).toLocaleString()} XP and ${Math.max(0, nextRank.reputation - reputation).toLocaleString()} reputation to ${nextRank.name}` : "Maximum rank reached"}</p>
            </div>
          </div>

          <AccountSelector
            points={points}
            reputation={reputation}
            activeAccountId={activeEvaluation?.accountId || selectedAccountId}
            identityMode={identityMode}
            onStart={async account => launchEvaluation(account.id)}
          />

          <div className="hud-grid">
            <div className="hud-card accent-card">
              <span>⭐ LEVEL</span><strong>{level}</strong>
              <div className="mini-track"><i style={{ width: `${(xp % 500) / 5}%` }} /></div>
              <small>{xp.toLocaleString()} total XP</small>
            </div>
            <div className="hud-card fire-card">
              <span>🔥 COMBO</span><strong>×{combo}</strong><small>Best ×{bestCombo}</small>
            </div>
            <div className="hud-card">
              <span>🎯 ACCURACY</span><strong>{accuracy}%</strong><small>{correctAttempts}/{totalAttempts} correct</small>
            </div>
            <div className="hud-card">
              <span>📅 DAILY STREAK</span><strong>🔥 {streak}</strong><small>Keep the chain alive</small>
            </div>
            <div className="hud-card reputation-card">
              <span>⭐ REPUTATION</span><strong>{reputation.toLocaleString()}</strong><small>Cannot be purchased</small>
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
              <div className="mission-top"><span>📊 MAIN SIMULATOR</span><b>UNLIMITED</b></div>
              <h2>Mixed Market Operations</h2>
              <p>Breaks, retests, fakeouts, and no-trade situations with no advance warning.</p>
              <div className="difficulty-row"><span>Difficulty</span><strong>★★★★☆</strong></div>
              <button type="button" onClick={() => { changePracticeMode("mixed"); setTab("train"); }}>Launch replay</button>
            </article>

            <article className="mission-card review-mission">
              <div className="mission-top"><span>🧠 REVIEW CENTER</span><b>{mistakes.length} SAVED</b></div>
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
          <div className="simulator-art" aria-hidden="true">
            <span className="art-candle art-candle-1" />
            <span className="art-candle art-candle-2" />
            <span className="art-candle art-candle-3" />
            <span className="art-candle art-candle-4" />
            <span className="art-candle art-candle-5" />
          </div>
          {showCelebration && <div className="xp-pop">✨ PERFECT · +{scenario.xp} XP · COMBO ×{combo}</div>}
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
          <div className="chart-panel scenario-transition" key={scenario.id}>
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
              lastPlacedLevel={lastPlacedLevel}
            />
          </div>
          <aside className={`ticket ${reveal && choice !== scenario.answer ? "ticket-error" : ""}`}>
            <h2>{practiceMode === "mixed" ? "Main mixed trainer" : "Focused practice"}</h2>
            <p className="mode-description">
              {practiceModes.find(mode => mode.id === practiceMode)?.description}
            </p>
            <div className="quote-grid">
              <div><span>Instrument</span><strong>MES</strong></div>
              <div className="contracts-control">
                <div className="control-label-row">
                  <span>Contracts</span>
                  <HelpTip title="Contracts" text="The number of MES contracts in the simulated trade. More contracts increase both potential profit and potential loss." />
                </div>
                <div className="contract-stepper">
                  <button type="button" onClick={() => setContracts(value => Math.max(1, value - 1))} aria-label="Decrease contracts">−</button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={contracts}
                    aria-label="Contract quantity"
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "");
                      if (!digits) return;
                      setContracts(Math.min(10, Math.max(1, Number(digits))));
                    }}
                  />
                  <button type="button" onClick={() => setContracts(value => Math.min(10, value + 1))} aria-label="Increase contracts">+</button>
                </div>
              </div>
            </div>
            <div className="order-type-row">
              <div className="control-button-shell">
                <button type="button" className={orderType === "market" ? "active" : ""} onClick={() => setOrderType("market")}>MARKET</button>
                <HelpTip title="Market order" text="Enters at the best available current price. It favors speed over exact entry price." />
              </div>
              <div className="control-button-shell">
                <button type="button" className={orderType === "limit" ? "active" : ""} onClick={() => setOrderType("limit")}>LIMIT</button>
                <HelpTip title="Limit order" text="Only enters at your chosen price or better. The order may never fill if price does not return to it." />
              </div>
              <div className="control-button-shell">
                <button type="button" className={orderType === "stop" ? "active" : ""} onClick={() => setOrderType("stop")}>STOP</button>
                <HelpTip title="Stop entry order" text="Activates after price reaches your trigger. Traders often use it to enter after confirmation or continuation." />
              </div>
            </div>
            <p className="label">Your decision</p>
            <div className="decision-grid">
              <div className="control-button-shell decision-shell">
                <button className={`decision buy ${choice === "buy" ? "active" : ""}`} onClick={() => !reveal && setChoice("buy")} type="button">▲ BUY</button>
                <HelpTip title="Buy" text="Choose Buy when you expect price to move higher after a valid bullish break and retest." />
              </div>
              <div className="control-button-shell decision-shell">
                <button className={`decision sell ${choice === "sell" ? "active" : ""}`} onClick={() => !reveal && setChoice("sell")} type="button">▼ SELL</button>
                <HelpTip title="Sell" text="Choose Sell when you expect price to move lower after a valid bearish break and retest." />
              </div>
              <div className="control-button-shell decision-shell">
                <button className={`decision wait ${choice === "wait" ? "active" : ""}`} onClick={() => !reveal && setChoice("wait")} type="button">● WAIT</button>
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
                    <div className={`level-control level-${kind}`} key={kind}>
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
                        placeholder={
                          kind === "entry"
                            ? `Near key level ${scenario.level.toFixed(2)}`
                            : kind === "stop"
                            ? choice === "buy"
                              ? `Below ${scenario.level.toFixed(2)}`
                              : `Above ${scenario.level.toFixed(2)}`
                            : choice === "buy"
                            ? `Above ${scenario.level.toFixed(2)}`
                            : `Below ${scenario.level.toFixed(2)}`
                        }
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
                <div className="trade-summary-title">
                  <div className="control-label-row">
                    <strong>Live trade summary</strong>
                    <HelpTip title="Live trade summary" text="These values update as you change contracts, entry, stop-loss, and take-profit. They estimate risk, reward, reward-to-risk, profit, and loss for the simulated trade." />
                  </div>
                  <span>{liveRR >= 2 ? "Strong plan" : liveRR >= 1 ? "Acceptable plan" : "Needs adjustment"}</span>
                </div>
                <div className="risk-card">
                  <div className="risk-metric risk-metric-loss"><span className="label-with-help">Risk <HelpTip title="Risk" text="The distance from entry to stop-loss, measured in index points." /></span><strong>{liveRiskPoints > 0 ? `${liveRiskPoints.toFixed(2)} pts` : "—"}</strong></div>
                  <div className="risk-metric risk-metric-profit"><span className="label-with-help">Reward <HelpTip title="Reward" text="The distance from entry to take-profit, measured in index points." /></span><strong>{liveRewardPoints > 0 ? `${liveRewardPoints.toFixed(2)} pts` : "—"}</strong></div>
                  <div className="risk-metric risk-metric-ratio"><span className="label-with-help">R:R <HelpTip title="Reward-to-risk" text="Compares planned reward with planned risk. A value of 2:1 means two units of reward for each unit risked." /></span><strong>{liveRR > 0 ? `${liveRR.toFixed(2)}:1` : "—"}</strong></div>
                  <div className="risk-metric risk-metric-loss"><span className="label-with-help">Est. loss <HelpTip title="Estimated loss" text="Approximate simulated dollar loss if the stop is reached, based on MES point value and contract count." /></span><strong>{estimatedLoss > 0 ? `$${estimatedLoss.toFixed(2)}` : "—"}</strong></div>
                  <div className="risk-metric risk-metric-profit"><span className="label-with-help">Est. profit <HelpTip title="Estimated profit" text="Approximate simulated dollar profit if the target is reached, based on MES point value and contract count." /></span><strong>{estimatedProfit > 0 ? `$${estimatedProfit.toFixed(2)}` : "—"}</strong></div>
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
          {activeEvaluation && activeAccount && (
            <EvaluationHUD
              evaluation={activeEvaluation}
              account={activeAccount}
            />
          )}
          <div className="account-hud">
            <div className="account-hud-item">
              <span>Paper account</span>
              <strong>{selectedAccount.icon} {selectedAccount.name}</strong>
            </div>
            <div className="account-hud-item">
              <span>Balance</span>
              <strong>${paperBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="account-hud-item">
              <span>Peak balance</span>
              <strong>${peakBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="account-hud-item drawdown-item">
              <span>Trailing drawdown</span>
              <strong>${drawdownRemaining.toFixed(2)} remaining</strong>
              <div className="drawdown-track">
                <i style={{ width: `${Math.max(0, Math.min(100, (drawdownRemaining / selectedAccount.maxDrawdown) * 100))}%` }} />
              </div>
            </div>
            <div className="account-hud-item">
              <span>Academy points</span>
              <strong>🪙 {points.toLocaleString()}</strong>
            </div>
            <button className="hud-reset-button" type="button" onClick={() => {
              if (identityMode === "demo") {
                setGuestPrompt("Demo mode cannot reset accounts. Continue as Guest or create an account.");
                return;
              }
              resetPaperAccount();
            }}>
              Reset · {selectedAccount.resetCost} pts
            </button>
          </div>
          {accountFailed && (
            <div className="account-failed-banner">
              <strong>Trailing drawdown reached</strong>
              <span>Earn points in the simulator or use your existing points to reset this paper account.</span>
            </div>
          )}
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
              const unlocked = xp >= rank.min && reputation >= rank.reputation;
              const active = index === currentRankIndex;
              return (
                <div className={`rank-node ${unlocked ? "unlocked" : ""} ${active ? "active" : ""}`} key={rank.name}>
                  <div className="rank-medal">{rank.icon}</div>
                  <div><strong>{rank.name}</strong><span>{rank.min.toLocaleString()} XP · {rank.reputation.toLocaleString()} reputation</span></div>
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

    if (tab === "handbook") {
      const topics = [
        { title: "What is MES?", icon: "📘", text: "MES is the Micro E-mini S&P 500 futures contract. In this simulator, one point is treated as $5 per contract." },
        { title: "Break and retest", icon: "📈", text: "A valid setup usually includes a meaningful break, a return to the level, and confirmation that the level is holding or rejecting." },
        { title: "Market order", icon: "⚡", text: "A market order prioritizes immediate execution instead of an exact entry price." },
        { title: "Limit order", icon: "🎯", text: "A limit order waits for your chosen price or better. It may never fill." },
        { title: "Stop order", icon: "🚦", text: "A stop entry activates after price reaches a trigger, often after confirmation." },
        { title: "Stop-loss", icon: "🛡️", text: "The stop-loss exits the simulated trade when the setup fails and limits the planned loss." },
        { title: "Take-profit", icon: "💰", text: "The take-profit closes the simulated trade at your planned reward level." },
        { title: "Reward-to-risk", icon: "⚖️", text: "Reward-to-risk compares the planned gain with the planned loss. A 2:1 plan seeks two units of reward per unit risked." },
        { title: "Trailing drawdown", icon: "📉", text: "The drawdown floor can rise as the paper account reaches new peaks. Reaching it fails the current paper account." },
        { title: "Why Wait matters", icon: "⏳", text: "Not trading a weak setup is part of disciplined trading. Wait is often the best decision." }
      ];
      const visibleTopics = topics.filter(topic =>
        `${topic.title} ${topic.text}`.toLowerCase().includes(handbookQuery.toLowerCase())
      );
      return (
        <section className="v1-page handbook-page">
          <div className="v1-page-header">
            <div><span className="eyebrow">New trader guide</span><h1>Academy Handbook</h1><p>Simple explanations without overwhelming terminology.</p></div>
          </div>
          <div className="handbook-search">
            <span>🔎</span>
            <input value={handbookQuery} onChange={e => setHandbookQuery(e.target.value)} placeholder="Search: stop-loss, limit order, drawdown..." />
          </div>
          <div className="handbook-grid">
            {visibleTopics.map(topic => (
              <article className="handbook-card" key={topic.title}>
                <div>{topic.icon}</div>
                <h2>{topic.title}</h2>
                <p>{topic.text}</p>
                <button type="button" onClick={() => setTab("train")}>Practice this concept →</button>
              </article>
            ))}
          </div>

          <PatternRecognition
            onPractice={mode => {
              changePracticeMode(mode);
              setTab("train");
            }}
          />
        </section>
      );
    }

    if (tab === "accounts") {
      return (
        <section className="v1-page">
          <div className="v1-page-header">
            <div><span className="eyebrow">Academy Bank</span><h1>Account Vault</h1><p>Unlock larger paper accounts by building reputation through consistent practice.</p></div>
            <div className="reputation-chip">⭐ {reputation.toLocaleString()} reputation</div>
          </div>
          <div className="vault-grid">
            {evaluationAccounts.map(account => {
              const unlocked = reputation >= account.reputationRequired;
              const selected = account.id === selectedAccountId;
              return (
                <article className={`vault-card ${unlocked ? "unlocked" : "locked"} ${selected ? "selected" : ""}`} key={account.id}>
                  <div className="vault-icon">{unlocked ? account.icon : "🔒"}</div>
                  <span>{unlocked ? "AVAILABLE" : "LOCKED"}</span>
                  <h2>{account.name}</h2>
                  <div className="vault-numbers">
                    <div><small>Balance</small><strong>${account.balance.toLocaleString()}</strong></div>
                    <div><small>Trailing DD</small><strong>${account.maxDrawdown.toLocaleString()}</strong></div>
                    <div><small>Reset cost</small><strong>{account.resetCost.toLocaleString()} cr</strong></div>
                  </div>
                  <p>{account.description}</p>
                  <div className="vault-requirement">⭐ {account.reputationRequired.toLocaleString()} reputation required</div>
                  <button disabled={!unlocked || selected} onClick={() => void launchEvaluation(account.id)}>
                    {selected ? "Active account" : unlocked ? "Activate account" : "Locked"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      );
    }

    if (tab === "exams") {
      const examRequirements = [
        { name: "Cadet Exam", level: 5, rep: 75, accuracy: 60, scenarios: 10 },
        { name: "Trader Exam", level: 15, rep: 450, accuracy: 72, scenarios: 20 },
        { name: "Professional Exam", level: 30, rep: 1800, accuracy: 80, scenarios: 30 },
        { name: "Elite Exam", level: 50, rep: 3500, accuracy: 85, scenarios: 40 },
        { name: "Funded Exam", level: 75, rep: 11000, accuracy: 88, scenarios: 50 }
      ];
      return (
        <section className="v1-page">
          <div className="v1-page-header">
            <div><span className="eyebrow">Exam Center</span><h1>Promotion Exams</h1><p>Career ranks require XP, reputation, accuracy, and a difficult promotion exam.</p></div>
          </div>
          <div className="exam-grid">
            {examRequirements.map((exam, index) => {
              const ready = level >= exam.level && reputation >= exam.rep && accuracy >= exam.accuracy;
              return (
                <article className={`exam-card ${ready ? "ready" : ""}`} key={exam.name}>
                  <div className="exam-number">{index + 1}</div>
                  <h2>{exam.name}</h2>
                  <ul>
                    <li>Level {exam.level}</li>
                    <li>{exam.rep.toLocaleString()} reputation</li>
                    <li>{exam.accuracy}% lifetime accuracy</li>
                    <li>{exam.scenarios} exam scenarios</li>
                  </ul>
                  <button disabled={!ready}>{ready ? "Begin exam" : "Requirements not met"}</button>
                </article>
              );
            })}
          </div>
        </section>
      );
    }

    if (tab === "trophies") {
      return (
        <section className="v1-page">
          <div className="v1-page-header">
            <div><span className="eyebrow">Hall of Achievement</span><h1>Trophy Room</h1><p>Your permanent record of skill milestones and career promotions.</p></div>
          </div>
          <div className="trophy-grid">
            {achievementCatalog.map(item => {
              const unlocked = unlockedAchievements.some(a => a.id === item.id);
              return (
                <article className={`trophy-plinth ${unlocked ? "unlocked" : ""}`} key={item.id}>
                  <div className="trophy-cup">{unlocked ? "🏆" : "🔒"}</div>
                  <span>{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      );
    }

    if (tab === "stats") {
      return (
        <section className="v1-page">
          <div className="v1-page-header">
            <div><span className="eyebrow">Performance Lab</span><h1>Statistics</h1><p>Track the habits that matter more than a simple win rate.</p></div>
          </div>
          <div className="v1-stat-grid">
            <div><span>Lifetime accuracy</span><strong>{accuracy}%</strong></div>
            <div><span>Total scenarios</span><strong>{totalAttempts}</strong></div>
            <div><span>Correct decisions</span><strong>{correctAttempts}</strong></div>
            <div><span>Best combo</span><strong>×{bestCombo}</strong></div>
            <div><span>Saved mistakes</span><strong>{mistakes.length}</strong></div>
            <div><span>Fakeouts found</span><strong>{fakeoutsFound}</strong></div>
            <div><span>Correct waits</span><strong>{correctWaits}</strong></div>
            <div><span>Paper balance</span><strong>${paperBalance.toLocaleString(undefined,{maximumFractionDigits:0})}</strong></div>
            <div><span>Academy credits</span><strong>🪙 {points.toLocaleString()}</strong></div>
            <div><span>Reputation</span><strong>⭐ {reputation.toLocaleString()}</strong></div>
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
          <div className="section-heading">
            <div><span className="eyebrow">Community</span><h2>Streak leaderboard</h2></div>
          </div>
          <EmptyLeaderboard
            title="No traders have qualified yet"
            description="The streak leaderboard will populate when real Academy members complete eligible sessions."
            icon="🔥"
            actionLabel="Start practicing"
            onAction={() => setTab("train")}
          />
        </section>
      );
    }

    if (tab === "balance") {
      return (
        <section className="page-section">
          <div className="section-heading">
            <div><span className="eyebrow">Paper accounts</span><h2>Balance leaderboard</h2></div>
            <div className="points-pill">Current: ${paperBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <EmptyLeaderboard
            title="No balance leaders yet"
            description="Only real members with eligible active evaluations will appear here. Be the first trader to claim the top spot."
            icon="💰"
            actionLabel="Open an evaluation"
            onAction={() => setTab("home")}
          />
        </section>
      );
    }

    if (tab === "shop") {
      if (identityMode === "guest" || identityMode === "demo") {
        return (
          <section className="v1-page locked-v1-page">
            <div className="locked-feature-card">
              <div>🛍️</div>
              <h1>Marketplace requires a free account</h1>
              <p>
                Create an account to save purchases, equip cosmetics,
                and sync inventory across devices.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIdentityMode("account");
                  setTab("profile");
                }}
              >
                Create free account
              </button>
            </div>
          </section>
        );
      }

      return (
        <section className="page-section">
          <Marketplace
            points={points}
            level={level}
            reputation={reputation}
            premium={profilePremium}
            ownedItems={ownedShopItems}
            equippedItems={equippedShopItems}
            message={shopMessage}
            onBuy={buyShopItem}
            onEquip={equipShopItem}
          />
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
          <div className={`profile-card ${profileRole === "owner" ? "profile-owner" : ""}`}>
            <div className="avatar">
              {profileName.split(/\s+/).map(part => part[0]).join("").slice(0,2).toUpperCase() || "FA"}
            </div>
            <h2>{profileName}</h2>
            <span className={`premium-badge ${profileRole === "owner" ? "owner-badge" : ""}`}>
              {profileRole === "owner" ? "👑 OWNER" : profilePremium ? "PREMIUM" : "FREE MEMBER"}
            </span>
            <small className="profile-membership">{membershipLabel}</small>
            <div className="profile-stats">
              <div><strong>{level}</strong><span>Level</span></div>
              <div><strong>{xp}</strong><span>Total XP</span></div>
              <div><strong>{streak}</strong><span>Streak</span></div>
              <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
              <div><strong>{mistakes.length}</strong><span>Mistakes saved</span></div>
            </div>
          </div>
          <div className="auth-card">
            <h2>Account access</h2>
            {authUserId ? (
              <div className="signed-in-card">
                <div className="signed-in-icon">
                  {profileRole === "owner" ? "👑" : profilePremium ? "⭐" : "✓"}
                </div>
                <div className="signed-in-copy">
                  <span>Signed in as</span>
                  <strong>{profileName}</strong>
                  <small>{email}</small>
                  <div className="signed-in-tags">
                    <b>{membershipLabel}</b>
                    {profilePremium && <b>Premium</b>}
                    <b>Email verified</b>
                  </div>
                </div>
                <button type="button" className="sign-out-button" onClick={signOutAccount}>Sign out</button>
              </div>
            ) : (
              <>
                <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" /></label>
                <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" /></label>
                <div className="auth-buttons">
                  <button className="primary" onClick={() => auth("signin")}>Sign in</button>
                  <button className="secondary" onClick={() => auth("signup")}>Create account</button>
                </div>
                <p className="muted">{authMessage || (hasSupabase ? "Supabase accounts are enabled." : "Demo mode: no database keys configured.")}</p>
              </>
            )}
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
      <OwnerDashboard
        profileRole={profileRole}
        authUserId={authUserId}
      />
    );
  }, [tab, scenario, dailyScenario, choice, reveal, xp, streak, role, premium, email, password, authMessage, question, aiAnswer, aiLoading, canAdmin, level, practiceMode, accuracy, mistakes, selectedMistake, unlockedAchievements, soundEnabled, reducedMotion, showCelebration, totalAttempts, entryPrice, stopPrice, targetPrice, planFeedback, visibleCandles, replayRunning, replaySpeed, activePlacement, contracts, orderType, liveRiskPoints, liveRewardPoints, liveRR, estimatedLoss, estimatedProfit, lastPlacedLevel, combo, bestCombo, currentRankIndex, currentRank, nextRank, rankProgress, currentMode, dailyProgress, points, selectedAccountId, selectedAccount, paperBalance, peakBalance, trailingDrawdownFloor, drawdownRemaining, accountFailed, ownedShopItems, equippedShopItems, shopMessage, reputation, membershipLabel, profileName, profileRole, profilePremium, authUserId, showGuestImport, guestSnapshot, activeEvaluation, activeAccount, applyTradeResult]);

  if (identityMode === "landing") {
    return (
      <main className="welcome-screen">
        <div className="welcome-art" aria-hidden="true">
          <span>📈</span><span>🎯</span><span>🏆</span>
        </div>
        <section className="welcome-card">
          <div className="welcome-logo">FA</div>
          <span className="eyebrow">Interactive futures practice</span>
          <h1>Futures Academy</h1>
          <p>Learn break-and-retest trading through replay, paper accounts, progression, and guided practice.</p>
          <button className="welcome-primary" type="button" onClick={enterGuestMode}>👤 Continue as Guest</button>
          <button className="welcome-secondary" type="button" onClick={enterDemoMode}>▶ Try a Quick Demo</button>
          <button className="welcome-secondary" type="button" onClick={enterAccountMode}>⭐ Create Free Account / Sign In</button>
          <small>Guest progress is stored only on this device. Guests do not appear on leaderboards.</small>
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell app-mode-${practiceMode}`}>
      <header className="v1-topbar">
        <button className="brand brand-button" type="button" onClick={() => setTab("home")}>
          <span className="brand-mark">FA</span>
          <div><strong>Futures Academy</strong><span>Version 1.0 Foundation</span></div>
        </button>
        <div className="v1-status-strip">
          <span>⭐ {reputation.toLocaleString()}</span>
          <span>🪙 {points.toLocaleString()}</span>
          <span>LVL {level}</span>
          <span>{currentRank.name}</span>
          <span>{selectedAccount.icon} ${paperBalance.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
          <span>{membershipLabel}</span>
        </div>
      </header>
      <div className="v1-layout">
        <aside className="v1-sidebar">
          <div className="sidebar-group">
            <span>ACADEMY</span>
            {[
              ["home","🏛 Command Center"],
              ["train","📈 Trading Floor"],
              ["daily","🔥 Daily Mission"],
              ["handbook","📖 Handbook"],
              ["career","🎓 Career"],
              ["exams","📝 Promotion Exams"]
            ].map(([id,label]) => <button key={id} className={tab===id ? "active":""} onClick={()=>setTab(id as Tab)}>{label}</button>)}
          </div>
          <div className="sidebar-group">
            <span>FACILITIES</span>
            {[
              ["accounts","🏦 Account Vault"],
              ["mistakes","🎬 Replay Theater"],
              ["trophies","🏆 Trophy Room"],
              ["shop","🛍 Marketplace"]
            ].map(([id,label]) => <button key={id} className={tab===id ? "active":""} onClick={()=>setTab(id as Tab)}>{label}</button>)}
          </div>
          <div className="sidebar-group">
            <span>COMMUNITY</span>
            {[
              ["leaderboard","🔥 Streak Leaders"],
              ["balance","💰 Balance Leaders"],
              ["stats","📊 Statistics"],
              ["profile","👤 Profile"]
            ].map(([id,label]) => <button key={id} className={tab===id ? "active":""} onClick={()=>setTab(id as Tab)}>{label}</button>)}
          </div>
          <div className="sidebar-bottom">
            <button onClick={()=>setTab("settings")}>⚙ Settings</button>
            <button onClick={()=>setTab("admin")}>🔐 Admin</button>
          </div>
        </aside>
        <section className="v1-content">{content}</section>
      </div>
      {showGuestImport && authUserId && (
        <div className="tour-overlay">
          <section className="tour-card guest-import-card">
            <span className="tour-step">GUEST PROGRESS FOUND</span>
            <div className="tour-icon">💾</div>
            <h2>Keep your guest progress?</h2>
            <p>
              We found guest progress on this device. Importing keeps the higher XP,
              credits, reputation, and paper balance values.
            </p>
            <div className="guest-import-stats">
              <span>XP <strong>{guestSnapshot?.xp ?? 0}</strong></span>
              <span>Credits <strong>{guestSnapshot?.points ?? 0}</strong></span>
              <span>Reputation <strong>{guestSnapshot?.reputation ?? 0}</strong></span>
              <span>Balance <strong>${Number(guestSnapshot?.paperBalance ?? 0).toLocaleString()}</strong></span>
            </div>
            <div className="tour-actions">
              <button type="button" className="secondary" onClick={discardGuestProgress}>Start fresh</button>
              <button type="button" className="primary" onClick={importGuestProgress}>Import progress</button>
            </div>
          </section>
        </div>
      )}
      {showOnboarding && (
        <div className="tour-overlay">
          <section className="tour-card">
            <span className="tour-step">STEP {tourStep + 1} OF {tourSteps.length}</span>
            <div className="tour-icon">{["🏛️","📈","🎯","🛡️","🏦"][tourStep]}</div>
            <h2>{tourSteps[tourStep].title}</h2>
            <p>{tourSteps[tourStep].text}</p>
            <div className="tour-actions">
              <button type="button" className="secondary" onClick={() => setShowOnboarding(false)}>Skip</button>
              <button type="button" className="primary" onClick={() => {
                if (tourStep >= tourSteps.length - 1) {
                  setShowOnboarding(false);
                  setTab("home");
                } else {
                  setTourStep(step => step + 1);
                }
              }}>{tourStep >= tourSteps.length - 1 ? "Enter Academy" : "Next"}</button>
            </div>
          </section>
        </div>
      )}
      {guestPrompt && (
        <div className="guest-prompt">
          <span>🔒 {guestPrompt}</span>
          <button type="button" onClick={() => { setGuestPrompt(""); setIdentityMode("account"); setTab("profile"); }}>Create account</button>
          <button type="button" onClick={() => setGuestPrompt("")}>Not now</button>
        </div>
      )}
      <footer>Educational simulation only — synthetic market data, not live trade signals.</footer>
    </main>
  );
}

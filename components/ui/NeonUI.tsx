"use client";

import type { ReactNode } from "react";

export function RankEmblem({
  level,
  label,
  compact = false
}: {
  level: number;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className={`rank-emblem ${compact ? "rank-emblem-compact" : ""}`}>
      <div className="rank-emblem-glow" />
      <div className="rank-emblem-inner">
        <small>LEVEL</small>
        <strong>{level}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  label,
  size = 86
}: {
  value: number;
  label: string;
  size?: number;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--neon-cyan) ${normalized}%, rgba(255,255,255,.07) 0)`
      }}
    >
      <div className="progress-ring-inner">
        <strong>{Math.round(normalized)}%</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

export function NeonStat({
  icon,
  label,
  value,
  tone = "cyan"
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "cyan" | "violet" | "gold" | "green" | "red";
}) {
  return (
    <div className={`neon-stat neon-stat-${tone}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

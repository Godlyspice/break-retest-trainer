"use client";

import type { ReactNode } from "react";

export type AcademyIconName =
  | "command"
  | "trade"
  | "academy"
  | "career"
  | "handbook"
  | "daily"
  | "replay"
  | "trophy"
  | "marketplace"
  | "statistics"
  | "profile"
  | "settings"
  | "admin"
  | "evaluation"
  | "quest"
  | "class"
  | "skill"
  | "pattern"
  | "risk"
  | "psychology"
  | "reputation"
  | "points"
  | "streak"
  | "rank";

const paths: Record<AcademyIconName, ReactNode> = {
  command: (
    <>
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  trade: (
    <>
      <path d="M4 18V8M9 20V5M14 16V9M19 20V3" />
      <path d="M2 13h20" />
    </>
  ),
  academy: (
    <>
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M6 11v6l6 3 6-3v-6" />
    </>
  ),
  career: (
    <>
      <path d="M7 20h10M9 20v-7h6v7" />
      <path d="M8 7a4 4 0 1 1 8 0c0 2-1 3-4 5-3-2-4-3-4-5Z" />
    </>
  ),
  handbook: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23.5v-18Z" />
      <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5a3.5 3.5 0 0 1 3.5 3.5v-18Z" />
    </>
  ),
  daily: (
    <>
      <path d="m12 3 2.4 4.9L20 9l-4 3.9.9 5.6L12 16l-4.9 2.5L8 12.9 4 9l5.6-1.1L12 3Z" />
    </>
  ),
  replay: (
    <>
      <path d="M7 7H3v-4" />
      <path d="M3.5 7.5A9 9 0 1 1 5 18" />
      <path d="m10 9 5 3-5 3V9Z" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M6 6H3v2a4 4 0 0 0 4 4M18 6h3v2a4 4 0 0 1-4 4" />
      <path d="M12 13v5M8 21h8M9 18h6" />
    </>
  ),
  marketplace: (
    <>
      <path d="M4 8h16l-1 12H5L4 8Z" />
      <path d="M8 8a4 4 0 0 1 8 0" />
      <path d="M9 13h6" />
    </>
  ),
  statistics: (
    <>
      <path d="M4 20V11h4v9M10 20V5h4v15M16 20v-7h4v7" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22a8 8 0 0 1 16 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19 13.5 2-1.5-2-1.5-.5-2.1 1-2.2-2.4-1-1.6 1.4-2-.7L12 3 10.5 6l-2 .7-1.6-1.4-2.4 1 1 2.2-.5 2.1L3 12l2 1.5.5 2.1-1 2.2 2.4 1 1.6-1.4 2 .7L12 21l1.5-2.9 2-.7 1.6 1.4 2.4-1-1-2.2.5-2.1Z" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  evaluation: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h5M8 16h8" />
    </>
  ),
  quest: (
    <>
      <path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1-3-6Z" />
    </>
  ),
  class: (
    <>
      <path d="M12 3 5 7v10l7 4 7-4V7l-7-4Z" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  skill: (
    <>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="m8 11 8-4M8 13l8 4" />
    </>
  ),
  pattern: (
    <>
      <path d="M3 16c3 0 3-8 6-8s3 8 6 8 3-8 6-8" />
      <path d="M3 20h18" />
    </>
  ),
  risk: (
    <>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  psychology: (
    <>
      <path d="M9 4a4 4 0 0 0-4 4c0 2 1 3 2 4-1 1-2 2-2 4a4 4 0 0 0 4 4h2V4H9ZM15 4a4 4 0 0 1 4 4c0 2-1 3-2 4 1 1 2 2 2 4a4 4 0 0 1-4 4h-2V4h2Z" />
    </>
  ),
  reputation: (
    <>
      <path d="m12 3 2.6 5.3L20 9l-4 4 .9 5.7L12 16l-4.9 2.7L8 13 4 9l5.4-.7L12 3Z" />
    </>
  ),
  points: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h6M9 12h6M9 15h6" />
    </>
  ),
  streak: (
    <>
      <path d="M12 22c5 0 8-3 8-8 0-4-2-7-5-11 0 4-2 6-4 7 0-3-1-5-3-7 0 5-4 7-4 12 0 4 3 7 8 7Z" />
    </>
  ),
  rank: (
    <>
      <path d="M12 2 5 6v8c0 4 3 6 7 8 4-2 7-4 7-8V6l-7-4Z" />
      <path d="m12 7 1.6 3.2L17 11l-2.5 2.4.6 3.6-3.1-1.7L8.9 17l.6-3.6L7 11l3.4-.8L12 7Z" />
    </>
  )
};

const iconTones: Record<AcademyIconName, string> = {
  command: "violet",
  trade: "green",
  academy: "blue",
  career: "cyan",
  handbook: "blue",
  daily: "gold",
  replay: "violet",
  trophy: "gold",
  marketplace: "purple",
  statistics: "cyan",
  profile: "silver",
  settings: "silver",
  admin: "red",
  evaluation: "blue",
  quest: "gold",
  class: "cyan",
  skill: "violet",
  pattern: "purple",
  risk: "cyan",
  psychology: "gold",
  reputation: "violet",
  points: "cyan",
  streak: "gold",
  rank: "violet"
};

export function AcademyIcon({
  name,
  size = 22,
  className = "",
  framed = false
}: {
  name: AcademyIconName;
  size?: number;
  className?: string;
  framed?: boolean;
}) {
  return (
    <span
      className={[
        "academy-icon-shell",
        `academy-icon-${name}`,
        `academy-icon-tone-${iconTones[name]}`,
        framed ? "academy-icon-framed" : "",
        className
      ].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </svg>
    </span>
  );
}

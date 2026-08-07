"use client";

export type VaultTier = "starter" | "growth" | "pro" | "elite" | "funded";

const labels: Record<VaultTier, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Professional",
  elite: "Elite",
  funded: "Funded"
};

function TierArtwork({ tier }: { tier: VaultTier }) {
  if (tier === "starter") {
    return (
      <>
        <path className="vault-emblem-back" d="M50 8 80 19v25c0 23-13 37-30 47C33 81 20 67 20 44V19L50 8Z" />
        <path d="M50 13 75 22v21c0 19-10 32-25 41-15-9-25-22-25-41V22l25-9Z" />
        <path d="M50 62V38" />
        <path d="M50 45c-12 0-18-7-19-17 11 0 18 5 19 17Z" />
        <path d="M50 51c12 0 18-7 19-17-11 0-18 5-19 17Z" />
        <path className="vault-emblem-detail" d="M16 68c9 10 18 16 29 20M84 68c-9 10-18 16-29 20" />
      </>
    );
  }

  if (tier === "growth") {
    return (
      <>
        <path className="vault-emblem-back" d="m50 8 35 55-35 22-35-22L50 8Z" />
        <path d="m19 65 18-26 9 13 9-20 27 34-32 16-31-17Z" />
        <path d="m37 39 9 13 9-20 10 13-8-5-9 19-11-20Z" />
        <path className="vault-emblem-detail" d="M22 66h56M29 73h42" />
        <path d="m50 8 6 10-6 7-6-7 6-10Z" />
      </>
    );
  }

  if (tier === "pro") {
    return (
      <>
        <path className="vault-emblem-back" d="M18 80h64M25 74h50M31 67h38M26 36h48L67 26H33l-7 10Z" />
        <path d="M32 41h8v26h-8zM46 41h8v26h-8zM60 41h8v26h-8z" />
        <path d="M24 37h52M30 30h40M50 13l31 17H19L50 13Z" />
        <path className="vault-emblem-detail" d="M18 83c12 5 22 7 32 7s20-2 32-7" />
        <circle cx="50" cy="23" r="4" />
      </>
    );
  }

  if (tier === "elite") {
    return (
      <>
        <path className="vault-emblem-back" d="m50 14 24 13 8 25-32 33-32-33 8-25 24-13Z" />
        <path d="m28 31 15-10h14l15 10-22 44-22-44Z" />
        <path d="M28 31h44M43 21l7 10 7-10M50 31v44M28 31l22 44 22-44" />
        <path className="vault-emblem-detail" d="M14 69c8 10 17 16 28 20M86 69c-8 10-17 16-28 20" />
        <path className="vault-emblem-detail" d="M17 62c-7-2-10-6-11-11 7 0 12 3 14 9M83 62c7-2 10-6 11-11-7 0-12 3-14 9" />
      </>
    );
  }

  return (
    <>
      <path className="vault-emblem-back" d="M26 84c3-14 10-24 21-30-8-5-13-14-13-24 0-12 8-21 20-23 15 3 24 14 24 29 0 8-3 15-9 21 8 7 13 16 15 27H26Z" />
      <path d="M35 34c4-15 15-24 31-25-3 7-4 14-2 21 7 2 12 6 15 12-8 0-14 2-20 6-6-3-13-5-21-5l-3-9Z" />
      <path d="M42 47c5 7 11 11 18 11s13-4 18-11" />
      <path d="M46 54v11l14 8 14-8V54" />
      <path d="M31 84c4-12 10-20 19-25M89 84c-4-12-10-20-19-25" />
      <path className="vault-emblem-detail" d="M53 18c-2 8 0 16 5 23M62 17c0 8 3 14 9 20" />
      <path d="M43 30c8-5 17-6 28-3" />
    </>
  );
}

export function AccountVaultEmblem({
  tier,
  locked = false,
  compact = false
}: {
  tier: VaultTier;
  locked?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`account-vault-emblem account-vault-${tier} ${
        locked ? "account-vault-locked" : ""
      } ${compact ? "account-vault-compact" : ""}`}
      aria-label={`${labels[tier]} evaluation emblem`}
    >
      <span className="vault-emblem-aura" />
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <TierArtwork tier={tier} />
      </svg>
      {locked && <span className="account-vault-lock">🔒</span>}
    </span>
  );
}

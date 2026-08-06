"use client";

import { useState } from "react";
import {
  evaluationAccounts,
  type EvaluationAccount
} from "@/lib/evaluations";
import styles from "./AccountSelector.module.css";

type Props = {
  points: number;
  reputation: number;
  activeAccountId?: string | null;
  identityMode: "landing" | "guest" | "demo" | "account";
  onStart: (account: EvaluationAccount) => Promise<{
    ok: boolean;
    message?: string;
  }>;
};

export default function AccountSelector({
  points,
  reputation,
  activeAccountId,
  identityMode,
  onStart
}: Props) {
  const [pending, setPending] = useState<EvaluationAccount | null>(null);
  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);

  async function confirmStart() {
    if (!pending) return;
    setStarting(true);
    const result = await onStart(pending);
    setStarting(false);

    if (!result.ok) {
      setMessage(result.message || "The evaluation could not be started.");
      return;
    }

    setMessage(`${pending.name} started successfully.`);
    setPending(null);
  }

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <span>PROP-STYLE PAPER TRAINING</span>
          <h2>Choose your training account</h2>
          <p>
            Each evaluation includes a profit target, drawdown, daily loss
            limit, consistency rule, and contract cap.
          </p>
        </div>
        <div className={styles.currency}>🪙 {points.toLocaleString()} points</div>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.grid}>
        {evaluationAccounts.map(account => {
          const reputationLocked =
            reputation < account.reputationRequired;
          const guestLocked =
            (identityMode === "guest" || identityMode === "demo") &&
            account.id !== "starter";
          const locked = reputationLocked || guestLocked;
          const active = activeAccountId === account.id;

          return (
            <article
              className={`${styles.card} ${
                active ? styles.active : ""
              } ${locked ? styles.locked : ""}`}
              key={account.id}
            >
              <div className={styles.cardTop}>
                <div className={styles.icon}>{locked ? "🔒" : account.icon}</div>
                <div>
                  <span className={styles.difficulty}>
                    {account.difficulty}
                  </span>
                  <h3>{account.name}</h3>
                </div>
                {active && <b className={styles.activeBadge}>ACTIVE</b>}
              </div>

              <div className={styles.balance}>
                <span>Starting balance</span>
                <strong>${account.balance.toLocaleString()}</strong>
              </div>

              <div className={styles.rules}>
                <div>
                  <span>🎯 Profit target</span>
                  <strong>+${account.profitTarget.toLocaleString()}</strong>
                </div>
                <div>
                  <span>📉 Trailing drawdown</span>
                  <strong>${account.maxDrawdown.toLocaleString()}</strong>
                </div>
                <div>
                  <span>🛑 Daily loss limit</span>
                  <strong>${account.dailyLossLimit.toLocaleString()}</strong>
                </div>
                <div>
                  <span>⚖️ Consistency</span>
                  <strong>{account.consistencyPercent}%</strong>
                </div>
                <div>
                  <span>📊 Max contracts</span>
                  <strong>{account.maxContracts} MES</strong>
                </div>
                <div>
                  <span>↻ Reset</span>
                  <strong>{account.resetCost.toLocaleString()} pts</strong>
                </div>
              </div>

              <p className={styles.description}>{account.description}</p>

              {locked ? (
                <button className={styles.lockedButton} type="button" disabled>
                  {guestLocked
                    ? "Create account to unlock"
                    : `${account.reputationRequired.toLocaleString()} reputation required`}
                </button>
              ) : (
                <button
                  className={styles.startButton}
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setPending(account);
                  }}
                >
                  Start with {account.shortName}
                  <small>Launch paper evaluation</small>
                </button>
              )}
            </article>
          );
        })}
      </div>

      {pending && (
        <div
          className={styles.backdrop}
          onPointerDown={event => {
            if (event.currentTarget === event.target && !starting) {
              setPending(null);
            }
          }}
        >
          <section className={styles.modal}>
            <button
              className={styles.close}
              type="button"
              onClick={() => setPending(null)}
              disabled={starting}
            >
              ×
            </button>

            <span className={styles.modalEyebrow}>OPEN EVALUATION</span>
            <div className={styles.modalIcon}>{pending.icon}</div>
            <h2>{pending.name}</h2>
            <p>
              Starting a new evaluation replaces the currently active paper
              account.
            </p>

            <div className={styles.modalRules}>
              <div><span>Balance</span><strong>${pending.balance.toLocaleString()}</strong></div>
              <div><span>Profit target</span><strong>+${pending.profitTarget.toLocaleString()}</strong></div>
              <div><span>Trailing drawdown</span><strong>-${pending.maxDrawdown.toLocaleString()}</strong></div>
              <div><span>Daily loss limit</span><strong>-${pending.dailyLossLimit.toLocaleString()}</strong></div>
              <div><span>Consistency rule</span><strong>{pending.consistencyPercent}%</strong></div>
              <div><span>Maximum contracts</span><strong>{pending.maxContracts} MES</strong></div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancel}
                type="button"
                onClick={() => setPending(null)}
                disabled={starting}
              >
                Cancel
              </button>
              <button
                className={styles.confirm}
                type="button"
                onClick={confirmStart}
                disabled={starting}
              >
                {starting ? "Starting…" : `Start ${pending.shortName} Evaluation`}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

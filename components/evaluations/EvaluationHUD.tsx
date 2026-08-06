"use client";

import type { ActiveEvaluation } from "@/hooks/useEvaluation";
import type { EvaluationAccount } from "@/lib/evaluations";
import styles from "./EvaluationHUD.module.css";

export default function EvaluationHUD({
  evaluation,
  account
}: {
  evaluation: ActiveEvaluation;
  account: EvaluationAccount;
}) {
  const targetBalance = account.balance + account.profitTarget;
  const profitProgress = Math.max(
    0,
    Math.min(
      100,
      ((evaluation.currentBalance - account.balance) / account.profitTarget) *
        100
    )
  );

  const trailingFloor = Math.max(
    account.balance - account.maxDrawdown,
    evaluation.peakBalance - account.maxDrawdown
  );

  const drawdownRemaining = Math.max(
    0,
    evaluation.currentBalance - trailingFloor
  );

  const dailyLossUsed = Math.max(
    0,
    evaluation.dailyStartBalance - evaluation.currentBalance
  );

  const consistency =
    evaluation.totalProfit > 0 && evaluation.bestDayProfit > 0
      ? (evaluation.bestDayProfit / evaluation.totalProfit) * 100
      : 0;

  return (
    <section className={`${styles.hud} ${styles[evaluation.status]}`}>
      <div className={styles.identity}>
        <span>{account.icon}</span>
        <div>
          <small>ACTIVE EVALUATION</small>
          <strong>{account.name}</strong>
        </div>
        <b>{evaluation.status.toUpperCase()}</b>
      </div>

      <div className={styles.metric}>
        <span>Balance</span>
        <strong>
          ${evaluation.currentBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </strong>
      </div>

      <div className={styles.metric}>
        <span>Profit target</span>
        <strong>
          ${targetBalance.toLocaleString()} · {profitProgress.toFixed(0)}%
        </strong>
        <i><em style={{ width: `${profitProgress}%` }} /></i>
      </div>

      <div className={styles.metric}>
        <span>Drawdown remaining</span>
        <strong>${drawdownRemaining.toFixed(2)}</strong>
        <i>
          <em
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  (drawdownRemaining / account.maxDrawdown) * 100
                )
              )}%`
            }}
          />
        </i>
      </div>

      <div className={styles.metric}>
        <span>Daily loss used</span>
        <strong>
          ${dailyLossUsed.toFixed(2)} / ${account.dailyLossLimit.toLocaleString()}
        </strong>
      </div>

      <div className={styles.metric}>
        <span>Consistency</span>
        <strong>
          {consistency.toFixed(1)}% / {account.consistencyPercent}%
        </strong>
      </div>
    </section>
  );
}

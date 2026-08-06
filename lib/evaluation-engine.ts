import type { EvaluationAccount } from "@/lib/evaluations";
import type { ActiveEvaluation } from "@/hooks/useEvaluation";

export type EvaluationResult = {
  next: ActiveEvaluation;
  trailingFloor: number;
  drawdownRemaining: number;
  dailyLossUsed: number;
  consistencyPercent: number;
  passed: boolean;
  failed: boolean;
  failureReason: string | null;
};

export function evaluateTradeResult(
  current: ActiveEvaluation,
  account: EvaluationAccount,
  netProfit: number
): EvaluationResult {
  const nextBalance = current.currentBalance + netProfit;
  const nextPeak = Math.max(current.peakBalance, nextBalance);
  const nextTotalProfit = current.totalProfit + netProfit;
  const nextBestDayProfit = Math.max(current.bestDayProfit, netProfit);

  const trailingFloor = Math.max(
    account.balance - account.maxDrawdown,
    nextPeak - account.maxDrawdown
  );

  const drawdownRemaining = Math.max(0, nextBalance - trailingFloor);
  const dailyLossUsed = Math.max(0, current.dailyStartBalance - nextBalance);
  const profitableTotal = Math.max(0, nextTotalProfit);
  const consistencyPercent =
    profitableTotal > 0 && nextBestDayProfit > 0
      ? (nextBestDayProfit / profitableTotal) * 100
      : 0;

  let failed = false;
  let failureReason: string | null = null;

  if (nextBalance <= trailingFloor) {
    failed = true;
    failureReason = "Trailing drawdown reached";
  } else if (dailyLossUsed >= account.dailyLossLimit) {
    failed = true;
    failureReason = "Daily loss limit reached";
  }

  const targetReached =
    nextBalance >= account.balance + account.profitTarget;

  const consistencySatisfied =
    consistencyPercent <= account.consistencyPercent ||
    nextTotalProfit <= 0;

  const passed = !failed && targetReached && consistencySatisfied;

  return {
    next: {
      ...current,
      currentBalance: nextBalance,
      peakBalance: nextPeak,
      bestDayProfit: nextBestDayProfit,
      totalProfit: nextTotalProfit,
      status: passed ? "passed" : failed ? "failed" : "active"
    },
    trailingFloor,
    drawdownRemaining,
    dailyLossUsed,
    consistencyPercent,
    passed,
    failed,
    failureReason
  };
}

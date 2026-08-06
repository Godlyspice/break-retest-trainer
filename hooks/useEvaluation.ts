"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  evaluationAccounts,
  type EvaluationAccount
} from "@/lib/evaluations";
import { evaluateTradeResult } from "@/lib/evaluation-engine";

export type ActiveEvaluation = {
  id?: string;
  accountId: EvaluationAccount["id"];
  startingBalance: number;
  currentBalance: number;
  peakBalance: number;
  dailyStartBalance: number;
  bestDayProfit: number;
  totalProfit: number;
  status: "active" | "passed" | "failed";
  startedAt: string;
};

type StartEvaluationResult =
  | { ok: true; evaluation: ActiveEvaluation }
  | { ok: false; message: string };

export type ApplyTradeResult = {
  ok: boolean;
  message: string;
  evaluation?: ActiveEvaluation;
  passed?: boolean;
  failed?: boolean;
  failureReason?: string | null;
  consistencyPercent?: number;
  drawdownRemaining?: number;
  dailyLossUsed?: number;
};

const STORAGE_KEY = "futures-academy-active-evaluation-v2";

function createLocalEvaluation(account: EvaluationAccount): ActiveEvaluation {
  return {
    accountId: account.id,
    startingBalance: account.balance,
    currentBalance: account.balance,
    peakBalance: account.balance,
    dailyStartBalance: account.balance,
    bestDayProfit: 0,
    totalProfit: 0,
    status: "active",
    startedAt: new Date().toISOString()
  };
}

export function useEvaluation(userId: string | null) {
  const [activeEvaluation, setActiveEvaluation] =
    useState<ActiveEvaluation | null>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingEvaluation(true);
      const client = supabase;

      if (client && userId) {
        const { data } = await client
          .from("evaluation_accounts")
          .select(
            "id, account_type, starting_balance, current_balance, peak_balance, daily_start_balance, best_day_profit, total_profit, status, started_at"
          )
          .eq("user_id", userId)
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && data) {
          setActiveEvaluation({
            id: data.id,
            accountId: data.account_type,
            startingBalance: Number(data.starting_balance),
            currentBalance: Number(data.current_balance),
            peakBalance: Number(data.peak_balance),
            dailyStartBalance: Number(data.daily_start_balance),
            bestDayProfit: Number(data.best_day_profit),
            totalProfit: Number(data.total_profit),
            status: data.status,
            startedAt: data.started_at
          });
          setLoadingEvaluation(false);
          return;
        }
      }

      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!cancelled && stored) {
          setActiveEvaluation(JSON.parse(stored));
        }
      } catch {
        // A broken local save should never block the application.
      }

      if (!cancelled) setLoadingEvaluation(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const startEvaluation = useCallback(
    async (
      account: EvaluationAccount,
      reputation: number,
      identityMode: "landing" | "guest" | "demo" | "account"
    ): Promise<StartEvaluationResult> => {
      if (
        (identityMode === "guest" || identityMode === "demo") &&
        account.id !== "starter"
      ) {
        return {
          ok: false,
          message:
            "Guests can use the Starter Evaluation. Create a free account to unlock larger evaluations."
        };
      }

      if (reputation < account.reputationRequired) {
        return {
          ok: false,
          message: `Requires ${account.reputationRequired.toLocaleString()} reputation.`
        };
      }

      const localEvaluation = createLocalEvaluation(account);
      const client = supabase;

      if (client && userId) {
        const { data, error } = await client.rpc("start_evaluation", {
          requested_account_type: account.id
        });

        if (error) {
          return { ok: false, message: error.message };
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          localEvaluation.id = row.id;
          localEvaluation.currentBalance = Number(row.current_balance);
          localEvaluation.peakBalance = Number(row.peak_balance);
          localEvaluation.startingBalance = Number(row.starting_balance);
          localEvaluation.startedAt = row.started_at;
        }
      }

      setActiveEvaluation(localEvaluation);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(localEvaluation)
      );

      return { ok: true, evaluation: localEvaluation };
    },
    [userId]
  );

  const updateLocalEvaluation = useCallback(
    (patch: Partial<ActiveEvaluation>) => {
      setActiveEvaluation(current => {
        if (!current) return current;
        const next = { ...current, ...patch };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const applyTradeResult = useCallback(
    async (netProfit: number): Promise<ApplyTradeResult> => {
      if (!activeEvaluation) {
        return {
          ok: false,
          message: "Start an evaluation before submitting simulator results."
        };
      }

      const account = evaluationAccounts.find(
        item => item.id === activeEvaluation.accountId
      );

      if (!account) {
        return { ok: false, message: "Evaluation rules could not be loaded." };
      }

      if (activeEvaluation.status !== "active") {
        return {
          ok: false,
          message: `This evaluation is already ${activeEvaluation.status}.`
        };
      }

      const result = evaluateTradeResult(
        activeEvaluation,
        account,
        netProfit
      );

      const client = supabase;

      if (client && userId && activeEvaluation.id) {
        const { data, error } = await client.rpc("apply_evaluation_trade", {
          evaluation_id: activeEvaluation.id,
          net_profit: netProfit
        });

        if (error) {
          return { ok: false, message: error.message };
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          result.next = {
            id: row.id,
            accountId: row.account_type,
            startingBalance: Number(row.starting_balance),
            currentBalance: Number(row.current_balance),
            peakBalance: Number(row.peak_balance),
            dailyStartBalance: Number(row.daily_start_balance),
            bestDayProfit: Number(row.best_day_profit),
            totalProfit: Number(row.total_profit),
            status: row.status,
            startedAt: row.started_at
          };
        }
      }

      setActiveEvaluation(result.next);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(result.next)
      );

      return {
        ok: true,
        message: result.passed
          ? "Evaluation passed."
          : result.failed
          ? `Evaluation failed: ${result.failureReason}.`
          : netProfit >= 0
          ? `Evaluation balance increased by $${netProfit.toFixed(2)}.`
          : `Evaluation balance decreased by $${Math.abs(netProfit).toFixed(2)}.`,
        evaluation: result.next,
        passed: result.passed,
        failed: result.failed,
        failureReason: result.failureReason,
        consistencyPercent: result.consistencyPercent,
        drawdownRemaining: result.drawdownRemaining,
        dailyLossUsed: result.dailyLossUsed
      };
    },
    [activeEvaluation, userId]
  );

  const activeAccount =
    evaluationAccounts.find(
      account => account.id === activeEvaluation?.accountId
    ) || null;

  return {
    activeEvaluation,
    activeAccount,
    loadingEvaluation,
    startEvaluation,
    updateLocalEvaluation,
    applyTradeResult
  };
}

export type EvaluationAccount = {
  id: "starter" | "growth" | "pro" | "elite" | "challenge";
  name: string;
  shortName: string;
  icon: string;
  balance: number;
  profitTarget: number;
  maxDrawdown: number;
  dailyLossLimit: number;
  consistencyPercent: number;
  maxContracts: number;
  resetCost: number;
  reputationRequired: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert" | "Master";
  description: string;
};

export const evaluationAccounts: EvaluationAccount[] = [
  {
    id: "starter",
    name: "Starter Evaluation",
    shortName: "$10K",
    icon: "🟦",
    balance: 10000,
    profitTarget: 600,
    maxDrawdown: 600,
    dailyLossLimit: 300,
    consistencyPercent: 30,
    maxContracts: 1,
    resetCost: 500,
    reputationRequired: 0,
    difficulty: "Beginner",
    description: "A focused introduction to evaluation rules and disciplined risk."
  },
  {
    id: "growth",
    name: "Growth Evaluation",
    shortName: "$25K",
    icon: "🟩",
    balance: 25000,
    profitTarget: 1500,
    maxDrawdown: 1500,
    dailyLossLimit: 750,
    consistencyPercent: 30,
    maxContracts: 3,
    resetCost: 1500,
    reputationRequired: 500,
    difficulty: "Intermediate",
    description: "Balanced limits for traders building consistency and patience."
  },
  {
    id: "pro",
    name: "Professional Evaluation",
    shortName: "$50K",
    icon: "🟪",
    balance: 50000,
    profitTarget: 3000,
    maxDrawdown: 2500,
    dailyLossLimit: 1250,
    consistencyPercent: 30,
    maxContracts: 5,
    resetCost: 4000,
    reputationRequired: 2500,
    difficulty: "Advanced",
    description: "A larger account with tighter performance expectations."
  },
  {
    id: "elite",
    name: "Elite Evaluation",
    shortName: "$100K",
    icon: "🟨",
    balance: 100000,
    profitTarget: 6000,
    maxDrawdown: 4000,
    dailyLossLimit: 2000,
    consistencyPercent: 25,
    maxContracts: 10,
    resetCost: 10000,
    reputationRequired: 8000,
    difficulty: "Expert",
    description: "High-level paper evaluation for proven Academy traders."
  },
  {
    id: "challenge",
    name: "Funded Challenge",
    shortName: "$150K",
    icon: "🟥",
    balance: 150000,
    profitTarget: 9000,
    maxDrawdown: 5000,
    dailyLossLimit: 2500,
    consistencyPercent: 25,
    maxContracts: 15,
    resetCost: 25000,
    reputationRequired: 20000,
    difficulty: "Master",
    description: "The Academy's most demanding evaluation account."
  }
];

export const careerRanks = [
  { name: "Recruit", min: 0, reputation: 0, icon: "◇", tone: "slate" },
  { name: "Cadet", min: 2500, reputation: 100, icon: "◆", tone: "blue" },
  { name: "Junior Trader", min: 6000, reputation: 300, icon: "✦", tone: "cyan" },
  { name: "Trader", min: 12000, reputation: 700, icon: "◈", tone: "violet" },
  { name: "Senior Trader", min: 22000, reputation: 1500, icon: "★", tone: "purple" },
  { name: "Professional Trader", min: 40000, reputation: 3000, icon: "⬢", tone: "blue" },
  { name: "Elite Trader", min: 70000, reputation: 6000, icon: "✧", tone: "gold" },
  { name: "Market Specialist", min: 120000, reputation: 12000, icon: "◉", tone: "cyan" },
  { name: "Funded Candidate", min: 200000, reputation: 25000, icon: "♜", tone: "green" },
  { name: "Futures Master", min: 350000, reputation: 50000, icon: "♛", tone: "gold" },
  { name: "Institutional Trader", min: 600000, reputation: 100000, icon: "✺", tone: "violet" },
  { name: "Academy Legend", min: 1000000, reputation: 200000, icon: "✹", tone: "legendary" }
] as const;

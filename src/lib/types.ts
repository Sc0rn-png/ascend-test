export type AssetCategory =
  | 'PEA'
  | 'CTO'
  | 'Bitcoin'
  | 'Livret A'
  | 'Cash'
  | 'Compte courant'
  | 'Autres';

export const ASSET_CATEGORIES: AssetCategory[] = [
  'PEA',
  'CTO',
  'Bitcoin',
  'Livret A',
  'Cash',
  'Compte courant',
  'Autres',
];

export const FINANCIAL_CATEGORIES: AssetCategory[] = [
  'PEA',
  'CTO',
  'Bitcoin',
  'Livret A',
  'Cash',
  'Compte courant',
];

export function isFinancialCategory(cat: AssetCategory): boolean {
  return FINANCIAL_CATEGORIES.includes(cat);
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  target: number;
  previousValue: number;
}

export interface NonFinancialAsset {
  id: string;
  name: string;
  category: string;
  value: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
}

export interface Debt {
  id: string;
  name: string;
  amount: number;
  previousAmount: number;
}

// Feuille de route ajustée (Objectifs par Année/Trimestre)
export interface RoadmapGoal {
  id: string;
  label: string;
  target: number;
  current: number;
  done: boolean;
  quarter: string; // Ex: '2026', '2027' ou 'T3 2026'
}

// Business Metrics - L'Étendard (Aujourd'hui & Demain)
export interface BusinessMetrics {
  ca: number;
  profit: number;
  adSpend: number;
  orders: number;
  avgBasket: number;
  conversion: number;
  treasury: number;
  previousCa: number;
  targetMonthlyIncome: number; // Objectif Ex: 1 000 €/mois
}

export interface InvestmentPlan {
  PEA: number;
  CTO: number;
  Bitcoin: number;
  LivretA: number;
}

export interface TargetAllocation {
  PEA: number;
  CTO: number;
  Bitcoin: number;
  LivretA: number;
  Cash: number;
}

// Snapshot mensuel complet pour les graphiques & rapports auto
export interface Snapshot {
  id: string; // '2026-08'
  date: string;
  netWorth: number;
  financialPatrimoine: number;
  nonFinancialPatrimoine: number;
  assets: { name: string; category: AssetCategory; value: number }[];
  nonFinancialAssets: { name: string; category: string; value: number }[];
  debt: number;
  income: number;
  businessCa: number;
  businessProfit: number;
}

// Gamification / Succès
export interface Achievement {
  id: string;
  label: string;
  description: string;
  threshold: number;
  metric: 'netWorth' | 'firstInvestment' | 'debtCleared' | 'businessIncome' | 'patrimoine';
  unlocked: boolean;
}

// Calculs statistiques automatiques (Phase 1 & Phase 5)
export interface PerformanceStats {
  monthlyProgress: number;          // + € du mois
  progressFromJanuary: number;      // + € depuis Janvier
  historicalRecord: number;         // Record net worth atteint
  remainingCapitalToBuild: number;  // Capital restant avant objectif final
  estimatedTargetDate: string;      // Date estimée d'atteinte de l'objectif
  patrimoineCreatedTotal: number;   // Patrimoine créé depuis le lancement
  averageCapitalPerMonth: number;   // Capital moyen créé / mois
}

export interface AppState {
  goal: number; // Ex: 50 000 €
  targetDate: string; // Ex: '2029-12-08'
  assets: Asset[];
  nonFinancialAssets: NonFinancialAsset[];
  includeNonFinancialInNetWorth: boolean;
  incomes: IncomeSource[];
  debts: Debt[];
  roadmap: RoadmapGoal[];
  business: BusinessMetrics;
  investmentPlan: InvestmentPlan;
  targetAllocation: TargetAllocation;
  snapshots: Snapshot[];
  achievements: Achievement[];
  theme: 'dark' | 'light';
  lastUpdateMonth: string | null;
}

export const DEFAULT_TARGET_ALLOCATION: TargetAllocation = {
  PEA: 20,
  CTO: 45,
  Bitcoin: 10,
  LivretA: 10,
  Cash: 15,
};

export const DEFAULT_INVESTMENT_PLAN: InvestmentPlan = {
  PEA: 250,
  CTO: 200,
  Bitcoin: 50,
  LivretA: 100,
};

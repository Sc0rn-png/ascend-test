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

export interface RoadmapGoal {
  id: string;
  label: string;
  target: number;
  current: number;
  done: boolean;
  quarter: string;
}

export interface BusinessMetrics {
  ca: number;
  profit: number;
  adSpend: number;
  orders: number;
  avgBasket: number;
  conversion: number;
  treasury: number;
  previousCa: number;
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

export interface Snapshot {
  id: string;
  date: string;
  netWorth: number;
  financialPatrimoine: number;
  nonFinancialPatrimoine: number;
  assets: { name: string; category: AssetCategory; value: number }[];
  nonFinancialAssets: { name: string; category: string; value: number }[];
  debt: number;
  income: number;
  business: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  threshold: number;
  metric: 'netWorth' | 'firstInvestment' | 'debtCleared' | 'businessIncome' | 'patrimoine';
  unlocked: boolean;
}

export interface AppState {
  goal: number;
  targetDate: string;
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

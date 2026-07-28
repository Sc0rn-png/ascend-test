import type { AppState, Asset } from './types';
import { isFinancialCategory } from './types';

export function totalAssets(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.value, 0);
}

export function financialAssets(state: AppState): Asset[] {
  return state.assets.filter((a) => isFinancialCategory(a.category));
}

export function totalFinancialAssets(state: AppState): number {
  return financialAssets(state).reduce((sum, a) => sum + a.value, 0);
}

export function totalNonFinancialAssets(state: AppState): number {
  return state.nonFinancialAssets.reduce((sum, a) => sum + a.value, 0);
}

export function totalDebt(state: AppState): number {
  return state.debts.reduce((sum, d) => sum + d.amount, 0);
}

export function totalIncome(state: AppState): number {
  return state.incomes.reduce((sum, i) => sum + i.amount, 0);
}

export function netWorth(state: AppState): number {
  const financial = totalFinancialAssets(state);
  const nonFinancial = state.includeNonFinancialInNetWorth ? totalNonFinancialAssets(state) : 0;
  return financial + nonFinancial - totalDebt(state);
}

export function previousNetWorth(state: AppState): number {
  const prevFinancial = state.assets.reduce((sum, a) => sum + a.previousValue, 0);
  const prevNonFinancial = state.includeNonFinancialInNetWorth ? totalNonFinancialAssets(state) : 0;
  const prevDebt = state.debts.reduce((sum, d) => sum + d.previousAmount, 0);
  return prevFinancial + prevNonFinancial - prevDebt;
}

export function netWorthEvolution(state: AppState): number {
  return netWorth(state) - previousNetWorth(state);
}

export function financialPatrimoine(state: AppState): number {
  return totalFinancialAssets(state);
}

export function cashAvailable(state: AppState): number {
  const cash = state.assets.filter((a) => a.category === 'Cash' || a.category === 'Compte courant' || a.category === 'Livret A');
  return cash.reduce((sum, a) => sum + a.value, 0);
}

export function investedPatrimoine(state: AppState): number {
  const invested = state.assets.filter((a) => ['PEA', 'CTO', 'Bitcoin', 'Autres'].includes(a.category));
  return invested.reduce((sum, a) => sum + a.value, 0);
}

export function savingsRate(state: AppState): number {
  const income = totalIncome(state);
  if (income === 0) return 0;
  const net = netWorthEvolution(state);
  return Math.max(0, Math.min(100, (net / income) * 100));
}

export function independentIncome(state: AppState): number {
  const business = state.incomes.find((i) => i.name.toLowerCase() === 'business');
  return business?.amount ?? state.business.profit;
}

export function daysUntilTarget(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function progressPercent(state: AppState): number {
  if (state.goal === 0) return 0;
  return Math.min(100, (netWorth(state) / state.goal) * 100);
}

export function formatDateFR(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

export function monthLabelLong(key: string): string {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function actualAllocation(state: AppState): { name: string; value: number; percent: number }[] {
  const groups: Record<string, number> = {};
  for (const a of financialAssets(state)) {
    const key = a.category === 'Livret A' ? 'LivretA' : a.category === 'Compte courant' ? 'Cash' : a.category;
    groups[key] = (groups[key] ?? 0) + a.value;
  }
  const total = totalFinancialAssets(state);
  if (total === 0) return [];
  return Object.entries(groups).map(([name, value]) => ({
    name,
    value,
    percent: (value / total) * 100,
  }));
}

export function allocationGap(state: AppState): { name: string; actual: number; target: number; diff: number }[] {
  const actual = actualAllocation(state);
  const target = state.targetAllocation;
  const keys = Array.from(new Set([...Object.keys(target), ...actual.map((a) => a.name)]));
  return keys.map((k) => {
    const a = actual.find((x) => x.name === k)?.percent ?? 0;
    const t = (target as unknown as Record<string, number>)[k] ?? 0;
    return { name: k, actual: a, target: t, diff: a - t };
  });
}

export interface KPI {
  label: string;
  value: number;
  display: string;
  hint?: string;
}

export function computeKPIs(state: AppState): KPI[] {
  return [
    { label: 'Valeur nette', value: netWorth(state), display: '', hint: 'Patrimoine moins dettes' },
    { label: 'Patrimoine financier', value: financialPatrimoine(state), display: '' },
    { label: 'Cash disponible', value: cashAvailable(state), display: '' },
    { label: 'Dette', value: totalDebt(state), display: '' },
    { label: 'Taux d\'épargne', value: savingsRate(state), display: '', hint: 'Sur revenus mensuels' },
    { label: 'Patrimoine investi', value: investedPatrimoine(state), display: '' },
    { label: 'Revenus indépendants', value: independentIncome(state), display: '' },
    { label: 'Total revenus', value: totalIncome(state), display: '' },
  ];
}

export function globalScore(state: AppState): { score: number; label: string } {
  let score = 0;
  const net = netWorth(state);
  score += Math.min(40, (net / state.goal) * 40);
  score += Math.min(15, (cashAvailable(state) / 5000) * 15);
  const debtRatio = totalDebt(state) / Math.max(1, net);
  score += Math.max(0, 15 - debtRatio * 15);
  score += Math.min(15, (savingsRate(state) / 100) * 15);
  score += Math.min(15, (investedPatrimoine(state) / 10000) * 15);
  score = Math.min(100, Math.round(score));
  let label = 'À améliorer';
  if (score >= 85) label = 'Excellent';
  else if (score >= 70) label = 'Très bon';
  else if (score >= 50) label = 'Correct';
  else if (score >= 30) label = 'En progression';
  return { score, label };
}

export function computeLevel(state: AppState): number {
  const net = netWorth(state);
  const income = totalIncome(state);
  const goalsDone = state.roadmap.filter((g) => g.done).length;
  const points = net / 1000 + income / 200 + goalsDone * 2;
  return Math.max(1, Math.floor(points / 3));
}

export function recomputeAchievements(state: AppState): AppState['achievements'] {
  const net = netWorth(state);
  const invested = investedPatrimoine(state);
  const debt = totalDebt(state);
  const bizIncome = independentIncome(state);
  return state.achievements.map((a) => {
    let unlocked = a.unlocked;
    switch (a.metric) {
      case 'netWorth':
        unlocked = unlocked || net >= a.threshold;
        break;
      case 'firstInvestment':
        unlocked = unlocked || invested >= a.threshold;
        break;
      case 'patrimoine':
        unlocked = unlocked || net >= a.threshold;
        break;
      case 'debtCleared':
        unlocked = unlocked || debt <= a.threshold;
        break;
      case 'businessIncome':
        unlocked = unlocked || bizIncome >= a.threshold;
        break;
    }
    return { ...a, unlocked };
  });
}

export function createSnapshot(state: AppState): AppState['snapshots'][number] {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return {
    id: Math.random().toString(36).slice(2, 10),
    date,
    netWorth: netWorth(state),
    financialPatrimoine: totalFinancialAssets(state),
    nonFinancialPatrimoine: totalNonFinancialAssets(state),
    assets: financialAssets(state).map((a) => ({ name: a.name, category: a.category, value: a.value })),
    nonFinancialAssets: state.nonFinancialAssets.map((a) => ({ name: a.name, category: a.category, value: a.value })),
    debt: totalDebt(state),
    income: totalIncome(state),
    business: state.business.profit,
  };
}

export const ALLOCATION_COLORS: Record<string, string> = {
  PEA: 'hsl(158 64% 52%)',
  CTO: 'hsl(199 70% 60%)',
  Bitcoin: 'hsl(38 92% 60%)',
  LivretA: 'hsl(243 70% 66%)',
  Cash: 'hsl(280 60% 62%)',
  'Compte courant': 'hsl(280 60% 62%)',
  Autres: 'hsl(0 70% 60%)',
};

export function allocationColor(name: string): string {
  return ALLOCATION_COLORS[name] ?? ALLOCATION_COLORS.Autres;
}

export function totalInvestmentPlan(state: AppState): number {
  const p = state.investmentPlan;
  return p.PEA + p.CTO + p.Bitcoin + p.LivretA;
}

export function projectedMonthsToGoal(state: AppState): number | null {
  const monthly = totalInvestmentPlan(state);
  if (monthly <= 0) return null;
  const remaining = state.goal - netWorth(state);
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / monthly);
}

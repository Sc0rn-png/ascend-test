import type { AppState, Asset } from './types';
import { isFinancialCategory } from './types';

export function financialAssets(state: AppState): Asset[] {
  return state.assets.filter((a) => isFinancialCategory(a.category));
}

export function totalFinancialAssets(state: AppState): number {
  return financialAssets(state).reduce((sum, a) => sum + a.value, 0);
}

export function totalNonFinancialAssets(state: AppState): number {
  return state.nonFinancialAssets.reduce((sum, a) => sum + a.value, 0);
}

export function netWorth(state: AppState): number {
  const nonFinancial = state.includeNonFinancialInNetWorth ? totalNonFinancialAssets(state) : 0;
  return totalFinancialAssets(state) + nonFinancial - state.debtTotal;
}

export function previousNetWorth(state: AppState): number {
  const financial = financialAssets(state).reduce((sum, a) => sum + a.previousValue, 0);
  const nonFinancial = state.includeNonFinancialInNetWorth
    ? state.nonFinancialAssets.reduce((sum, a) => sum + a.previousValue, 0)
    : 0;
  return financial + nonFinancial - state.previousDebtTotal;
}

export function netWorthEvolution(state: AppState): number {
  return netWorth(state) - previousNetWorth(state);
}

export function financialPatrimoine(state: AppState): number {
  return totalFinancialAssets(state);
}

export function daysUntilTarget(targetDate: string): number {
  const now = new Date();
  const target = new Date(`${targetDate}T00:00:00`);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatDateFR(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
}

export function monthLabelLong(key: string): string {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

export function actualAllocation(state: AppState): { name: string; value: number; percent: number }[] {
  const groups: Record<string, number> = {};
  for (const a of financialAssets(state)) {
    const key = a.category === 'Livret A' ? 'LivretA' : a.category === 'Compte courant' ? 'Cash' : a.category;
    groups[key] = (groups[key] ?? 0) + a.value;
  }
  const total = totalFinancialAssets(state);
  if (total === 0) return [];
  return Object.entries(groups)
    .filter(([, value]) => value !== 0)
    .map(([name, value]) => ({ name, value, percent: (value / total) * 100 }));
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

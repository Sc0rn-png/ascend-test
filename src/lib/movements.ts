import type { AppState, IncomeSource, Movement } from './types';
import { INCOME_SOURCES } from './types';

export function monthKeyOf(date: string): string {
  return date.slice(0, 7);
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function movementsOfMonth(state: AppState, key: string): Movement[] {
  return state.movements.filter((m) => monthKeyOf(m.date) === key);
}

function sumOf(movements: Movement[], kind: Movement['kind']): number {
  return movements.filter((m) => m.kind === kind).reduce((sum, m) => sum + m.amount, 0);
}

export function totalIncome(movements: Movement[]): number {
  return sumOf(movements, 'revenu');
}

export function totalExpense(movements: Movement[]): number {
  return sumOf(movements, 'depense');
}

export function totalInvested(movements: Movement[]): number {
  return sumOf(movements, 'investissement');
}

export function incomeBySource(movements: Movement[]): Record<IncomeSource, number> {
  const result = Object.fromEntries(INCOME_SOURCES.map((s) => [s, 0])) as Record<IncomeSource, number>;
  for (const m of movements) {
    if (m.kind === 'revenu' && m.source) result[m.source] += m.amount;
  }
  return result;
}

export function savingsRate(movements: Movement[]): number {
  const income = totalIncome(movements);
  if (income === 0) return 0;
  return ((income - totalExpense(movements)) / income) * 100;
}

export function monthKeysWithActivity(state: AppState): string[] {
  return Array.from(new Set(state.movements.map((m) => monthKeyOf(m.date)))).sort().reverse();
}

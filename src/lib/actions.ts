import type { AppState, Movement, MovementKind, IncomeSource } from './types';
import { generateId } from './storage';
import { netWorth, totalFinancialAssets, totalNonFinancialAssets } from './calc';
import { movementsOfMonth, totalExpense, totalIncome, totalInvested } from './movements';

export interface MovementDraft {
  kind: MovementKind;
  amount: number;
  date: string;
  source?: IncomeSource;
  assetId?: string;
  label?: string;
}

export function syncLowestNetWorth(state: AppState): AppState {
  const current = netWorth(state);
  return current < state.lowestNetWorth ? { ...state, lowestNetWorth: current } : state;
}

export function addMovement(state: AppState, draft: MovementDraft): AppState {
  const movement: Movement = { id: generateId(), ...draft };
  const next: AppState = { ...state };

  if (draft.kind === 'investissement' && draft.assetId) {
    next.assets = next.assets.map((a) =>
      a.id === draft.assetId ? { ...a, value: a.value + draft.amount } : a
    );
  }

  if (draft.kind === 'actif') {
    const created = {
      id: generateId(),
      name: draft.label || 'Actif',
      category: 'Divers',
      value: draft.amount,
      previousValue: draft.amount,
    };
    next.nonFinancialAssets = [...next.nonFinancialAssets, created];
    movement.assetId = created.id;
  }

  next.movements = [...next.movements, movement];
  return syncLowestNetWorth(next);
}

export function deleteMovement(state: AppState, id: string): AppState {
  const movement = state.movements.find((m) => m.id === id);
  if (!movement) return state;

  const next: AppState = { ...state, movements: state.movements.filter((m) => m.id !== id) };

  if (movement.kind === 'investissement' && movement.assetId) {
    next.assets = next.assets.map((a) =>
      a.id === movement.assetId ? { ...a, value: a.value - movement.amount } : a
    );
  }

  if (movement.kind === 'actif' && movement.assetId) {
    next.nonFinancialAssets = next.nonFinancialAssets.filter((a) => a.id !== movement.assetId);
  }

  return syncLowestNetWorth(next);
}

export function setDebtTotal(state: AppState, amount: number): AppState {
  return syncLowestNetWorth({ ...state, debtTotal: amount });
}

export function takeMonthlySnapshot(state: AppState, monthKey: string): AppState {
  const ofMonth = movementsOfMonth(state, monthKey);

  const snapshot = {
    id: monthKey,
    netWorth: netWorth(state),
    financialPatrimoine: totalFinancialAssets(state),
    nonFinancialPatrimoine: totalNonFinancialAssets(state),
    debtTotal: state.debtTotal,
    encaisse: totalIncome(ofMonth),
    depense: totalExpense(ofMonth),
    investi: totalInvested(ofMonth),
  };

  return {
    ...state,
    snapshots: [...state.snapshots.filter((s) => s.id !== monthKey), snapshot].sort((a, b) =>
      a.id.localeCompare(b.id)
    ),
    assets: state.assets.map((a) => ({ ...a, previousValue: a.value })),
    nonFinancialAssets: state.nonFinancialAssets.map((a) => ({ ...a, previousValue: a.value })),
    previousDebtTotal: state.debtTotal,
    lastUpdateMonth: monthKey,
  };
}

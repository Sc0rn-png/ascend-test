import type { AppState, Asset, Movement, MovementKind, IncomeSource } from './types';
import { generateId } from './storage';
import { netWorth, totalFinancialAssets, totalNonFinancialAssets } from './calc';
import { movementsOfMonth, totalExpense, totalIncome, totalInvested } from './movements';

export interface MovementDraft {
  kind: MovementKind;
  amount: number;
  date: string;
  source?: IncomeSource;
  assetId?: string;
  fromAssetId?: string;
  label?: string;
}

export function syncLowestNetWorth(state: AppState): AppState {
  const current = netWorth(state);
  return current < state.lowestNetWorth ? { ...state, lowestNetWorth: current } : state;
}

// Le sens dans lequel un mouvement deplace l'argent du compte qu'il impute.
// Une acquisition d'actif ne rend rien : elle cree son propre bien.
function assetDelta(kind: MovementKind, amount: number): number {
  if (kind === 'depense') return -amount;
  if (kind === 'revenu' || kind === 'investissement') return amount;
  return 0;
}

function applyToAsset(assets: Asset[], assetId: string, delta: number): Asset[] {
  return assets.map((a) => (a.id === assetId ? { ...a, value: a.value + delta } : a));
}

export function addMovement(state: AppState, draft: MovementDraft): AppState {
  const movement: Movement = { id: generateId(), ...draft };
  const next: AppState = { ...state };

  const delta = assetDelta(draft.kind, draft.amount);
  if (delta !== 0 && draft.assetId) {
    next.assets = applyToAsset(next.assets, draft.assetId, delta);
  }

  if (draft.fromAssetId) {
    next.assets = applyToAsset(next.assets, draft.fromAssetId, -draft.amount);
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

  const delta = assetDelta(movement.kind, movement.amount);
  if (delta !== 0 && movement.assetId) {
    next.assets = applyToAsset(next.assets, movement.assetId, -delta);
  }

  if (movement.fromAssetId) {
    next.assets = applyToAsset(next.assets, movement.fromAssetId, movement.amount);
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

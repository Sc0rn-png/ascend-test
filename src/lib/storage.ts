import type { AppState, Asset, Movement, NonFinancialAsset } from './types';
import {
  ASSET_CATEGORIES,
  DEFAULT_INVESTMENT_PLAN,
  DEFAULT_TARGET_ALLOCATION,
  MOVEMENT_KINDS,
} from './types';

const STORAGE_KEY = 'ascend_state_v3';
const LEGACY_KEY = 'ascend_state_v2';

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatEuroDetailed(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function defaultAsset(name: string, category: Asset['category']): Asset {
  return { id: generateId(), name, category, value: 0, target: 0, previousValue: 0 };
}

export function emptyState(): AppState {
  const inThreeYears = new Date();
  inThreeYears.setFullYear(inThreeYears.getFullYear() + 3);

  return {
    goal: 10000,
    targetDate: `${inThreeYears.getFullYear()}-12-31`,
    assets: [
      defaultAsset('PEA', 'PEA'),
      defaultAsset('CTO', 'CTO'),
      defaultAsset('Bitcoin', 'Bitcoin'),
      defaultAsset('Livret A', 'Livret A'),
      defaultAsset('Cash', 'Cash'),
      defaultAsset('Compte courant', 'Compte courant'),
    ],
    nonFinancialAssets: [],
    includeNonFinancialInNetWorth: false,
    movements: [],
    debtTotal: 0,
    previousDebtTotal: 0,
    lowestNetWorth: 0,
    investmentPlan: DEFAULT_INVESTMENT_PLAN,
    targetAllocation: DEFAULT_TARGET_ALLOCATION,
    snapshots: [],
    theme: 'dark',
    lastUpdateMonth: null,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isValidMovement(v: unknown): v is Movement {
  if (!isRecord(v)) return false;
  if (typeof v.id !== 'string' || typeof v.date !== 'string') return false;
  if (typeof v.amount !== 'number' || !Number.isFinite(v.amount)) return false;
  return MOVEMENT_KINDS.includes(v.kind as Movement['kind']);
}

function isValidAsset(v: unknown): v is Asset {
  if (!isRecord(v)) return false;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return false;
  if (typeof v.value !== 'number' || !Number.isFinite(v.value)) return false;
  return ASSET_CATEGORIES.includes(v.category as Asset['category']);
}

export function validateState(raw: unknown): AppState | null {
  if (!isRecord(raw)) return null;

  if (Object.keys(raw).length === 0) return null;

  if (raw.movements !== undefined) {
    if (!Array.isArray(raw.movements)) return null;
    if (!raw.movements.every(isValidMovement)) return null;
  }
  if (raw.assets !== undefined) {
    if (!Array.isArray(raw.assets)) return null;
    if (!raw.assets.every(isValidAsset)) return null;
  }
  if (raw.debtTotal !== undefined && typeof raw.debtTotal !== 'number') return null;

  const base = emptyState();
  return {
    ...base,
    ...(raw as Partial<AppState>),
    investmentPlan: { ...base.investmentPlan, ...(raw.investmentPlan as object) },
    targetAllocation: { ...base.targetAllocation, ...(raw.targetAllocation as object) },
  };
}

export function migrateV2(raw: unknown): AppState | null {
  if (!isRecord(raw) || !Array.isArray(raw.assets)) return null;

  const base = emptyState();
  const debts = Array.isArray(raw.debts) ? (raw.debts as Record<string, number>[]) : [];

  const assets = (raw.assets as unknown[]).filter(isValidAsset);
  const nonFinancial = Array.isArray(raw.nonFinancialAssets)
    ? (raw.nonFinancialAssets as NonFinancialAsset[]).map((a) => ({
        ...a,
        previousValue: a.value,
      }))
    : [];

  return {
    ...base,
    goal: typeof raw.goal === 'number' ? raw.goal : base.goal,
    targetDate: typeof raw.targetDate === 'string' ? raw.targetDate.slice(0, 10) : base.targetDate,
    assets,
    nonFinancialAssets: nonFinancial,
    includeNonFinancialInNetWorth: raw.includeNonFinancialInNetWorth === true,
    debtTotal: debts.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    previousDebtTotal: debts.reduce((sum, d) => sum + (d.previousAmount ?? d.amount ?? 0), 0),
    investmentPlan: { ...base.investmentPlan, ...(raw.investmentPlan as object) },
    targetAllocation: { ...base.targetAllocation, ...(raw.targetAllocation as object) },
    theme: raw.theme === 'light' ? 'light' : 'dark',
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = validateState(JSON.parse(raw));
      if (parsed) return parsed;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = migrateV2(JSON.parse(legacy));
      if (migrated) {
        saveState(migrated);
        return migrated;
      }
    }
  } catch {
    // Un stockage corrompu ne doit jamais empecher l'application de demarrer.
  }
  const fresh = emptyState();
  saveState(fresh);
  return fresh;
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ascend-export-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = validateState(JSON.parse(reader.result as string));
        if (!parsed) {
          reject(new Error('Ce fichier ne contient pas des donnees ASCEND valides'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('Fichier illisible'));
      }
    };
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsText(file);
  });
}

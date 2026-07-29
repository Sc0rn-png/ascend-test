import type { AppState, Asset, Movement, NonFinancialAsset } from './types';
import {
  ASSET_CATEGORIES,
  DEFAULT_INVESTMENT_PLAN,
  DEFAULT_TARGET_ALLOCATION,
  MOVEMENT_KINDS,
} from './types';

const STORAGE_KEY = 'ascend_state_v3';
const LEGACY_KEY = 'ascend_state_v2';
const BROKEN_KEY = 'ascend_state_v3.broken';

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

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isValidArray<T>(v: unknown, predicate: (item: unknown) => item is T): v is T[] {
  return Array.isArray(v) && v.every(predicate);
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
  if (!isFiniteNumber(v.value) || !isFiniteNumber(v.previousValue) || !isFiniteNumber(v.target)) return false;
  return ASSET_CATEGORIES.includes(v.category as Asset['category']);
}

function isValidNonFinancialAsset(v: unknown): v is NonFinancialAsset {
  if (!isRecord(v)) return false;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return false;
  if (typeof v.category !== 'string') return false;
  if (!isFiniteNumber(v.value) || !isFiniteNumber(v.previousValue)) return false;
  return true;
}

function isValidSnapshot(v: unknown): v is { id: string; netWorth: number; financialPatrimoine: number; nonFinancialPatrimoine: number; debtTotal: number; encaisse: number; depense: number; investi: number } {
  if (!isRecord(v)) return false;
  if (typeof v.id !== 'string') return false;
  return (
    isFiniteNumber(v.netWorth) &&
    isFiniteNumber(v.financialPatrimoine) &&
    isFiniteNumber(v.nonFinancialPatrimoine) &&
    isFiniteNumber(v.debtTotal) &&
    isFiniteNumber(v.encaisse) &&
    isFiniteNumber(v.depense) &&
    isFiniteNumber(v.investi)
  );
}

function isValidNumberRecord(v: unknown): boolean {
  if (!isRecord(v)) return false;
  return Object.values(v).every(isFiniteNumber);
}

function isValidDateISO(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isValidMonthISO(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const match = /^(\d{4})-(\d{2})$/.exec(v);
  if (!match) return false;
  const month = parseInt(match[2], 10);
  return month >= 1 && month <= 12;
}

export function validateState(raw: unknown): AppState | null {
  if (!isRecord(raw)) return null;

  // `assets` est le champ discriminant : sans lui, n'importe quel objet JSON
  // passerait pour un export ASCEND et remplacerait tout l'etat.
  if (!isValidArray(raw.assets, isValidAsset)) return null;

  if (raw.movements !== undefined) {
    if (!isValidArray(raw.movements, isValidMovement)) return null;
  }
  if (raw.nonFinancialAssets !== undefined) {
    if (!isValidArray(raw.nonFinancialAssets, isValidNonFinancialAsset)) return null;
  }
  if (raw.snapshots !== undefined) {
    if (!isValidArray(raw.snapshots, isValidSnapshot)) return null;
  }
  if (raw.goal !== undefined && !isFiniteNumber(raw.goal)) return null;
  if (raw.debtTotal !== undefined && !isFiniteNumber(raw.debtTotal)) return null;
  if (raw.previousDebtTotal !== undefined && !isFiniteNumber(raw.previousDebtTotal)) return null;
  if (raw.lowestNetWorth !== undefined && !isFiniteNumber(raw.lowestNetWorth)) return null;
  if (raw.targetDate !== undefined && !isValidDateISO(raw.targetDate)) return null;
  if (raw.theme !== undefined && raw.theme !== 'dark' && raw.theme !== 'light') return null;
  if (raw.lastUpdateMonth !== undefined && raw.lastUpdateMonth !== null && !isValidMonthISO(raw.lastUpdateMonth)) return null;
  if (raw.includeNonFinancialInNetWorth !== undefined && typeof raw.includeNonFinancialInNetWorth !== 'boolean') return null;
  if (raw.investmentPlan !== undefined && !isValidNumberRecord(raw.investmentPlan)) return null;
  if (raw.targetAllocation !== undefined && !isValidNumberRecord(raw.targetAllocation)) return null;

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

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  // Chaque source a sa propre garde : un v3 corrompu ne doit pas empecher la
  // migration du v2, qui est peut-etre la derniere copie exploitable.
  const raw = readRaw(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = validateState(JSON.parse(raw));
      if (parsed) return parsed;
    } catch {
      // Un stockage corrompu ne doit jamais empecher l'application de demarrer.
    }
    // On n'ecrase jamais un contenu qu'on n'a pas su relire : il reste
    // recuperable a la main sous cette cle.
    try {
      localStorage.setItem(BROKEN_KEY, raw);
    } catch {
      // Rien de mieux a faire si le stockage refuse aussi cette copie.
    }
  }

  const legacy = readRaw(LEGACY_KEY);
  if (legacy) {
    try {
      const migrated = migrateV2(JSON.parse(legacy));
      if (migrated) {
        saveState(migrated);
        return migrated;
      }
    } catch {
      // Idem : un v2 illisible laisse simplement repartir sur un etat neutre.
    }
  }

  const fresh = emptyState();
  saveState(fresh);
  return fresh;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota atteint ou stockage refuse : l'echec d'une ecriture ne doit pas
    // remonter jusqu'a l'ErrorBoundary, que le rechargement ne quitterait plus.
  }
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
          reject(new Error('Ce fichier ne contient pas des données ASCEND valides'));
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

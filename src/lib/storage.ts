import type { AppState } from './types';
import { DEFAULT_TARGET_ALLOCATION, DEFAULT_INVESTMENT_PLAN } from './types';

const STORAGE_KEY = 'ascend_state_v2';

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

function seedState(): AppState {
  const target = new Date(2029, 11, 8);

  return {
    goal: 50000,
    targetDate: target.toISOString(),
    assets: [
      { id: generateId(), name: 'PEA', category: 'PEA', value: 700, target: 10000, previousValue: 700 },
      { id: generateId(), name: 'CTO', category: 'CTO', value: 1300, target: 22500, previousValue: 1300 },
      { id: generateId(), name: 'Bitcoin', category: 'Bitcoin', value: 140, target: 5000, previousValue: 140 },
      { id: generateId(), name: 'Livret A', category: 'Livret A', value: 200, target: 5000, previousValue: 200 },
      { id: generateId(), name: 'Cash', category: 'Cash', value: 0, target: 7500, previousValue: 0 },
      { id: generateId(), name: 'Compte courant', category: 'Compte courant', value: 500, target: 2000, previousValue: 500 },
    ],
    nonFinancialAssets: [
      { id: generateId(), name: 'Collection One Piece', category: 'Collection', value: 600 },
      { id: generateId(), name: 'Meubles / Appareils', category: 'Mobilier & Équipement', value: 1500 },
    ],
    includeNonFinancialInNetWorth: false,
    incomes: [
      { id: generateId(), name: 'Salaire fixe', amount: 1719 },
      { id: generateId(), name: 'Tips (moyenne)', amount: 400 },
      { id: generateId(), name: 'Business', amount: 0 },
    ],
    debts: [
      { id: generateId(), name: 'Crédit conso', amount: 5000, previousAmount: 5000 },
    ],
    roadmap: [
      { id: generateId(), label: 'Valeur nette', target: 2700, current: 2700, done: true, quarter: 'T3 2026' },
      { id: generateId(), label: 'Premier investissement BTC', target: 1, current: 1, done: true, quarter: 'T3 2026' },
      { id: generateId(), label: 'Valeur nette', target: 5000, current: 2700, done: false, quarter: 'T4 2026' },
      { id: generateId(), label: 'Dette sous 3 000 €', target: 3000, current: 5000, done: false, quarter: 'T4 2026' },
      { id: generateId(), label: 'Revenus business', target: 500, current: 0, done: false, quarter: 'T4 2026' },
      { id: generateId(), label: 'Valeur nette', target: 10000, current: 2700, done: false, quarter: 'T1 2027' },
      { id: generateId(), label: 'Patrimoine financier', target: 15000, current: 2840, done: false, quarter: 'T1 2027' },
      { id: generateId(), label: 'Dette remboursée', target: 5000, current: 0, done: false, quarter: 'T2 2027' },
      { id: generateId(), label: 'Valeur nette', target: 25000, current: 2700, done: false, quarter: 'T4 2027' },
      { id: generateId(), label: 'Valeur nette', target: 50000, current: 2700, done: false, quarter: 'T4 2029' },
    ],
    business: {
      ca: 0,
      profit: 0,
      adSpend: 0,
      orders: 0,
      avgBasket: 0,
      conversion: 0,
      treasury: 0,
      previousCa: 0,
    },
    investmentPlan: DEFAULT_INVESTMENT_PLAN,
    targetAllocation: DEFAULT_TARGET_ALLOCATION,
    snapshots: [],
    achievements: [
      { id: generateId(), label: 'Premier investissement', description: 'Atteindre 1 000 € de patrimoine financier investi', threshold: 1000, metric: 'firstInvestment', unlocked: false },
      { id: generateId(), label: 'Patrimoine 5 000 €', description: 'Valeur nette de 5 000 €', threshold: 5000, metric: 'netWorth', unlocked: false },
      { id: generateId(), label: 'Patrimoine 10 000 €', description: 'Valeur nette de 10 000 €', threshold: 10000, metric: 'netWorth', unlocked: false },
      { id: generateId(), label: 'Patrimoine 25 000 €', description: 'Valeur nette de 25 000 €', threshold: 25000, metric: 'netWorth', unlocked: false },
      { id: generateId(), label: 'Patrimoine 100 000 €', description: 'Valeur nette de 100 000 €', threshold: 100000, metric: 'patrimoine', unlocked: false },
      { id: generateId(), label: 'Dette remboursée', description: 'Solde toutes tes dettes', threshold: 0, metric: 'debtCleared', unlocked: false },
      { id: generateId(), label: 'Business 1 000 €/mois', description: 'Revenu business mensuel de 1 000 €', threshold: 1000, metric: 'businessIncome', unlocked: false },
      { id: generateId(), label: 'Business 5 000 €/mois', description: 'Revenu business mensuel de 5 000 €', threshold: 5000, metric: 'businessIncome', unlocked: false },
    ],
    theme: 'dark',
    lastUpdateMonth: null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedState();
      saveState(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const seeded = seedState();
    const merged: AppState = {
      ...seeded,
      ...parsed,
      targetAllocation: { ...seeded.targetAllocation, ...parsed.targetAllocation },
      investmentPlan: { ...seeded.investmentPlan, ...parsed.investmentPlan },
      business: { ...seeded.business, ...parsed.business },
    };
    return merged;
  } catch {
    return seedState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ascend-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppState;
        resolve(parsed);
      } catch {
        reject(new Error('Fichier invalide'));
      }
    };
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsText(file);
  });
}

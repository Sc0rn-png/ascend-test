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
  previousValue: number;
}

export type MovementKind = 'revenu' | 'depense' | 'investissement' | 'actif';

export const MOVEMENT_KINDS: MovementKind[] = ['revenu', 'depense', 'investissement', 'actif'];

export type IncomeSource = 'Salaire' | 'Tips' | 'Business' | 'Exceptionnel';

export const INCOME_SOURCES: IncomeSource[] = ['Salaire', 'Tips', 'Business', 'Exceptionnel'];

// `assetId` designe l'actif que le mouvement fait bouger dans son sens naturel :
// le compte debite par une depense, credite par une rentree, le placement
// credite par un versement, l'actif non financier cree par une acquisition —
// c'est ce qui rend la suppression d'un mouvement reversible dans tous les cas.
// `fromAssetId` nomme le compte qui a finance le mouvement quand il differe de
// `assetId` : sans lui, un virement interne gonflerait la valeur nette.
export interface Movement {
  id: string;
  date: string; // 'YYYY-MM-DD'
  kind: MovementKind;
  amount: number;
  source?: IncomeSource;
  assetId?: string;
  fromAssetId?: string;
  label?: string;
}

export interface Snapshot {
  id: string; // cle du mois, ex. '2026-08'
  netWorth: number;
  financialPatrimoine: number;
  nonFinancialPatrimoine: number;
  debtTotal: number;
  encaisse: number;
  depense: number;
  investi: number;
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

export interface AppState {
  goal: number;
  targetDate: string; // 'YYYY-MM-DD'
  assets: Asset[];
  nonFinancialAssets: NonFinancialAsset[];
  includeNonFinancialInNetWorth: boolean;
  movements: Movement[];
  debtTotal: number;
  previousDebtTotal: number;
  lowestNetWorth: number;
  investmentPlan: InvestmentPlan;
  targetAllocation: TargetAllocation;
  snapshots: Snapshot[];
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
  PEA: 0,
  CTO: 0,
  Bitcoin: 0,
  LivretA: 0,
};

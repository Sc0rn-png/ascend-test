import { describe, it, expect } from 'vitest';
import {
  netWorth, netWorthEvolution, investedPatrimoine,
  cashAvailable, actualAllocation, progressPercent, formatDateFR, monthLabel,
} from './calc';
import { emptyState } from './storage';
import type { AppState, Asset } from './types';

function asset(over: Partial<Asset>): Asset {
  return { id: 'x', name: 'x', category: 'CTO', value: 0, target: 0, previousValue: 0, ...over };
}

function state(over: Partial<AppState> = {}): AppState {
  return { ...emptyState(), assets: [], ...over };
}

describe('netWorth', () => {
  it('soustrait la dette du patrimoine financier', () => {
    const s = state({ assets: [asset({ value: 2840 })], debtTotal: 5000 });
    expect(netWorth(s)).toBe(-2160);
  });

  it('ignore les actifs non financiers par defaut', () => {
    const s = state({
      assets: [asset({ value: 1000 })],
      nonFinancialAssets: [{ id: 'n', name: 'Meuble', category: 'Mobilier', value: 500, previousValue: 500 }],
    });
    expect(netWorth(s)).toBe(1000);
  });

  it('inclut les actifs non financiers quand l option est active', () => {
    const s = state({
      assets: [asset({ value: 1000 })],
      nonFinancialAssets: [{ id: 'n', name: 'Meuble', category: 'Mobilier', value: 500, previousValue: 500 }],
      includeNonFinancialInNetWorth: true,
    });
    expect(netWorth(s)).toBe(1500);
  });

  it('exclut la categorie Autres, non financiere', () => {
    const s = state({ assets: [asset({ value: 1000 }), asset({ id: 'y', category: 'Autres', value: 999 })] });
    expect(netWorth(s)).toBe(1000);
  });
});

describe('previousNetWorth', () => {
  // Regression : previousNetWorth sommait tous les actifs alors que netWorth
  // filtre les categories financieres, ce qui affichait une chute fantome du
  // montant de tout actif classe 'Autres'.
  it('applique le meme filtre que netWorth', () => {
    const s = state({
      assets: [
        asset({ value: 1000, previousValue: 1000 }),
        asset({ id: 'y', category: 'Autres', value: 1000, previousValue: 1000 }),
      ],
    });
    expect(netWorthEvolution(s)).toBe(0);
  });

  it('utilise la dette precedente', () => {
    const s = state({
      assets: [asset({ value: 1000, previousValue: 1000 })],
      debtTotal: 4500,
      previousDebtTotal: 5000,
    });
    expect(netWorthEvolution(s)).toBe(500);
  });

  it('prend en compte la variation des actifs non financiers si l option est active', () => {
    const s = state({
      assets: [],
      nonFinancialAssets: [{ id: 'n', name: 'Meuble', category: 'Mobilier', value: 800, previousValue: 500 }],
      includeNonFinancialInNetWorth: true,
    });
    expect(netWorthEvolution(s)).toBe(300);
  });
});

describe('investedPatrimoine', () => {
  // Regression : 'Autres' etait compte comme investi alors qu'il est exclu du
  // patrimoine financier, ce qui rendait l investi superieur au total.
  it('ne compte que PEA, CTO et Bitcoin', () => {
    const s = state({
      assets: [
        asset({ category: 'PEA', value: 700 }),
        asset({ id: 'b', category: 'CTO', value: 1300 }),
        asset({ id: 'c', category: 'Bitcoin', value: 140 }),
        asset({ id: 'd', category: 'Livret A', value: 200 }),
        asset({ id: 'e', category: 'Autres', value: 999 }),
      ],
    });
    expect(investedPatrimoine(s)).toBe(2140);
  });
});

describe('cashAvailable', () => {
  it('additionne Cash, Compte courant et Livret A', () => {
    const s = state({
      assets: [
        asset({ category: 'Cash', value: 100 }),
        asset({ id: 'b', category: 'Compte courant', value: 500 }),
        asset({ id: 'c', category: 'Livret A', value: 200 }),
        asset({ id: 'd', category: 'PEA', value: 700 }),
      ],
    });
    expect(cashAvailable(s)).toBe(800);
  });
});

describe('actualAllocation', () => {
  it('regroupe Compte courant avec Cash et renomme Livret A', () => {
    const s = state({
      assets: [
        asset({ category: 'Cash', value: 100 }),
        asset({ id: 'b', category: 'Compte courant', value: 300 }),
        asset({ id: 'c', category: 'Livret A', value: 600 }),
      ],
    });
    const noms = actualAllocation(s).map((a) => a.name).sort();
    expect(noms).toEqual(['Cash', 'LivretA']);
    expect(actualAllocation(s).find((a) => a.name === 'Cash')?.value).toBe(400);
  });

  it('renvoie un tableau vide sans patrimoine', () => {
    expect(actualAllocation(state())).toEqual([]);
  });
});

describe('progressPercent', () => {
  it('ne descend jamais sous zero avec une valeur nette negative', () => {
    const s = state({ assets: [], debtTotal: 5000, goal: 50000 });
    expect(progressPercent(s)).toBe(0);
  });

  it('vaut zero si l objectif est nul', () => {
    expect(progressPercent(state({ goal: 0 }))).toBe(0);
  });
});

describe('formatDateFR', () => {
  it('affiche le jour saisi sans decalage', () => {
    expect(formatDateFR('2029-12-08')).toBe('8 décembre 2029');
  });

  // Le decalage d origine n est observable que depuis un fuseau en retard sur
  // UTC : depuis Paris, l ancien code et le nouveau rendent la meme chaine.
  it('n avance ni ne recule le jour depuis un fuseau en retard sur UTC', () => {
    const tz = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
      // Si le changement de fuseau n a pas pris effet, cette assertion echoue
      // et signale que le test qui suit ne prouve rien.
      expect(new Date('2029-12-08').getDate()).toBe(7);
      expect(formatDateFR('2029-12-08')).toBe('8 décembre 2029');
    } finally {
      if (tz === undefined) delete process.env.TZ;
      else process.env.TZ = tz;
    }
    expect(process.env.TZ).toBe(tz);
  });
});

describe('monthLabel', () => {
  it('abrege le mois', () => {
    expect(monthLabel('2026-08')).toMatch(/août/);
  });
});

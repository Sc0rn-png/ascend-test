import { describe, it, expect } from 'vitest';
import { validateState, migrateV2, emptyState, formatEuro } from './storage';

describe('validateState', () => {
  it('rejette un objet vide', () => {
    expect(validateState({})).toBeNull();
  });

  it('rejette un tableau', () => {
    expect(validateState([])).toBeNull();
  });

  it('rejette un état dont les mouvements ne sont pas un tableau', () => {
    const bad = { ...emptyState(), movements: 'oui' };
    expect(validateState(bad)).toBeNull();
  });

  it('rejette un mouvement de type inconnu', () => {
    const bad = emptyState();
    bad.movements = [{ id: 'x', date: '2026-07-01', kind: 'cadeau', amount: 10 }] as never;
    expect(validateState(bad)).toBeNull();
  });

  it('accepte un état neutre', () => {
    expect(validateState(emptyState())).not.toBeNull();
  });

  it('complete les champs absents a partir de l etat neutre', () => {
    const partial = { ...emptyState() } as Record<string, unknown>;
    delete partial.theme;
    expect(validateState(partial)?.theme).toBe('dark');
  });

  it('rejette nonFinancialAssets non-tableau', () => {
    const bad = { ...emptyState(), nonFinancialAssets: 'oui' };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte nonFinancialAssets valide', () => {
    const good = {
      ...emptyState(),
      nonFinancialAssets: [
        { id: 'n1', name: 'Meuble', category: 'Mobilier', value: 1500, previousValue: 1500 },
      ],
    };
    expect(validateState(good)?.nonFinancialAssets).toHaveLength(1);
  });

  it('rejette nonFinancialAssets avec champs manquants', () => {
    const bad = { ...emptyState(), nonFinancialAssets: [{ id: 'n', name: 'Meuble', value: 1500 }] as never };
    expect(validateState(bad)).toBeNull();
  });

  it('rejette snapshots non-tableau', () => {
    const bad = { ...emptyState(), snapshots: 'oui' };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte snapshots valide', () => {
    const good = {
      ...emptyState(),
      snapshots: [
        {
          id: '2026-07',
          netWorth: 5000,
          financialPatrimoine: 3000,
          nonFinancialPatrimoine: 2000,
          debtTotal: 1000,
          encaisse: 500,
          depense: 200,
          investi: 100,
        },
      ],
    };
    expect(validateState(good)?.snapshots).toHaveLength(1);
  });

  it('rejette snapshots avec champs manquants', () => {
    const bad = {
      ...emptyState(),
      snapshots: [{ id: '2026-07', netWorth: 5000 }] as never,
    };
    expect(validateState(bad)).toBeNull();
  });

  it('rejette goal non-nombre', () => {
    const bad = { ...emptyState(), goal: 'mille' };
    expect(validateState(bad)).toBeNull();
  });

  it('rejette previousDebtTotal non-nombre', () => {
    const bad = { ...emptyState(), previousDebtTotal: 'mille' };
    expect(validateState(bad)).toBeNull();
  });

  it('rejette lowestNetWorth non-nombre', () => {
    const bad = { ...emptyState(), lowestNetWorth: 'mille' };
    expect(validateState(bad)).toBeNull();
  });

  it('rejette targetDate au mauvais format', () => {
    const bad = { ...emptyState(), targetDate: '2026/07/29' };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte targetDate au bon format', () => {
    const good = { ...emptyState(), targetDate: '2026-07-29' };
    expect(validateState(good)?.targetDate).toBe('2026-07-29');
  });

  it('rejette theme invalide', () => {
    const bad = { ...emptyState(), theme: 'bright' as never };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte theme valide', () => {
    const good = { ...emptyState(), theme: 'light' };
    expect(validateState(good)?.theme).toBe('light');
  });

  it('rejette lastUpdateMonth au mauvais format', () => {
    const bad = { ...emptyState(), lastUpdateMonth: '2026-13' };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte lastUpdateMonth null', () => {
    const good = { ...emptyState(), lastUpdateMonth: null };
    expect(validateState(good)?.lastUpdateMonth).toBeNull();
  });

  it('accepte lastUpdateMonth au bon format', () => {
    const good = { ...emptyState(), lastUpdateMonth: '2026-07' };
    expect(validateState(good)?.lastUpdateMonth).toBe('2026-07');
  });

  it('rejette includeNonFinancialInNetWorth non-booleen', () => {
    const bad = { ...emptyState(), includeNonFinancialInNetWorth: 'oui' };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte includeNonFinancialInNetWorth booleen', () => {
    const good = { ...emptyState(), includeNonFinancialInNetWorth: true };
    expect(validateState(good)?.includeNonFinancialInNetWorth).toBe(true);
  });

  it('rejette investmentPlan avec valeurs non-nombres', () => {
    const bad = {
      ...emptyState(),
      investmentPlan: { PEA: 100, CTO: 'deux-cents', Bitcoin: 50, LivretA: 100 },
    };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte investmentPlan avec nombres valides', () => {
    const good = {
      ...emptyState(),
      investmentPlan: { PEA: 100, CTO: 200, Bitcoin: 50, LivretA: 100 },
    };
    expect(validateState(good)?.investmentPlan.CTO).toBe(200);
  });

  it('rejette targetAllocation avec valeurs non-nombres', () => {
    const bad = {
      ...emptyState(),
      targetAllocation: { PEA: 20, CTO: 45, Bitcoin: 10, LivretA: 10, Cash: 'non' },
    };
    expect(validateState(bad)).toBeNull();
  });

  it('accepte targetAllocation avec nombres valides', () => {
    const good = {
      ...emptyState(),
      targetAllocation: { PEA: 20, CTO: 45, Bitcoin: 10, LivretA: 10, Cash: 15 },
    };
    expect(validateState(good)?.targetAllocation.CTO).toBe(45);
  });
});

describe('migrateV2', () => {
  const v2 = {
    goal: 50000,
    targetDate: '2029-12-07T23:00:00.000Z',
    assets: [{ id: 'a', name: 'PEA', category: 'PEA', value: 700, target: 10000, previousValue: 700 }],
    nonFinancialAssets: [{ id: 'n', name: 'Meuble', category: 'Mobilier', value: 1500 }],
    includeNonFinancialInNetWorth: false,
    incomes: [{ id: 'i', name: 'Salaire fixe', amount: 1719 }],
    debts: [
      { id: 'd1', name: 'Conso', amount: 3000, previousAmount: 3200 },
      { id: 'd2', name: 'Auto', amount: 2000, previousAmount: 2100 },
    ],
    theme: 'dark',
  };

  it('somme les dettes en un total unique', () => {
    expect(migrateV2(v2)?.debtTotal).toBe(5000);
  });

  it('somme les dettes precedentes', () => {
    expect(migrateV2(v2)?.previousDebtTotal).toBe(5300);
  });

  it('tronque la date cible au jour', () => {
    expect(migrateV2(v2)?.targetDate).toBe('2029-12-07');
  });

  it('conserve les placements', () => {
    expect(migrateV2(v2)?.assets).toHaveLength(1);
  });

  it('demarre avec un journal vide', () => {
    expect(migrateV2(v2)?.movements).toEqual([]);
  });

  it('renvoie null sur une entree non exploitable', () => {
    expect(migrateV2({ nawak: true })).toBeNull();
  });
});

describe('formatEuro', () => {
  it('formate sans decimales', () => {
    expect(formatEuro(2840.4).replace(/ | /g, ' ')).toBe('2 840 €');
  });
});

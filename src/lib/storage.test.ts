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

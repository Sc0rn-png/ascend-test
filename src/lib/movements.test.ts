import { describe, it, expect } from 'vitest';
import {
  monthKeyOf, movementsOfMonth, totalIncome, totalExpense,
  totalInvested, incomeBySource, savingsRate,
} from './movements';
import { emptyState } from './storage';
import type { Movement } from './types';

const journal: Movement[] = [
  { id: '1', date: '2026-07-03', kind: 'revenu', amount: 1719, source: 'Salaire' },
  { id: '2', date: '2026-07-11', kind: 'revenu', amount: 400, source: 'Tips' },
  { id: '3', date: '2026-07-15', kind: 'revenu', amount: 150, source: 'Business', label: 'Etendard' },
  { id: '4', date: '2026-07-20', kind: 'depense', amount: 60 },
  { id: '5', date: '2026-07-21', kind: 'depense', amount: 940 },
  { id: '6', date: '2026-07-25', kind: 'investissement', amount: 200, assetId: 'cto' },
  { id: '7', date: '2026-08-02', kind: 'depense', amount: 30 },
];

describe('monthKeyOf', () => {
  it('reduit une date au mois', () => {
    expect(monthKeyOf('2026-07-15')).toBe('2026-07');
  });
});

describe('movementsOfMonth', () => {
  it('ne retient que le mois demande', () => {
    const s = { ...emptyState(), movements: journal };
    expect(movementsOfMonth(s, '2026-07')).toHaveLength(6);
  });
});

describe('totaux', () => {
  const juillet = journal.filter((m) => m.date.startsWith('2026-07'));

  it('additionne les rentrees', () => {
    expect(totalIncome(juillet)).toBe(2269);
  });

  it('additionne les depenses', () => {
    expect(totalExpense(juillet)).toBe(1000);
  });

  it('additionne les versements', () => {
    expect(totalInvested(juillet)).toBe(200);
  });

  it('ventile les rentrees par source', () => {
    expect(incomeBySource(juillet)).toEqual({ Salaire: 1719, Tips: 400, Business: 150, Exceptionnel: 0 });
  });
});

describe('savingsRate', () => {
  it('rapporte ce qui reste aux rentrees', () => {
    const juillet = journal.filter((m) => m.date.startsWith('2026-07'));
    expect(savingsRate(juillet)).toBeCloseTo(55.93, 1);
  });

  // Un mois deficitaire doit s afficher en negatif : un indicateur borne a zero
  // masquerait exactement ce que Thomas a besoin de voir.
  it('devient negatif quand les depenses depassent les rentrees', () => {
    const mouvements: Movement[] = [
      { id: 'a', date: '2026-09-01', kind: 'revenu', amount: 1000, source: 'Salaire' },
      { id: 'b', date: '2026-09-02', kind: 'depense', amount: 1500 },
    ];
    expect(savingsRate(mouvements)).toBe(-50);
  });

  it('vaut zero sans aucune rentree', () => {
    expect(savingsRate([{ id: 'a', date: '2026-09-02', kind: 'depense', amount: 100 }])).toBe(0);
  });
});

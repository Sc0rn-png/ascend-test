import { describe, it, expect } from 'vitest';
import { addMovement, deleteMovement, setDebtTotal, takeMonthlySnapshot } from './actions';
import { emptyState } from './storage';
import { netWorth } from './calc';
import type { AppState } from './types';

function withCto(): AppState {
  const s = emptyState();
  s.assets = [{ id: 'cto', name: 'CTO', category: 'CTO', value: 1300, target: 0, previousValue: 1300 }];
  return s;
}

describe('addMovement', () => {
  it('inscrit le mouvement au journal', () => {
    const s = addMovement(emptyState(), { kind: 'depense', amount: 60, date: '2026-07-20' });
    expect(s.movements).toHaveLength(1);
    expect(s.movements[0].amount).toBe(60);
  });

  it('cree un identifiant', () => {
    const s = addMovement(emptyState(), { kind: 'depense', amount: 60, date: '2026-07-20' });
    expect(s.movements[0].id).toBeTruthy();
  });

  it('credite le placement vise par un investissement', () => {
    const s = addMovement(withCto(), { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto' });
    expect(s.assets[0].value).toBe(1500);
  });

  it('ne touche a aucun solde pour une depense', () => {
    const s = addMovement(withCto(), { kind: 'depense', amount: 200, date: '2026-07-25' });
    expect(s.assets[0].value).toBe(1300);
  });

  it('materialise un actif non financier et le relie au mouvement', () => {
    const s = addMovement(emptyState(), { kind: 'actif', amount: 450, date: '2026-07-25', label: 'Bureau' });
    expect(s.nonFinancialAssets).toHaveLength(1);
    expect(s.nonFinancialAssets[0].name).toBe('Bureau');
    expect(s.movements[0].assetId).toBe(s.nonFinancialAssets[0].id);
  });

  it('abaisse le plus bas enregistre quand la valeur nette descend', () => {
    const s = setDebtTotal(emptyState(), 5000);
    expect(s.lowestNetWorth).toBe(-5000);
    expect(netWorth(s)).toBe(-5000);
  });
});

describe('deleteMovement', () => {
  it('retire le mouvement', () => {
    const s = addMovement(emptyState(), { kind: 'depense', amount: 60, date: '2026-07-20' });
    expect(deleteMovement(s, s.movements[0].id).movements).toHaveLength(0);
  });

  it('annule le credit d un investissement', () => {
    const s = addMovement(withCto(), { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto' });
    expect(deleteMovement(s, s.movements[0].id).assets[0].value).toBe(1300);
  });

  it('retire l actif non financier materialise', () => {
    const s = addMovement(emptyState(), { kind: 'actif', amount: 450, date: '2026-07-25', label: 'Bureau' });
    expect(deleteMovement(s, s.movements[0].id).nonFinancialAssets).toHaveLength(0);
  });

  it('ignore un identifiant inconnu', () => {
    const s = addMovement(emptyState(), { kind: 'depense', amount: 60, date: '2026-07-20' });
    expect(deleteMovement(s, 'inexistant').movements).toHaveLength(1);
  });
});

describe('takeMonthlySnapshot', () => {
  it('enregistre les totaux du mois', () => {
    let s = withCto();
    s = addMovement(s, { kind: 'revenu', amount: 1719, date: '2026-07-03', source: 'Salaire' });
    s = addMovement(s, { kind: 'depense', amount: 1000, date: '2026-07-20' });
    s = addMovement(s, { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto' });

    const snap = takeMonthlySnapshot(s, '2026-07').snapshots[0];
    expect(snap.encaisse).toBe(1719);
    expect(snap.depense).toBe(1000);
    expect(snap.investi).toBe(200);
    expect(snap.id).toBe('2026-07');
  });

  it('fige les valeurs courantes comme references du mois suivant', () => {
    let s = withCto();
    s = addMovement(s, { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto' });
    s = takeMonthlySnapshot(setDebtTotal(s, 5000), '2026-07');
    expect(s.assets[0].previousValue).toBe(1500);
    expect(s.previousDebtTotal).toBe(5000);
  });

  it('remplace le snapshot du meme mois au lieu de le dupliquer', () => {
    const once = takeMonthlySnapshot(withCto(), '2026-07');
    expect(takeMonthlySnapshot(once, '2026-07').snapshots).toHaveLength(1);
  });

  it('trie les snapshots par mois croissant', () => {
    const s = takeMonthlySnapshot(takeMonthlySnapshot(withCto(), '2026-08'), '2026-07');
    expect(s.snapshots.map((x) => x.id)).toEqual(['2026-07', '2026-08']);
  });
});

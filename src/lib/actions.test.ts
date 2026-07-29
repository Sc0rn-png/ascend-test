import { describe, it, expect } from 'vitest';
import { addMovement, deleteMovement, setDebtTotal, takeMonthlySnapshot } from './actions';
import { emptyState } from './storage';
import { netWorth } from './calc';
import type { AppState } from './types';

// 'pea' est place avant 'cto' pour que les mouvements cibles par assetId ne
// correspondent jamais au premier element du tableau : une implementation qui
// agirait sur `assets[0]` sans regarder l'id serait ainsi demasquee.
function withCto(): AppState {
  const s = emptyState();
  s.assets = [
    { id: 'pea', name: 'PEA', category: 'PEA', value: 700, target: 0, previousValue: 700 },
    { id: 'cto', name: 'CTO', category: 'CTO', value: 1300, target: 0, previousValue: 1300 },
  ];
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
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(1500);
    expect(s.assets.find((a) => a.id === 'pea')!.value).toBe(700);
  });

  it('ne touche a aucun solde pour une depense', () => {
    const s = addMovement(withCto(), { kind: 'depense', amount: 200, date: '2026-07-25' });
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
  });

  it('materialise un actif non financier et le relie au mouvement', () => {
    let s = addMovement(emptyState(), { kind: 'actif', amount: 450, date: '2026-07-25', label: 'Bureau' });
    s = addMovement(s, { kind: 'actif', amount: 900, date: '2026-07-26', label: 'Voiture' });
    expect(s.nonFinancialAssets).toHaveLength(2);
    const bureau = s.nonFinancialAssets.find((a) => a.name === 'Bureau')!;
    const voiture = s.nonFinancialAssets.find((a) => a.name === 'Voiture')!;
    expect(s.movements[0].assetId).toBe(bureau.id);
    expect(s.movements[1].assetId).toBe(voiture.id);
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
    const next = deleteMovement(s, s.movements[0].id);
    expect(next.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
    expect(next.assets.find((a) => a.id === 'pea')!.value).toBe(700);
  });

  it('retire l actif non financier materialise', () => {
    let s = addMovement(emptyState(), { kind: 'actif', amount: 450, date: '2026-07-25', label: 'Bureau' });
    s = addMovement(s, { kind: 'actif', amount: 900, date: '2026-07-26', label: 'Voiture' });
    const next = deleteMovement(s, s.movements[0].id);
    expect(next.nonFinancialAssets).toHaveLength(1);
    expect(next.nonFinancialAssets[0].name).toBe('Voiture');
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
    expect(s.assets.find((a) => a.id === 'cto')!.previousValue).toBe(1500);
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

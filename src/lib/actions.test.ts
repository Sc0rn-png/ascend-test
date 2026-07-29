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

  it('ne touche a aucun solde pour une depense sans compte', () => {
    const s = addMovement(withCto(), { kind: 'depense', amount: 200, date: '2026-07-25' });
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
  });

  it('debite le compte impute par une depense', () => {
    const s = addMovement(withCto(), { kind: 'depense', amount: 200, date: '2026-07-25', assetId: 'cto' });
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(1100);
    expect(s.assets.find((a) => a.id === 'pea')!.value).toBe(700);
  });

  // Le manque signale par Thomas : sans imputation, une depense laissait la
  // valeur nette immobile alors que son compte courant est un actif suivi.
  it('fait baisser la valeur nette d une depense imputee', () => {
    const avant = netWorth(withCto());
    const s = addMovement(withCto(), { kind: 'depense', amount: 200, date: '2026-07-25', assetId: 'cto' });
    expect(netWorth(s)).toBe(avant - 200);
  });

  it('credite le compte impute par une rentree', () => {
    const s = addMovement(withCto(), { kind: 'revenu', amount: 400, date: '2026-07-25', source: 'Tips', assetId: 'cto' });
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(1700);
    expect(s.assets.find((a) => a.id === 'pea')!.value).toBe(700);
  });

  it('ne touche a aucun solde pour une rentree sans compte', () => {
    const s = addMovement(withCto(), { kind: 'revenu', amount: 400, date: '2026-07-25', source: 'Tips' });
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
  });

  it('debite le compte qui finance un versement', () => {
    const s = addMovement(withCto(), { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto', fromAssetId: 'pea' });
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(1500);
    expect(s.assets.find((a) => a.id === 'pea')!.value).toBe(500);
  });

  // Un virement interne ne cree pas de richesse : l'argent change de poche.
  it('laisse la valeur nette immobile quand le versement vient d un compte suivi', () => {
    const avant = netWorth(withCto());
    const s = addMovement(withCto(), { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto', fromAssetId: 'pea' });
    expect(netWorth(s)).toBe(avant);
  });

  // Sans compte source, l'argent vient de l'exterieur : la valeur nette monte.
  it('fait monter la valeur nette d un versement sans compte source', () => {
    const avant = netWorth(withCto());
    const s = addMovement(withCto(), { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto' });
    expect(netWorth(s)).toBe(avant + 200);
  });

  it('debite le compte qui finance un actif sans toucher a l actif cree', () => {
    const s = addMovement(withCto(), { kind: 'actif', amount: 450, date: '2026-07-25', label: 'Bureau', fromAssetId: 'cto' });
    expect(s.assets.find((a) => a.id === 'cto')!.value).toBe(850);
    expect(s.nonFinancialAssets).toHaveLength(1);
    expect(s.nonFinancialAssets[0].value).toBe(450);
  });

  // Un compte efface depuis la saisie ne doit pas faire echouer l enregistrement.
  it('inscrit le mouvement meme si le compte impute n existe plus', () => {
    const s = addMovement(withCto(), { kind: 'depense', amount: 200, date: '2026-07-25', assetId: 'disparu' });
    expect(s.movements).toHaveLength(1);
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

  it('rend l argent au compte d une depense supprimee', () => {
    const s = addMovement(withCto(), { kind: 'depense', amount: 200, date: '2026-07-25', assetId: 'cto' });
    const next = deleteMovement(s, s.movements[0].id);
    expect(next.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
    expect(next.assets.find((a) => a.id === 'pea')!.value).toBe(700);
  });

  it('rend l argent au compte qui finançait un versement supprime', () => {
    const s = addMovement(withCto(), { kind: 'investissement', amount: 200, date: '2026-07-25', assetId: 'cto', fromAssetId: 'pea' });
    const next = deleteMovement(s, s.movements[0].id);
    expect(next.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
    expect(next.assets.find((a) => a.id === 'pea')!.value).toBe(700);
  });

  it('rend l argent au compte qui finançait un actif supprime', () => {
    const s = addMovement(withCto(), { kind: 'actif', amount: 450, date: '2026-07-25', label: 'Bureau', fromAssetId: 'cto' });
    const next = deleteMovement(s, s.movements[0].id);
    expect(next.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
    expect(next.nonFinancialAssets).toHaveLength(0);
  });

  it('reprend l argent au compte d une rentree supprimee', () => {
    const s = addMovement(withCto(), { kind: 'revenu', amount: 400, date: '2026-07-25', source: 'Tips', assetId: 'cto' });
    const next = deleteMovement(s, s.movements[0].id);
    expect(next.assets.find((a) => a.id === 'cto')!.value).toBe(1300);
  });

  it('retire l actif non financier materialise', () => {
    // 'Voiture' est cree en premier pour que 'Bureau', le sujet supprime,
    // n'atterrisse jamais a l'index 0 de nonFinancialAssets : une suppression
    // positionnelle (filter par index plutot que par id) serait ainsi demasquee.
    let s = addMovement(emptyState(), { kind: 'actif', amount: 900, date: '2026-07-25', label: 'Voiture' });
    s = addMovement(s, { kind: 'actif', amount: 450, date: '2026-07-26', label: 'Bureau' });
    const bureauMovement = s.movements.find((m) => m.label === 'Bureau')!;

    const next = deleteMovement(s, bureauMovement.id);

    expect(next.nonFinancialAssets.find((a) => a.id === bureauMovement.assetId)).toBeUndefined();
    expect(next.nonFinancialAssets.find((a) => a.name === 'Voiture')).toBeDefined();
    expect(next.nonFinancialAssets).toHaveLength(1);
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

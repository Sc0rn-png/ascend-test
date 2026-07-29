import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mois } from './Mois';
import { StoreProvider } from '@/lib/store';
import { emptyState } from '@/lib/storage';
import type { AppState, Movement } from '@/lib/types';

vi.mock('@/lib/movements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/movements')>();
  return { ...actual, currentMonthKey: () => '2026-07' };
});

function mvt(patch: Partial<Movement> & Pick<Movement, 'kind' | 'amount'>): Movement {
  return { id: Math.random().toString(36).slice(2), date: '2026-07-15', ...patch };
}

function seed(patch: Partial<AppState>) {
  localStorage.setItem('ascend_state_v3', JSON.stringify({ ...emptyState(), lastUpdateMonth: '2026-07', ...patch }));
}

function renderMois() {
  render(
    <StoreProvider>
      <Mois />
    </StoreProvider>
  );
}

describe('Mois', () => {
  beforeEach(() => localStorage.clear());

  it('liste les mouvements du mois avec leurs montants', () => {
    seed({
      movements: [
        mvt({ kind: 'revenu', amount: 1719, source: 'Salaire' }),
        mvt({ kind: 'depense', amount: 60 }),
        mvt({ kind: 'investissement', amount: 200 }),
      ],
    });
    renderMois();

    expect(screen.getByText('+1 719 €')).toBeInTheDocument();
    expect(screen.getByText('−60 €')).toBeInTheDocument();
    expect(screen.queryByText('−200 €')).not.toBeInTheDocument();
  });

  it('nomme le compte impute par une depense', () => {
    seed({
      assets: [{ id: 'cc', name: 'Compte courant', category: 'Compte courant', value: 500, target: 0, previousValue: 500 }],
      movements: [mvt({ kind: 'depense', amount: 60, assetId: 'cc' })],
    });
    renderMois();

    expect(screen.getByText(/15\/07\/2026 · Compte courant/)).toBeInTheDocument();
  });

  it('nomme le compte qui a finance un versement', () => {
    seed({
      assets: [
        { id: 'cc', name: 'Compte courant', category: 'Compte courant', value: 300, target: 0, previousValue: 300 },
        { id: 'cto', name: 'CTO', category: 'CTO', value: 1500, target: 0, previousValue: 1500 },
      ],
      movements: [mvt({ kind: 'investissement', amount: 200, assetId: 'cto', fromAssetId: 'cc' })],
    });
    renderMois();

    expect(screen.getByText('Investissement — CTO')).toBeInTheDocument();
    expect(screen.getByText(/15\/07\/2026 · depuis Compte courant/)).toBeInTheDocument();
  });

  it('n affiche aucun compte quand la depense n en impute pas', () => {
    seed({ movements: [mvt({ kind: 'depense', amount: 60 })] });
    renderMois();

    expect(screen.getByText('15/07/2026')).toBeInTheDocument();
  });

  // Un versement deplace l argent vers un placement et fait monter la valeur
  // nette : le presenter comme une sortie induit en erreur.
  it('ne prefixe de moins que les depenses', () => {
    seed({
      assets: [{ id: 'cto', name: 'CTO', category: 'CTO', value: 1300, target: 0, previousValue: 1300 }],
      movements: [
        mvt({ kind: 'investissement', amount: 200, assetId: 'cto' }),
        mvt({ kind: 'investissement', amount: 100, assetId: 'cto' }),
        mvt({ kind: 'depense', amount: 60 }),
        mvt({ kind: 'actif', amount: 40, label: 'Bureau' }),
      ],
    });
    renderMois();

    expect(screen.getByText('200 €')).toBeInTheDocument();
    expect(screen.getByText('40 €')).toBeInTheDocument();
    expect(screen.getByText('−60 €')).toBeInTheDocument();
  });

  it('nomme le placement credite par un versement', () => {
    seed({
      assets: [{ id: 'cto', name: 'CTO', category: 'CTO', value: 1300, target: 0, previousValue: 1100 }],
      movements: [mvt({ kind: 'investissement', amount: 200, assetId: 'cto' })],
    });
    renderMois();

    expect(screen.getByText('Investissement — CTO')).toBeInTheDocument();
  });

  it('retombe sur un libelle neutre quand le placement a disparu', () => {
    seed({
      assets: [],
      movements: [mvt({ kind: 'investissement', amount: 200, assetId: 'efface' })],
    });
    renderMois();

    expect(screen.getByText('Investissement')).toBeInTheDocument();
  });

  it('supprime un mouvement au clic sur son bouton de suppression', async () => {
    const user = userEvent.setup();
    seed({
      movements: [
        mvt({ kind: 'revenu', amount: 1719, source: 'Salaire' }),
        mvt({ kind: 'depense', amount: 60 }),
        mvt({ kind: 'investissement', amount: 200 }),
      ],
    });
    renderMois();

    // La liste est rendue en ordre inverse (plus recent en tete) : le second
    // bouton correspond donc a la depense, inseree en position centrale.
    const deleteButtons = screen.getAllByRole('button', { name: 'Supprimer ce mouvement' });
    expect(deleteButtons).toHaveLength(3);
    await user.click(deleteButtons[1]);

    expect(screen.queryByText('−60 €')).not.toBeInTheDocument();
    expect(screen.getByText('+1 719 €')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Supprimer ce mouvement' })).toHaveLength(2);
  });

  it('affiche un taux d’epargne negatif pour un mois deficitaire', () => {
    seed({
      movements: [
        mvt({ kind: 'revenu', amount: 1000, source: 'Salaire' }),
        mvt({ kind: 'depense', amount: 1500 }),
      ],
    });
    renderMois();

    expect(screen.getByText('-50 %')).toBeInTheDocument();
  });
});

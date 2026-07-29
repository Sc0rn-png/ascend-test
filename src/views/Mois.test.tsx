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
    expect(screen.getByText('−200 €')).toBeInTheDocument();
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
    expect(screen.getByText('−200 €')).toBeInTheDocument();
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

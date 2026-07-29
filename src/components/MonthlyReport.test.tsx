import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthlyReport } from './MonthlyReport';
import { StoreProvider } from '@/lib/store';
import { emptyState } from '@/lib/storage';
import type { AppState, Snapshot } from '@/lib/types';

vi.mock('@/lib/movements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/movements')>();
  return { ...actual, currentMonthKey: () => '2026-07' };
});

function snap(id: string, netWorth: number, debtTotal = 0): Snapshot {
  return { id, netWorth, financialPatrimoine: 0, nonFinancialPatrimoine: 0, debtTotal, encaisse: 0, depense: 0, investi: 0 };
}

function seed(patch: Partial<AppState>) {
  localStorage.setItem('ascend_state_v3', JSON.stringify({ ...emptyState(), lastUpdateMonth: '2026-07', ...patch }));
}

function renderReport(monthKey: string, onDismiss = vi.fn()) {
  render(
    <StoreProvider>
      <MonthlyReport monthKey={monthKey} onDismiss={onDismiss} />
    </StoreProvider>
  );
  return onDismiss;
}

describe('MonthlyReport', () => {
  beforeEach(() => localStorage.clear());

  it('affiche le montant et le pourcentage pour un mois positif', () => {
    seed({ snapshots: [snap('2026-06', 2000), snap('2026-07', 3000)] });
    renderReport('2026-07');

    expect(screen.getByText('+1 000 €')).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('affiche le montant sans pourcentage entre deux valeurs nettes negatives', () => {
    seed({ snapshots: [snap('2026-06', -2160), snap('2026-07', -1700)] });
    renderReport('2026-07');

    expect(screen.getByText('+460 €')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  // Le tout premier bilan de Thomas n a pas de predecesseur : afficher « +0 € »
  // en vert lui annoncait qu il ne s etait rien passe.
  it('remplace le chiffre par une phrase quand il n y a pas de mois precedent', () => {
    seed({ snapshots: [snap('2026-07', -2160)] });
    renderReport('2026-07');

    expect(screen.getByText('Premier mois enregistré — pas encore de comparaison')).toBeInTheDocument();
    expect(screen.queryByText(/[+−]\s?\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  // Le chiffre mesure des versements et du desendettement, pas de l epargne :
  // il lui faut une legende qui dise ce qu il est.
  it('nomme le chiffre principal', () => {
    seed({ snapshots: [snap('2026-06', 2000), snap('2026-07', 3000)] });
    renderReport('2026-07');

    expect(screen.getByText('Variation du patrimoine')).toBeInTheDocument();
  });

  it('affiche la variation de la dette quand il y a un mois precedent', () => {
    seed({ snapshots: [snap('2026-06', 2000, 5000), snap('2026-07', 3000, 4500)] });
    renderReport('2026-07');

    expect(screen.getByText('Dette')).toBeInTheDocument();
    expect(screen.getByText('−500 €')).toBeInTheDocument();
  });

  it('n affiche pas de variation de la dette sans mois precedent', () => {
    seed({ snapshots: [snap('2026-07', 3000, 5000)] });
    renderReport('2026-07');

    expect(screen.queryByText('Dette')).not.toBeInTheDocument();
  });

  it('affiche le montant sans pourcentage quand le mois traverse le zero vers le haut', () => {
    // Le mois precedent est negatif : rapporter une progression a une base
    // negative ne veut rien dire.
    seed({ snapshots: [snap('2026-06', -500), snap('2026-07', 800)] });
    renderReport('2026-07');

    expect(screen.getByText('+1 300 €')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('affiche le montant sans pourcentage quand le mois traverse le zero vers le bas', () => {
    seed({ snapshots: [snap('2026-06', 800), snap('2026-07', -500)] });
    renderReport('2026-07');

    expect(screen.getByText(/1 300 €/)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('appelle onDismiss au clic sur le bouton de fermeture', async () => {
    const user = userEvent.setup();
    seed({ snapshots: [snap('2026-07', 1000)] });
    const onDismiss = renderReport('2026-07');

    await user.click(screen.getByRole('button', { name: 'Fermer le bilan' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

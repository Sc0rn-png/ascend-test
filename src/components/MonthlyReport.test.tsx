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

function snap(id: string, netWorth: number): Snapshot {
  return { id, netWorth, financialPatrimoine: 0, nonFinancialPatrimoine: 0, debtTotal: 0, encaisse: 0, depense: 0, investi: 0 };
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

  it('affiche le montant sans pourcentage quand il n y a pas de mois precedent', () => {
    seed({ snapshots: [snap('2026-07', -2160)] });
    renderReport('2026-07');

    expect(screen.getByText('+0 €')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
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

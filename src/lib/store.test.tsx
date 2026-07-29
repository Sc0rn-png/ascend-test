import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { StoreProvider, useStore } from './store';
import { emptyState } from './storage';
import type { AppState } from './types';

vi.mock('./movements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./movements')>();
  return { ...actual, currentMonthKey: () => '2026-08' };
});

function Sonde() {
  const { state, justClosedMonth } = useStore();
  return (
    <div>
      <span data-testid="mois">{state.lastUpdateMonth}</span>
      <span data-testid="clos">{justClosedMonth ?? 'aucun'}</span>
      <span data-testid="snapshots">{state.snapshots.map((s) => s.id).join(',')}</span>
    </div>
  );
}

function seed(patch: Partial<AppState>) {
  localStorage.setItem('ascend_state_v3', JSON.stringify({ ...emptyState(), ...patch }));
}

function monter(strict = false) {
  const tree = <StoreProvider><Sonde /></StoreProvider>;
  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

describe('cloture mensuelle', () => {
  beforeEach(() => localStorage.clear());

  it('cloture le mois precedent au premier lancement du mois suivant', () => {
    seed({ lastUpdateMonth: '2026-07' });
    monter();
    expect(screen.getByTestId('snapshots').textContent).toBe('2026-07');
    expect(screen.getByTestId('mois').textContent).toBe('2026-08');
    expect(screen.getByTestId('clos').textContent).toBe('2026-07');
  });

  it('ne signale aucun bilan au tout premier lancement', () => {
    seed({ lastUpdateMonth: null });
    monter();
    expect(screen.getByTestId('clos').textContent).toBe('aucun');
    expect(screen.getByTestId('mois').textContent).toBe('2026-08');
    expect(screen.getByTestId('snapshots').textContent).toBe('2026-08');
  });

  it('ne cloture rien si le mois en cours est deja enregistre', () => {
    seed({ lastUpdateMonth: '2026-08' });
    monter();
    expect(screen.getByTestId('snapshots').textContent).toBe('');
    expect(screen.getByTestId('clos').textContent).toBe('aucun');
  });

  // Le garde `rolloverDone` existe pour ce cas precis : en mode strict, React
  // execute les effets deux fois en developpement.
  it('ne cloture qu une fois sous StrictMode', () => {
    seed({ lastUpdateMonth: '2026-07' });
    monter(true);
    expect(screen.getByTestId('snapshots').textContent).toBe('2026-07');
  });
});

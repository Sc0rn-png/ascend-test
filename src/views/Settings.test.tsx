import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from './Settings';
import { StoreProvider } from '@/lib/store';
import { emptyState } from '@/lib/storage';
import type { AppState } from '@/lib/types';

vi.mock('@/lib/movements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/movements')>();
  return { ...actual, currentMonthKey: () => '2026-07' };
});

// jsdom n implemente pas ResizeObserver, dont dependent les curseurs Radix.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub;

function seed(patch: Partial<AppState>) {
  localStorage.setItem('ascend_state_v3', JSON.stringify({ ...emptyState(), lastUpdateMonth: '2026-07', ...patch }));
}

function lu(): AppState {
  return JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
}

function renderSettings() {
  return render(
    <StoreProvider>
      <Settings />
    </StoreProvider>
  );
}

function fichier(contenu: unknown): File {
  return new File([JSON.stringify(contenu)], 'ascend-export.json', { type: 'application/json' });
}

const exportValide = {
  ...emptyState(),
  goal: 50000,
  lastUpdateMonth: '2026-07',
  assets: [{ id: 'a', name: 'PEA', category: 'PEA', value: 700, target: 10000, previousValue: 700 }],
};

describe('Settings', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  // Vider le champ ecrivait une chaine vide, que la validation rejette au
  // lancement suivant : tout l historique partait avec.
  it('ignore un champ de date cible vide', () => {
    seed({ targetDate: '2029-12-31' });
    const { container } = renderSettings();

    const champ = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '' } });

    expect(lu().targetDate).toBe('2029-12-31');
  });

  it('remplace la date cible par une valeur non vide', () => {
    seed({ targetDate: '2029-12-31' });
    const { container } = renderSettings();

    const champ = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '2030-06-15' } });

    expect(lu().targetDate).toBe('2030-06-15');
  });

  it('demande confirmation avant de remplacer des donnees existantes', async () => {
    const confirmer = vi.spyOn(window, 'confirm').mockReturnValue(false);
    seed({ goal: 10000, movements: [{ id: 'm', date: '2026-07-15', kind: 'depense', amount: 60 }] });
    const { container } = renderSettings();

    const champ = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { files: [fichier(exportValide)] } });

    await waitFor(() => expect(confirmer).toHaveBeenCalled());
    expect(lu().goal).toBe(10000);
    expect(lu().movements).toHaveLength(1);
  });

  it('remplace les donnees quand la confirmation est acceptee', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    seed({ goal: 10000, movements: [{ id: 'm', date: '2026-07-15', kind: 'depense', amount: 60 }] });
    const { container } = renderSettings();

    const champ = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { files: [fichier(exportValide)] } });

    await waitFor(() => expect(lu().goal).toBe(50000));
    expect(lu().movements).toHaveLength(0);
  });

  it('n interroge pas quand rien n a encore ete saisi', async () => {
    const confirmer = vi.spyOn(window, 'confirm').mockReturnValue(false);
    seed({});
    const { container } = renderSettings();

    const champ = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { files: [fichier(exportValide)] } });

    await waitFor(() => expect(lu().goal).toBe(50000));
    expect(confirmer).not.toHaveBeenCalled();
  });
});

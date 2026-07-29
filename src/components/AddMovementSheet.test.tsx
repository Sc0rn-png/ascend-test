import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddMovementSheet } from './AddMovementSheet';
import { StoreProvider } from '@/lib/store';

function renderSheet(onClose = vi.fn()) {
  const { container } = render(
    <StoreProvider>
      <AddMovementSheet onClose={onClose} />
    </StoreProvider>
  );
  return Object.assign(onClose, { container });
}

describe('AddMovementSheet', () => {
  beforeEach(() => localStorage.clear());

  it('propose les quatre types de mouvement', () => {
    renderSheet();
    expect(screen.getByRole('button', { name: /rentrée/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dépense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /investissement/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actif/i })).toBeInTheDocument();
  });

  // Le chemin le plus court doit rester le plus frequent : montant, valider.
  it('ne demande que le montant et la date pour une depense', async () => {
    const user = userEvent.setup();
    const { container } = renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));

    const intitules = Array.from(container.querySelectorAll('label')).map((l) => l.textContent);
    expect(intitules).toEqual(['Montant (€)', 'Date']);
  });

  it('demande la source pour une rentree', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /rentrée/i }));
    expect(screen.getByRole('button', { name: 'Salaire' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tips' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Business' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exceptionnel' })).toBeInTheDocument();
  });

  it('refuse un montant nul', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
  });

  it('enregistre le mouvement puis ferme la feuille', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '60');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(onClose).toHaveBeenCalled();
    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      expect(sauvegarde.movements).toHaveLength(1);
      expect(sauvegarde.movements[0]).toMatchObject({ kind: 'depense', amount: 60 });
    });
  });

  it('enregistre le montant en nombre et date du jour par defaut', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    const aujourdhui = (screen.getByLabelText(/date/i) as HTMLInputElement).value;
    await user.type(screen.getByLabelText(/montant/i), '12.5');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      expect(sauvegarde.movements[0].amount).toBe(12.5);
      expect(sauvegarde.movements[0].date).toBe(aujourdhui);
    });
  });

  it('propose la date du jour par defaut', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(screen.getByLabelText(/date/i)).toHaveValue(iso);
  });
});

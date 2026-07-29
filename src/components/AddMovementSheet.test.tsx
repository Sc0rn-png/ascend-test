import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddMovementSheet } from './AddMovementSheet';
import { StoreProvider } from '@/lib/store';

function renderSheet(onClose = vi.fn()) {
  render(
    <StoreProvider>
      <AddMovementSheet onClose={onClose} />
    </StoreProvider>
  );
  return onClose;
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
  it('ne demande aucun motif pour une depense', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    expect(screen.getByLabelText(/montant/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/motif/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/catégorie/i)).not.toBeInTheDocument();
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

  it('ferme la feuille apres enregistrement', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '60');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onClose).toHaveBeenCalled();
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

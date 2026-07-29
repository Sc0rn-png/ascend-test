import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  // Le compte impute s'ajoute sans tap supplementaire puisqu'il est prerempli.
  it('ne demande que le montant, le compte et la date pour une depense', async () => {
    const user = userEvent.setup();
    const { container } = renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));

    const intitules = Array.from(container.querySelectorAll('label')).map((l) => l.textContent);
    expect(intitules).toEqual(['Montant (€)', 'Payé depuis', 'Date']);
  });

  it('impute la depense au compte courant sans tap supplementaire', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '60');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      const compte = sauvegarde.assets.find((a: { category: string }) => a.category === 'Compte courant');
      expect(compte.value).toBe(440);
      expect(sauvegarde.movements[0].assetId).toBe(compte.id);
    });
  });

  it('credite le compte courant d une rentree', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /rentrée/i }));
    await user.type(screen.getByLabelText(/montant/i), '400');
    await user.click(screen.getByRole('button', { name: 'Tips' }));
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      const compte = sauvegarde.assets.find((a: { category: string }) => a.category === 'Compte courant');
      expect(compte.value).toBe(900);
    });
  });

  // Rattrapage de fin de mois : le solde a deja ete recale a la main, la
  // depense ne doit alors compter que dans le bilan.
  it('permet de ne toucher a aucun solde', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '60');
    await user.click(screen.getByRole('button', { name: /ne pas impacter/i }));
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      const compte = sauvegarde.assets.find((a: { category: string }) => a.category === 'Compte courant');
      expect(compte.value).toBe(500);
      expect(sauvegarde.movements[0].assetId).toBeUndefined();
      expect(sauvegarde.movements[0].amount).toBe(60);
    });
  });

  it('montre le solde du compte avant et apres le mouvement', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '60');

    expect(screen.getByText(/Compte courant\s*:\s*500\s*€\s*→\s*440\s*€/)).toBeInTheDocument();
  });

  // Un virement interne ne cree pas de richesse : le compte source paie ce que
  // le placement recoit.
  it('finance un versement par le compte courant sans tap supplementaire', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /investissement/i }));
    await user.type(screen.getByLabelText(/montant/i), '200');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      const pea = sauvegarde.assets.find((a: { category: string }) => a.category === 'PEA');
      const compte = sauvegarde.assets.find((a: { category: string }) => a.category === 'Compte courant');
      expect(pea.value).toBe(900);
      expect(compte.value).toBe(300);
    });
  });

  it('ne propose pas de financer un placement par lui-meme', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /investissement/i }));

    // Le CTO parait deux fois : comme placement vise et comme compte payeur.
    const avant = screen.getAllByRole('button', { name: 'CTO' });
    expect(avant).toHaveLength(2);

    await user.click(avant[0]);

    expect(screen.getAllByRole('button', { name: 'CTO' })).toHaveLength(1);
  });

  // Ajouter un bien deja possede est un inventaire : rien ne sort d'un compte.
  it('ne debite aucun compte pour un actif par defaut', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /actif/i }));
    await user.type(screen.getByLabelText(/montant/i), '450');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      const compte = sauvegarde.assets.find((a: { category: string }) => a.category === 'Compte courant');
      expect(compte.value).toBe(500);
      expect(sauvegarde.nonFinancialAssets.find((a: { value: number }) => a.value === 450)).toBeDefined();
      expect(sauvegarde.movements[0].fromAssetId).toBeUndefined();
    });
  });

  it('laisse choisir un autre compte que celui par defaut', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '30');
    await user.click(screen.getByRole('button', { name: 'Livret A' }));
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      const livret = sauvegarde.assets.find((a: { category: string }) => a.category === 'Livret A');
      const compte = sauvegarde.assets.find((a: { category: string }) => a.category === 'Compte courant');
      expect(livret.value).toBe(170);
      expect(compte.value).toBe(500);
    });
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

  // Une date videe produisait un mouvement rattache a aucun mois, donc
  // introuvable dans la liste et impossible a supprimer.
  it('refuse une date vide', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '60');
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '' } });

    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
  });

  // Le clavier francais d Android propose une virgule : elle doit valoir un
  // separateur decimal, pas une saisie invalide.
  it('accepte la virgule comme separateur decimal', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '37,42');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      expect(sauvegarde.movements[0].amount).toBe(37.42);
    });
  });

  it('accepte le point comme separateur decimal', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), '37.42');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      const sauvegarde = JSON.parse(localStorage.getItem('ascend_state_v3') ?? '{}');
      expect(sauvegarde.movements[0].amount).toBe(37.42);
    });
  });

  it('refuse une saisie non numerique', async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole('button', { name: /dépense/i }));
    await user.type(screen.getByLabelText(/montant/i), 'douze');

    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
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

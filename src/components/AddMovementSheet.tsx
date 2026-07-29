import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, PiggyBank, Sofa } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatEuro, isValidDateISO, todayISO } from '@/lib/storage';
import { INCOME_SOURCES, isFinancialCategory, type Asset, type IncomeSource, type MovementKind } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

const KINDS: { id: MovementKind; label: string; icon: typeof TrendingUp }[] = [
  { id: 'revenu', label: 'Rentrée', icon: TrendingUp },
  { id: 'depense', label: 'Dépense', icon: TrendingDown },
  { id: 'investissement', label: 'Investissement', icon: PiggyBank },
  { id: 'actif', label: 'Actif', icon: Sofa },
];

const choix = (actif: boolean) =>
  cn(
    'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
    actif ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground'
  );

function ComptePicker({
  titre,
  comptes,
  valeur,
  onChange,
  montant,
  sens,
}: {
  titre: string;
  comptes: Asset[];
  valeur: string;
  onChange: (id: string) => void;
  montant: number;
  sens: 1 | -1;
}) {
  const choisi = comptes.find((a) => a.id === valeur);
  const bouge = Number.isFinite(montant) && montant > 0;

  return (
    <div>
      <Label className="text-xs">{titre}</Label>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {comptes.map((a) => (
          <button key={a.id} onClick={() => onChange(a.id)} className={choix(valeur === a.id)}>
            {a.name}
          </button>
        ))}
        {/* Rattrapage de fin de mois : le solde a deja ete recale a la main, le
            mouvement ne doit alors compter que dans le bilan. */}
        <button onClick={() => onChange('')} className={choix(valeur === '')}>
          Ne pas impacter
        </button>
      </div>
      {choisi && (
        <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
          {choisi.name} : {formatEuro(choisi.value)}
          {bouge && ` → ${formatEuro(choisi.value + sens * montant)}`}
        </p>
      )}
    </div>
  );
}

export function AddMovementSheet({ onClose }: { onClose: () => void }) {
  const { state, addMovement } = useStore();
  const [kind, setKind] = useState<MovementKind | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [source, setSource] = useState<IncomeSource>('Salaire');
  const [assetId, setAssetId] = useState(state.assets.find((a) => isFinancialCategory(a.category))?.id ?? '');
  const [label, setLabel] = useState('');

  const comptes = state.assets.filter((a) => isFinancialCategory(a.category));
  // Le compte courant porte le quotidien : le preselectionner garde la depense
  // a un seul geste tout en impactant le solde.
  const compteParDefaut =
    comptes.find((a) => a.category === 'Compte courant') ?? comptes.find((a) => a.category === 'Cash') ?? comptes[0];
  const [compteId, setCompteId] = useState(compteParDefaut?.id ?? '');

  // Le clavier francais d'Android propose une virgule pour les decimales.
  const montant = Number(amount.replace(',', '.'));
  const valide = Number.isFinite(montant) && montant > 0 && isValidDateISO(date);

  const choisirType = (id: MovementKind) => {
    setKind(id);
    // Une acquisition est souvent l'inventaire d'un bien deja possede : rien ne
    // doit sortir d'un compte tant que le compte n'a pas ete choisi.
    setCompteId(id === 'actif' ? '' : (compteParDefaut?.id ?? ''));
  };

  const submit = () => {
    if (!kind || !valide) return;
    addMovement({
      kind,
      amount: montant,
      date,
      source: kind === 'revenu' ? source : undefined,
      assetId:
        kind === 'investissement'
          ? assetId
          : kind === 'depense' || kind === 'revenu'
            ? compteId || undefined
            : undefined,
      fromAssetId: kind === 'investissement' || kind === 'actif' ? compteId || undefined : undefined,
      label: kind === 'revenu' || kind === 'actif' ? label || undefined : undefined,
    });
    onClose();
  };

  return (
    // Au-dessus de la barre de navigation (z-50), sans quoi elle recouvre les
    // boutons de la feuille, ancree en bas sur mobile.
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease }}
        // Le choix du compte allonge le formulaire : sans hauteur bornee, son
        // haut sortait de l'ecran une fois le clavier Android ouvert.
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border/60 bg-card p-6 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{kind ? KINDS.find((k) => k.id === kind)?.label : 'Ajouter'}</h3>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {kind === null ? (
          <div className="grid grid-cols-2 gap-3">
            {KINDS.map(({ id, label: l, icon: Icon }) => (
              <button
                key={id}
                onClick={() => choisirType(id)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-5 transition-colors hover:bg-secondary"
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{l}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="montant" className="text-xs">Montant (€)</Label>
              <Input
                id="montant"
                type="text"
                inputMode="decimal"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 text-2xl font-semibold"
              />
            </div>

            {kind === 'revenu' && (
              <div>
                <Label className="text-xs">Source</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {INCOME_SOURCES.map((s) => (
                    <button key={s} onClick={() => setSource(s)} className={choix(source === s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kind === 'revenu' && source === 'Business' && (
              <div>
                <Label htmlFor="business" className="text-xs">Quel business (facultatif)</Label>
                <Input id="business" value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" />
              </div>
            )}

            {kind === 'investissement' && (
              <div>
                <Label className="text-xs">Placement</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {comptes.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAssetId(a.id);
                        // Un versement d'un compte vers lui-meme ne veut rien dire.
                        if (compteId === a.id) setCompteId('');
                      }}
                      className={choix(assetId === a.id)}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kind === 'actif' && (
              <div>
                <Label htmlFor="actif" className="text-xs">Quoi</Label>
                <Input id="actif" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bureau, meuble..." className="mt-1" />
              </div>
            )}

            {(kind === 'depense' || kind === 'revenu') && (
              <ComptePicker
                titre={kind === 'depense' ? 'Payé depuis' : 'Reçu sur'}
                comptes={comptes}
                valeur={compteId}
                onChange={setCompteId}
                montant={montant}
                sens={kind === 'revenu' ? 1 : -1}
              />
            )}

            {(kind === 'investissement' || kind === 'actif') && (
              <ComptePicker
                titre="Payé depuis"
                comptes={comptes.filter((a) => kind !== 'investissement' || a.id !== assetId)}
                valeur={compteId}
                onChange={setCompteId}
                montant={montant}
                sens={-1}
              />
            )}

            <div>
              <Label htmlFor="date" className="text-xs">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setKind(null)} className="flex-1">Retour</Button>
              <Button onClick={submit} disabled={!valide} className="flex-1">Enregistrer</Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

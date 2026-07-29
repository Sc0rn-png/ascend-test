import { motion } from 'framer-motion';
import { Trash2, TrendingUp, TrendingDown, PiggyBank, Sofa } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatEuro } from '@/lib/storage';
import { monthLabelLong } from '@/lib/calc';
import {
  currentMonthKey, movementsOfMonth, totalIncome, totalExpense,
  totalInvested, savingsRate, monthKeysWithActivity,
} from '@/lib/movements';
import { Card } from '@/components/ui/card';
import type { Movement } from '@/lib/types';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

const ICONS = {
  revenu: TrendingUp,
  depense: TrendingDown,
  investissement: PiggyBank,
  actif: Sofa,
} as const;

function describe(m: Movement): string {
  if (m.kind === 'revenu') return m.label ? `${m.source} — ${m.label}` : (m.source ?? 'Rentrée');
  if (m.kind === 'depense') return 'Dépense';
  if (m.kind === 'investissement') return 'Investissement';
  return m.label ?? 'Actif';
}

export function Mois() {
  const { state, deleteMovement } = useStore();
  const key = currentMonthKey();
  const mouvements = movementsOfMonth(state, key).slice().reverse();

  const rentre = totalIncome(mouvements);
  const depense = totalExpense(mouvements);
  const investi = totalInvested(mouvements);
  const taux = savingsRate(mouvements);

  const autresMois = monthKeysWithActivity(state).filter((k) => k !== key);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Card className="border-border/50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mois en cours</p>
          <h2 className="mt-0.5 text-lg font-semibold capitalize">{monthLabelLong(key)}</h2>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Rentré</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">{formatEuro(rentre)}</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Dépensé</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-destructive">{formatEuro(depense)}</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Investi</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatEuro(investi)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Taux d'épargne</span>
            <span className={cn('font-semibold tabular-nums', taux >= 0 ? 'text-primary' : 'text-destructive')}>
              {taux.toFixed(0)} %
            </span>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease }}>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Mouvements</p>
        <div className="space-y-2">
          {mouvements.length === 0 ? (
            <Card className="border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
              Aucun mouvement ce mois-ci. Touche le bouton + pour en ajouter un.
            </Card>
          ) : (
            mouvements.map((m) => {
              const Icon = ICONS[m.kind];
              const positif = m.kind === 'revenu';
              return (
                <Card key={m.id} className="border-border/50 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <Icon className={cn('h-4 w-4', positif ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{describe(m)}</p>
                      <p className="text-[11px] text-muted-foreground">{m.date.split('-').reverse().join('/')}</p>
                    </div>
                    <span className={cn('text-sm font-semibold tabular-nums', positif ? 'text-primary' : 'text-foreground')}>
                      {positif ? '+' : '−'}{formatEuro(m.amount)}
                    </span>
                    <button
                      onClick={() => deleteMovement(m.id)}
                      aria-label="Supprimer ce mouvement"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </motion.div>

      {autresMois.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Mois précédents</p>
          <div className="space-y-2">
            {autresMois.map((k) => {
              const snap = state.snapshots.find((s) => s.id === k);
              return (
                <Card key={k} className="border-border/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{monthLabelLong(k)}</span>
                    <span className="text-sm font-semibold tabular-nums">{snap ? formatEuro(snap.netWorth) : '—'}</span>
                  </div>
                  {snap && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Rentré {formatEuro(snap.encaisse)}</span>
                      <span>Dépensé {formatEuro(snap.depense)}</span>
                      <span>Investi {formatEuro(snap.investi)}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

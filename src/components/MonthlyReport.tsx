import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatEuro } from '@/lib/storage';
import { monthLabelLong } from '@/lib/calc';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function MonthlyReport({ monthKey, onDismiss }: { monthKey: string; onDismiss: () => void }) {
  const { state } = useStore();
  const snapshots = state.snapshots;
  const index = snapshots.findIndex((s) => s.id === monthKey);
  if (index === -1) return null;

  const snap = snapshots[index];
  const previous = index > 0 ? snapshots[index - 1] : null;
  const evolution = previous ? snap.netWorth - previous.netWorth : 0;
  const dette = previous ? snap.debtTotal - previous.debtTotal : null;

  // Un pourcentage n a de sens que sur une base positive : entre deux valeurs
  // nettes negatives, ou de part et d autre de zero, il induit en erreur.
  const base = previous?.netWorth ?? 0;
  const percent = previous && base > 0 && snap.netWorth > 0 ? (evolution / base) * 100 : null;

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
      <Card className="border-primary/30 bg-primary/5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bilan du mois</p>
            <h2 className="mt-0.5 text-lg font-semibold capitalize">{monthLabelLong(monthKey)}</h2>
          </div>
          <button onClick={onDismiss} aria-label="Fermer le bilan" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {previous ? (
          <>
            {/* Le chiffre mesure les versements et le desendettement, pas ce que
                Thomas a mis de cote : il ne doit pas se lire comme une epargne. */}
            <p className="mt-4 text-xs text-muted-foreground">Variation du patrimoine</p>
            <div className={cn('mt-1 flex items-center gap-2 text-3xl font-semibold tabular-nums', evolution >= 0 ? 'text-primary' : 'text-destructive')}>
              {evolution >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {evolution >= 0 ? '+' : '−'}{formatEuro(Math.abs(evolution))}
            </div>
            {percent !== null && (
              <p className="mt-1 text-sm text-muted-foreground">
                soit {percent >= 0 ? '+' : ''}{percent.toFixed(1)} % par rapport au mois précédent
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Premier mois enregistré — pas encore de comparaison</p>
        )}

        <div className={cn('mt-4 grid gap-2 text-center', dette !== null ? 'grid-cols-2' : 'grid-cols-3')}>
          <div className="rounded-xl bg-secondary/40 p-3">
            <p className="text-[11px] text-muted-foreground">Rentré</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatEuro(snap.encaisse)}</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-3">
            <p className="text-[11px] text-muted-foreground">Dépensé</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatEuro(snap.depense)}</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-3">
            <p className="text-[11px] text-muted-foreground">Investi</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatEuro(snap.investi)}</p>
          </div>
          {dette !== null && (
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Dette</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {dette > 0 ? '+' : dette < 0 ? '−' : ''}{formatEuro(Math.abs(dette))}
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { TrendingUp, Store, Target, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useStore } from '@/lib/store';
import { formatEuro, formatPercent } from '@/lib/storage';
import { monthLabel } from '@/lib/calc';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Business() {
  const { state } = useStore();
  const b = state.business;
  const roas = b.adSpend > 0 ? b.ca / b.adSpend : 0;
  const caEvol = b.previousCa === 0 ? 0 : ((b.ca - b.previousCa) / b.previousCa) * 100;

  const historyData = state.snapshots.map((s) => ({
    label: monthLabel(s.date),
    business: s.business,
  }));

  const metrics = [
    { label: 'CA', value: b.ca, format: formatEuro },
    { label: 'Bénéfice', value: b.profit, format: formatEuro },
    { label: 'ROAS', value: roas, format: (v: number) => `${v.toFixed(1)}x` },
    { label: 'Panier moyen', value: b.avgBasket, format: formatEuro },
    { label: 'Commandes', value: b.orders, format: (v: number) => `${v}` },
    { label: 'Conversion', value: b.conversion, format: (v: number) => `${v}%` },
    { label: 'Budget pub', value: b.adSpend, format: formatEuro },
    { label: 'Trésorerie', value: b.treasury, format: formatEuro },
  ];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">L'Étendard</h2>
              <p className="text-sm text-muted-foreground">Boutique en ligne</p>
            </div>
            <div className={cn('flex items-center gap-1 text-sm font-medium', caEvol >= 0 ? 'text-primary' : 'text-destructive')}>
              <TrendingUp className="h-4 w-4" />
              {formatPercent(caEvol)}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chiffre d'affaires</p>
            <AnimatedNumber value={b.ca} format={formatEuro} className="mt-1 block text-3xl font-semibold" />
          </div>
        </Card>
      </motion.div>

      {/* Metrics grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease }}>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Indicateurs</p>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <Card key={m.label} className="border-border/50 p-4">
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
              <AnimatedNumber value={m.value} format={m.format} className="mt-1.5 block text-lg font-semibold" />
            </Card>
          ))}
        </div>
      </motion.div>

      {/* History chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        <Card className="border-border/50 p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Évolution business</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(220 10% 60%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(220 10% 60%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 16% 9%)', border: '1px solid hsl(222 14% 16%)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatEuro(v)}
                  cursor={{ fill: 'hsl(158 64% 52% / 0.05)' }}
                />
                <Bar dataKey="business" radius={[6, 6, 0, 0]}>
                  {historyData.map((_, i) => (
                    <Cell key={i} fill={i === historyData.length - 1 ? 'hsl(158 64% 52%)' : 'hsl(158 64% 52% / 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Objectifs */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Objectifs business</p>
          </div>
          <div className="mt-4 space-y-3">
            <ObjectiveRow label="CA mensuel" current={b.ca} target={2000} />
            <ObjectiveRow label="Marge bénéficiaire" current={b.profit} target={800} />
            <ObjectiveRow label="Trésorerie" current={b.treasury} target={2000} />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function ObjectiveRow({ label, current, target }: { label: string; current: number; target: number }) {
  const pct = target === 0 ? 100 : Math.min(100, (current / target) * 100);
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{formatEuro(current)} / {formatEuro(target)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease }} />
      </div>
    </div>
  );
}

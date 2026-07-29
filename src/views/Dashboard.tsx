import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Calendar, PiggyBank, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useStore } from '@/lib/store';
import {
  netWorth, netWorthEvolution, daysUntilTarget, formatDateFR, actualAllocation,
  allocationColor, totalNonFinancialAssets, financialPatrimoine, totalInvestmentPlan,
  projectedMonthsToGoal, monthLabel,
} from '@/lib/calc';
import { formatEuro } from '@/lib/storage';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { MilestoneBar } from '@/components/MilestoneBar';
import { MonthlyReport } from '@/components/MonthlyReport';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Dashboard() {
  const { state, justClosedMonth, dismissReport } = useStore();
  const net = netWorth(state);
  const evolution = netWorthEvolution(state);
  const financial = financialPatrimoine(state);
  const nonFinancial = totalNonFinancialAssets(state);
  const allocation = actualAllocation(state);
  const monthlyInvest = totalInvestmentPlan(state);
  const projectedMonths = projectedMonthsToGoal(state);
  const days = daysUntilTarget(state.targetDate);

  const historyData = state.snapshots.length > 0
    ? state.snapshots.map((s) => ({ label: monthLabel(s.id), net: s.netWorth }))
    : [{ label: 'Maintenant', net }];

  const investPlanData = [
    { name: 'PEA', value: state.investmentPlan.PEA },
    { name: 'CTO', value: state.investmentPlan.CTO },
    { name: 'BTC', value: state.investmentPlan.Bitcoin },
    { name: 'Livret A', value: state.investmentPlan.LivretA },
  ];

  return (
    <div className="space-y-5">
      {justClosedMonth && <MonthlyReport monthKey={justClosedMonth} onDismiss={dismissReport} />}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Card className="border-border/50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Valeur nette</p>
          <div className="mt-2 flex items-end gap-3">
            <AnimatedNumber value={net} format={formatEuro} className="text-4xl font-semibold tracking-tight" />
            <div className={cn('mb-1.5 flex items-center gap-1 text-sm font-medium', evolution >= 0 ? 'text-primary' : 'text-destructive')}>
              {evolution >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatEuro(Math.abs(evolution))}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">vs mois précédent</p>

          <MilestoneBar />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Patrimoine financier</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatEuro(financial)}</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Actifs non financiers</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatEuro(nonFinancial)}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease }}>
        <Card className="border-border/50 p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-destructive" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dette restante</p>
            <span className="ml-auto text-xl font-semibold tabular-nums">{formatEuro(state.debtTotal)}</span>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Horizon</p>
              <p className="mt-1 text-lg font-semibold">{formatEuro(state.goal)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2.5 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{formatDateFR(state.targetDate)}</span>
            <span className="ml-auto font-medium tabular-nums">{days} jours</span>
          </div>
          {projectedMonths !== null && projectedMonths > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <PiggyBank className="h-3.5 w-3.5 text-primary" />
              <span>À {formatEuro(monthlyInvest)}/mois, atteint dans ~{projectedMonths} mois</span>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14, ease }}>
        <Card className="border-border/50 p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Évolution valeur nette</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(220 10% 60%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(220 10% 60%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 16% 9%)', border: '1px solid hsl(222 14% 16%)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatEuro(v)}
                  cursor={{ fill: 'hsl(158 64% 52% / 0.05)' }}
                />
                <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                  {historyData.map((_, i) => (
                    <Cell key={i} fill={i === historyData.length - 1 ? 'hsl(158 64% 52%)' : 'hsl(158 64% 52% / 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease }}>
        <Card className="border-border/50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Allocation</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={3} stroke="none">
                    {allocation.map((entry) => <Cell key={entry.name} fill={allocationColor(entry.name)} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Total</span>
                <span className="text-sm font-semibold">{formatEuro(financial)}</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {allocation.map((a) => {
                const targetPct = (state.targetAllocation as unknown as Record<string, number>)[a.name] ?? 0;
                return (
                  <div key={a.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: allocationColor(a.name) }} />
                    <span className="flex-1 text-muted-foreground">{a.name}</span>
                    <span className="font-medium tabular-nums">{Math.round(a.percent)}%</span>
                    <span className="text-xs text-muted-foreground/60 tabular-nums">/ {targetPct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan mensuel</p>
            <span className="ml-auto text-sm font-semibold tabular-nums text-primary">{formatEuro(monthlyInvest)}</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {investPlanData.map((item) => {
              const total = investPlanData.reduce((s, i) => s + i.value, 0);
              const pct = total === 0 ? 0 : (item.value / total) * 100;
              const colorKey = item.name === 'BTC' ? 'Bitcoin' : item.name === 'Livret A' ? 'LivretA' : item.name;
              return (
                <div key={item.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium tabular-nums">{formatEuro(item.value)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: allocationColor(colorKey) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Calendar, Award, Zap, Briefcase, Wallet, PiggyBank } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useStore } from '@/lib/store';
import {
  netWorth, netWorthEvolution, totalDebt, totalIncome, progressPercent,
  daysUntilTarget, formatDateFR, actualAllocation, allocationColor,
  globalScore, computeLevel, independentIncome, investedPatrimoine,
  cashAvailable, savingsRate, totalNonFinancialAssets, financialPatrimoine,
  totalInvestmentPlan, projectedMonthsToGoal, monthLabel,
} from '@/lib/calc';
import { formatEuro, formatPercent } from '@/lib/storage';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ProgressBar } from '@/components/ProgressBar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Dashboard() {
  const { state } = useStore();
  const net = netWorth(state);
  const evolution = netWorthEvolution(state);
  const debt = totalDebt(state);
  const income = totalIncome(state);
  const progress = progressPercent(state);
  const days = daysUntilTarget(state.targetDate);
  const allocation = actualAllocation(state);
  const score = globalScore(state);
  const level = computeLevel(state);
  const nonFinancial = totalNonFinancialAssets(state);
  const financial = financialPatrimoine(state);
  const monthlyInvest = totalInvestmentPlan(state);
  const projectedMonths = projectedMonthsToGoal(state);

  const historyData = state.snapshots.length > 0
    ? state.snapshots.map((s) => ({ label: monthLabel(s.date), net: s.netWorth, financial: s.financialPatrimoine }))
    : [{ label: 'Maintenant', net, financial }];

  const investPlanData = [
    { name: 'PEA', value: state.investmentPlan.PEA },
    { name: 'CTO', value: state.investmentPlan.CTO },
    { name: 'BTC', value: state.investmentPlan.Bitcoin },
    { name: 'Livret A', value: state.investmentPlan.LivretA },
  ];

  return (
    <div className="space-y-5">
      {/* Hero progress */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Objectif patrimonial</p>
              <AnimatedNumber value={state.goal} format={formatEuro} className="text-3xl font-semibold tracking-tight" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Progression</span>
              <span className="text-2xl font-semibold tabular-nums text-primary">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} height="h-3" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatEuro(net)}</span>
              <span>{formatEuro(state.goal)}</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2.5 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{formatDateFR(state.targetDate)}</span>
            <span className="ml-auto font-medium tabular-nums">{days} jours restants</span>
          </div>
          {projectedMonths !== null && projectedMonths > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <PiggyBank className="h-3.5 w-3.5 text-primary" />
              <span>À {formatEuro(monthlyInvest)}/mois d'investissement, objectif atteint dans ~{projectedMonths} mois</span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Net worth big card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease }}>
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

      {/* Debt + income row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
          <Card className="border-border/50 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dette restante</p>
            <AnimatedNumber value={debt} format={formatEuro} className="mt-2 block text-2xl font-semibold" />
            <div className="mt-3">
              <ProgressBar value={debt === 0 ? 100 : Math.max(0, 100 - (debt / (debt + net + 0.01)) * 100)} color="bg-destructive" height="h-1.5" />
              <p className="mt-1.5 text-xs text-muted-foreground">vers 0 €</p>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12, ease }}>
          <Card className="border-border/50 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenus / mois</p>
            <AnimatedNumber value={income} format={formatEuro} className="mt-2 block text-2xl font-semibold" />
            <div className="mt-3 space-y-1">
              {state.incomes.slice(0, 3).map((i) => (
                <div key={i.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{i.name}</span>
                  <span className="tabular-nums">{formatEuro(i.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Net worth evolution chart */}
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

      {/* Allocation */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease }}>
        <Card className="border-border/50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Allocation patrimoine financier</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={3} stroke="none">
                    {allocation.map((entry) => (
                      <Cell key={entry.name} fill={allocationColor(entry.name)} />
                    ))}
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

      {/* Investment plan */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan d'investissement mensuel</p>
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

      {/* KPI grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease }}>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Indicateurs clés</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Valeur nette', value: net, icon: Target, format: formatEuro },
            { label: 'Patrimoine financier', value: financial, icon: Wallet, format: formatEuro },
            { label: 'Cash disponible', value: cashAvailable(state), icon: TrendingUp, format: formatEuro },
            { label: 'Dette', value: debt, icon: TrendingDown, format: formatEuro },
            { label: 'Taux d\'épargne', value: savingsRate(state), icon: Zap, format: (v: number) => `${Math.round(v)}%` },
            { label: 'Patrimoine investi', value: investedPatrimoine(state), icon: TrendingUp, format: formatEuro },
            { label: 'Revenus indépendants', value: independentIncome(state), icon: Briefcase, format: formatEuro },
            { label: 'Total revenus', value: income, icon: TrendingUp, format: formatEuro },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="border-border/50 p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                </div>
                <AnimatedNumber value={kpi.value} format={kpi.format} className="mt-2 block text-lg font-semibold" />
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Global score */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Indice global</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tabular-nums text-primary">{score.score}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <p className="mt-1 text-sm font-medium">{score.label}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Niveau {level}</span>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={score.score} height="h-2" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

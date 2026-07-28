import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Download, Upload, Award, Target, Calendar, Palette, Check, PiggyBank } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatEuro, exportState, importState } from '@/lib/storage';
import { netWorth, computeLevel, monthLabelLong, totalInvestmentPlan } from '@/lib/calc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Settings() {
  const { state, setState, takeSnapshot } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const level = computeLevel(state);

  const handleExport = () => {
    exportState(state);
    toast.success('Données exportées');
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await importState(file);
      setState(() => imported);
      toast.success('Données importées');
    } catch {
      toast.error('Import impossible');
    }
  };

  const totalAlloc = state.targetAllocation.PEA + state.targetAllocation.CTO + state.targetAllocation.Bitcoin + state.targetAllocation.LivretA + state.targetAllocation.Cash;
  const totalPlan = totalInvestmentPlan(state);

  return (
    <div className="space-y-5">
      {/* Level & achievements */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Niveau</p>
              <p className="text-2xl font-semibold">{level}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Valeur nette</p>
              <p className="text-lg font-semibold">{formatEuro(netWorth(state))}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease }}>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Succès</p>
        <div className="space-y-2">
          {state.achievements.map((a) => (
            <Card key={a.id} className={cn('border-border/50 p-4 transition-colors', a.unlocked && 'border-primary/30 bg-primary/5')}>
              <div className="flex items-center gap-3">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', a.unlocked ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
                  {a.unlocked ? <Check className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', !a.unlocked && 'text-muted-foreground')}>{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Goal settings */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        <Card className="border-border/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Objectif patrimonial</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Montant cible (€)</Label>
              <Input type="number" inputMode="decimal" value={state.goal} onChange={(e) => setState((prev) => ({ ...prev, goal: Number(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Date cible</Label>
              <Input type="date" value={state.targetDate.slice(0, 10)} onChange={(e) => setState((prev) => ({ ...prev, targetDate: new Date(e.target.value).toISOString() }))} className="mt-1" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Investment plan */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12, ease }}>
        <Card className="border-border/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan d'investissement mensuel</p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-primary">{formatEuro(totalPlan)}</span>
          </div>
          <div className="space-y-4">
            {([
              { key: 'PEA', label: 'PEA + CTO (PEA)' },
              { key: 'CTO', label: 'PEA + CTO (CTO)' },
              { key: 'Bitcoin', label: 'Bitcoin' },
              { key: 'LivretA', label: 'Livret A' },
            ] as const).map((item) => (
              <div key={item.key}>
                <Label className="text-xs">{item.label}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={state.investmentPlan[item.key]}
                  onChange={(e) => setState((prev) => ({ ...prev, investmentPlan: { ...prev.investmentPlan, [item.key]: Number(e.target.value) || 0 } }))}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Target allocation */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14, ease }}>
        <Card className="border-border/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Allocation cible</p>
            </div>
            <span className={cn('text-xs font-medium tabular-nums', totalAlloc === 100 ? 'text-primary' : 'text-destructive')}>{totalAlloc}%</span>
          </div>
          <div className="space-y-4">
            {(['PEA', 'CTO', 'Bitcoin', 'LivretA', 'Cash'] as const).map((key) => (
              <div key={key}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-muted-foreground">{key === 'LivretA' ? 'Livret A' : key}</span>
                  <span className="font-medium tabular-nums">{state.targetAllocation[key]}%</span>
                </div>
                <Slider value={[state.targetAllocation[key]]} max={100} step={5} onValueChange={(v) => setState((prev) => ({ ...prev, targetAllocation: { ...prev.targetAllocation, [key]: v[0] } }))} />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Non-financial inclusion toggle */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-3">
              <p className="text-sm font-medium">Inclure les actifs non financiers</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Collection, mobilier, équipements — dans le calcul de la valeur nette et de la progression</p>
            </div>
            <Switch checked={state.includeNonFinancialInNetWorth} onCheckedChange={(checked) => setState((prev) => ({ ...prev, includeNonFinancialInNetWorth: checked }))} />
          </div>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease }}>
        <Card className="border-border/50 p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Thème</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="text-sm font-medium">{state.theme === 'dark' ? 'Sombre' : 'Clair'}</span>
            </div>
            <Switch checked={state.theme === 'light'} onCheckedChange={(checked) => setState((prev) => ({ ...prev, theme: checked ? 'light' : 'dark' }))} />
          </div>
        </Card>
      </motion.div>

      {/* Data */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease }}>
        <Card className="border-border/50 p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Données & sauvegarde</p>
          <div className="space-y-2.5">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={takeSnapshot}>
              <Calendar className="h-4 w-4" /> Créer un snapshot mensuel
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" /> Exporter en JSON
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Importer un JSON
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
          </div>
        </Card>
      </motion.div>

      {/* History */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease }}>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Historique</p>
        <div className="space-y-2">
          {state.snapshots.length === 0 ? (
            <Card className="border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
              Aucun snapshot. Le premier sera créé automatiquement ce mois-ci.
            </Card>
          ) : (
            state.snapshots.slice().reverse().map((s) => (
              <Card key={s.id} className="border-border/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{monthLabelLong(s.date)}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatEuro(s.netWorth)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Financier: {formatEuro(s.financialPatrimoine)}</span>
                  <span>Dettes: {formatEuro(s.debt)}</span>
                  <span>Revenus: {formatEuro(s.income)}</span>
                  <span>Business: {formatEuro(s.business)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2, X, Sofa, Coins } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useStore } from '@/lib/store';
import { formatEuro, generateId, formatPercent } from '@/lib/storage';
import { actualAllocation, allocationColor, monthLabel, totalNonFinancialAssets } from '@/lib/calc';
import { ASSET_CATEGORIES, isFinancialCategory, type Asset, type AssetCategory, type NonFinancialAsset } from '@/lib/types';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ProgressBar } from '@/components/ProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Patrimoine() {
  const { state, setState } = useStore();
  const [editing, setEditing] = useState<Asset | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingNF, setEditingNF] = useState<NonFinancialAsset | null>(null);
  const [addingNF, setAddingNF] = useState(false);

  const allocation = actualAllocation(state);

  const historyData = state.snapshots.length > 0
    ? state.snapshots.map((s) => ({
        label: monthLabel(s.date),
        net: s.netWorth,
        financial: s.financialPatrimoine,
        nonFinancial: s.nonFinancialPatrimoine,
      }))
    : [{ label: 'Maintenant', net: state.assets.reduce((sum, a) => sum + a.value, 0) - state.debts.reduce((s, d) => s + d.amount, 0), financial: state.assets.filter((a) => isFinancialCategory(a.category)).reduce((s, a) => s + a.value, 0), nonFinancial: totalNonFinancialAssets(state) }];

  const totalFinancial = state.assets.filter((a) => isFinancialCategory(a.category)).reduce((sum, a) => sum + a.value, 0);
  const totalNonFinancial = totalNonFinancialAssets(state);

  const removeAsset = (id: string) => {
    setState((prev) => ({ ...prev, assets: prev.assets.filter((a) => a.id !== id) }));
  };

  const saveAsset = (asset: Asset) => {
    setState((prev) => {
      const exists = prev.assets.some((a) => a.id === asset.id);
      return {
        ...prev,
        assets: exists ? prev.assets.map((a) => (a.id === asset.id ? asset : a)) : [...prev.assets, asset],
      };
    });
    setEditing(null);
    setAdding(false);
  };

  const removeNFAsset = (id: string) => {
    setState((prev) => ({ ...prev, nonFinancialAssets: prev.nonFinancialAssets.filter((a) => a.id !== id) }));
  };

  const saveNFAsset = (asset: NonFinancialAsset) => {
    setState((prev) => {
      const exists = prev.nonFinancialAssets.some((a) => a.id === asset.id);
      return {
        ...prev,
        nonFinancialAssets: exists ? prev.nonFinancialAssets.map((a) => (a.id === asset.id ? asset : a)) : [...prev.nonFinancialAssets, asset],
      };
    });
    setEditingNF(null);
    setAddingNF(false);
  };

  return (
    <div className="space-y-5">
      {/* Totals */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Card className="border-border/50 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patrimoine financier</p>
              <AnimatedNumber value={totalFinancial} format={formatEuro} className="mt-1 block text-2xl font-semibold" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Non financier</p>
              <AnimatedNumber value={totalNonFinancial} format={formatEuro} className="mt-1 block text-2xl font-semibold" />
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-secondary/40 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Patrimoine total</span>
              <span className="font-semibold tabular-nums">{formatEuro(totalFinancial + totalNonFinancial)}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Evolution chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05, ease }}>
        <Card className="border-border/50 p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Évolution mensuelle</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(158 64% 52%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(158 64% 52%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(199 70% 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(199 70% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(220 10% 60%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(220 10% 60%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(222 16% 9%)', border: '1px solid hsl(222 14% 16%)', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatEuro(v)} />
                <Area type="monotone" dataKey="net" stroke="hsl(158 64% 52%)" strokeWidth={2.5} fill="url(#netGrad)" name="Valeur nette" />
                <Area type="monotone" dataKey="financial" stroke="hsl(199 70% 60%)" strokeWidth={2} fill="url(#finGrad)" name="Patrimoine financier" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Allocation donut */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        <Card className="border-border/50 p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Allocation (financier)</p>
          <div className="flex items-center gap-4">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58} paddingAngle={3} stroke="none">
                    {allocation.map((e) => <Cell key={e.name} fill={allocationColor(e.name)} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {allocation.map((a) => (
                <div key={a.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: allocationColor(a.name) }} />
                  <span className="flex-1 text-muted-foreground">{a.name}</span>
                  <span className="font-medium tabular-nums">{Math.round(a.percent)}%</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatEuro(a.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Financial assets */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease }}>
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actifs financiers</p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2.5">
          {state.assets.filter((a) => isFinancialCategory(a.category)).map((asset) => (
            <AssetCard key={asset.id} asset={asset} onEdit={() => setEditing(asset)} onDelete={() => removeAsset(asset.id)} />
          ))}
        </div>
      </motion.div>

      {/* Non-financial assets */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease }}>
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Sofa className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actifs non financiers</p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => setAddingNF(true)}>
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2.5">
          {state.nonFinancialAssets.length === 0 ? (
            <Card className="border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
              Aucun actif non financier
            </Card>
          ) : (
            state.nonFinancialAssets.map((asset) => (
              <NonFinancialCard key={asset.id} asset={asset} onEdit={() => setEditingNF(asset)} onDelete={() => removeNFAsset(asset.id)} />
            ))
          )}
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          Ces actifs ne sont pas inclus dans le calcul de la valeur nette sauf option activée dans les Réglages.
        </p>
      </motion.div>

      {(editing || adding) && (
        <AssetEditor asset={editing} onSave={saveAsset} onClose={() => { setEditing(null); setAdding(false); }} />
      )}
      {(editingNF || addingNF) && (
        <NonFinancialEditor asset={editingNF} onSave={saveNFAsset} onClose={() => { setEditingNF(null); setAddingNF(false); }} />
      )}
    </div>
  );
}

function AssetCard({ asset, onEdit, onDelete }: { asset: Asset; onEdit: () => void; onDelete: () => void }) {
  const pct = asset.target === 0 ? 100 : Math.min(100, (asset.value / asset.target) * 100);
  const evol = asset.value - asset.previousValue;
  const evolPct = asset.previousValue === 0 ? 0 : (evol / asset.previousValue) * 100;
  return (
    <Card className="border-border/50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: allocationColor(asset.category === 'Livret A' ? 'LivretA' : asset.category === 'Compte courant' ? 'Cash' : asset.category) }} />
            <p className="font-medium">{asset.name}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{asset.category}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-xl font-semibold tabular-nums">{formatEuro(asset.value)}</span>
        <span className={cn('flex items-center gap-1 text-xs font-medium', evol >= 0 ? 'text-primary' : 'text-destructive')}>
          {evol >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {formatPercent(evolPct)}
        </span>
      </div>
      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Objectif {formatEuro(asset.target)}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <ProgressBar value={pct} height="h-1.5" />
      </div>
    </Card>
  );
}

function NonFinancialCard({ asset, onEdit, onDelete }: { asset: NonFinancialAsset; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="border-border/50 bg-secondary/20 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sofa className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="font-medium">{asset.name}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{asset.category}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-xl font-semibold tabular-nums">{formatEuro(asset.value)}</p>
    </Card>
  );
}

function AssetEditor({ asset, onSave, onClose }: { asset: Asset | null; onSave: (a: Asset) => void; onClose: () => void }) {
  const [name, setName] = useState(asset?.name ?? '');
  const [category, setCategory] = useState<AssetCategory>(asset?.category ?? 'PEA');
  const [value, setValue] = useState(String(asset?.value ?? ''));
  const [target, setTarget] = useState(String(asset?.target ?? ''));

  const submit = () => {
    onSave({
      id: asset?.id ?? generateId(),
      name: name || 'Nouvel actif',
      category,
      value: Number(value) || 0,
      target: Number(target) || 0,
      previousValue: (asset?.previousValue ?? Number(value)) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease }} className="w-full max-w-md rounded-t-3xl border border-border/60 bg-card p-6 pb-8 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{asset ? 'Modifier l\'actif' : 'Nouvel actif'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="PEA - Bourse Direct" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valeur (€)</Label>
              <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Objectif (€)</Label>
              <Input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1" />
            </div>
          </div>
          <Button onClick={submit} className="w-full">Enregistrer</Button>
        </div>
      </motion.div>
    </div>
  );
}

function NonFinancialEditor({ asset, onSave, onClose }: { asset: NonFinancialAsset | null; onSave: (a: NonFinancialAsset) => void; onClose: () => void }) {
  const [name, setName] = useState(asset?.name ?? '');
  const [category, setCategory] = useState(asset?.category ?? '');
  const [value, setValue] = useState(String(asset?.value ?? ''));

  const submit = () => {
    onSave({
      id: asset?.id ?? generateId(),
      name: name || 'Nouvel actif',
      category: category || 'Divers',
      value: Number(value) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease }} className="w-full max-w-md rounded-t-3xl border border-border/60 bg-card p-6 pb-8 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{asset ? 'Modifier l\'actif' : 'Nouvel actif non financier'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection One Piece" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Catégorie</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Collection, Mobilier, Équipement..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Valeur estimée (€)</Label>
            <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={submit} className="w-full">Enregistrer</Button>
        </div>
      </motion.div>
    </div>
  );
}

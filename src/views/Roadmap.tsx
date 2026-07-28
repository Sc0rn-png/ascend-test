import { motion } from 'framer-motion';
import { Check, Circle, Flag } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatEuro } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Roadmap() {
  const { state, setState } = useStore();

  const quarters = Array.from(new Set(state.roadmap.map((g) => g.quarter)));
  const progress = state.roadmap.length === 0 ? 0 : (state.roadmap.filter((g) => g.done).length / state.roadmap.length) * 100;

  const toggle = (id: string) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((g) => (g.id === id ? { ...g, done: !g.done, current: g.done ? g.current : g.target } : g)),
    }));
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Card className="border-border/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Flag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Roadmap patrimoniale</h2>
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% des objectifs atteints</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.9, ease }} />
          </div>
        </Card>
      </motion.div>

      <div className="relative">
        {/* timeline line */}
        <div className="absolute bottom-4 left-[19px] top-4 w-px bg-border" />

        {quarters.map((q, qi) => {
          const goals = state.roadmap.filter((g) => g.quarter === q);
          const allDone = goals.every((g) => g.done);
          return (
            <motion.div
              key={q}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: qi * 0.08, ease }}
              className="relative mb-6 pl-12"
            >
              <div className={cn(
                'absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2',
                allDone ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
              )}>
                {allDone ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{qi + 1}</span>}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{q}</h3>
                  {allDone && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">Complet</span>}
                </div>

                {goals.map((goal) => {
                  const pct = goal.target === 0 ? 100 : Math.min(100, (goal.current / goal.target) * 100);
                  return (
                    <Card key={goal.id} className="border-border/50 p-4">
                      <button onClick={() => toggle(goal.id)} className="flex w-full items-center gap-3 text-left">
                        {goal.done ? (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </div>
                        ) : (
                          <Circle className="h-6 w-6 shrink-0 text-muted-foreground/40" />
                        )}
                        <div className="flex-1">
                          <p className={cn('text-sm font-medium', goal.done && 'text-muted-foreground line-through')}>{goal.label}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatEuro(goal.current)} / {formatEuro(goal.target)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
                      </button>
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className={cn('h-full rounded-full', goal.done ? 'bg-primary' : 'bg-muted-foreground/40')}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

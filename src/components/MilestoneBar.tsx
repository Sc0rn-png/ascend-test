import { useStore } from '@/lib/store';
import { netWorth } from '@/lib/calc';
import { currentMilestone } from '@/lib/milestones';
import { formatEuro } from '@/lib/storage';
import { ProgressBar } from '@/components/ProgressBar';

export function MilestoneBar() {
  const { state } = useStore();
  const net = netWorth(state);
  const milestone = currentMilestone(net, state.lowestNetWorth);
  const reste = Math.max(0, milestone.to - net);

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">
          {milestone.isFinal ? 'Objectif atteint' : `Plus que ${formatEuro(reste)} avant ${formatEuro(milestone.to)}`}
        </span>
        <span className="text-2xl font-semibold tabular-nums text-primary">{Math.round(milestone.percent)}%</span>
      </div>
      <ProgressBar value={milestone.percent} height="h-3" />
    </div>
  );
}

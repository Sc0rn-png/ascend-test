export const MILESTONES = [0, 5000, 10000, 15000, 25000, 50000];

export interface Milestone {
  from: number;
  to: number;
  percent: number;
  isFinal: boolean;
}

// Le point de depart du premier palier est la valeur nette la plus basse jamais
// enregistree, et non celle du premier lancement : si la situation se degrade
// avant de remonter, la barre reste a zero au lieu de partir en negatif.
export function currentMilestone(netWorth: number, lowestNetWorth: number): Milestone {
  const last = MILESTONES[MILESTONES.length - 1];
  if (netWorth >= last) {
    return { from: MILESTONES[MILESTONES.length - 2], to: last, percent: 100, isFinal: true };
  }

  const index = MILESTONES.findIndex((m) => netWorth < m);
  const to = MILESTONES[index];
  const from = index === 0 ? Math.min(lowestNetWorth, netWorth) : MILESTONES[index - 1];

  const span = to - from;
  const percent = span <= 0 ? 0 : Math.max(0, Math.min(100, ((netWorth - from) / span) * 100));

  return { from, to, percent, isFinal: false };
}

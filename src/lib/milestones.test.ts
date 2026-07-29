import { describe, it, expect } from 'vitest';
import { currentMilestone, MILESTONES } from './milestones';

describe('currentMilestone', () => {
  it('vise zero quand la valeur nette est negative', () => {
    const m = currentMilestone(-2160, -5000);
    expect(m.to).toBe(0);
    expect(m.from).toBe(-5000);
  });

  it('mesure la progression sur l intervalle courant, pas depuis zero', () => {
    // Parti de -5000, arrive a -2160 : 2840 parcourus sur 5000.
    expect(currentMilestone(-2160, -5000).percent).toBeCloseTo(56.8, 1);
  });

  it('repart a zero pour cent apres un franchissement', () => {
    expect(currentMilestone(0, -5000).percent).toBe(0);
    expect(currentMilestone(0, -5000).to).toBe(5000);
  });

  it('enchaine les paliers', () => {
    expect(currentMilestone(2500, -5000).to).toBe(5000);
    expect(currentMilestone(2500, -5000).percent).toBeCloseTo(50, 1);
    expect(currentMilestone(7500, -5000).to).toBe(10000);
    expect(currentMilestone(20000, -5000).to).toBe(25000);
  });

  it('signale le dernier palier une fois atteint', () => {
    const m = currentMilestone(60000, -5000);
    expect(m.isFinal).toBe(true);
    expect(m.percent).toBe(100);
    expect(m.to).toBe(50000);
  });

  it('ne divise pas par zero quand le depart egale la cible', () => {
    expect(currentMilestone(0, 0).percent).toBe(0);
    expect(currentMilestone(0, 0).to).toBe(5000);
  });

  it('borne la progression entre zero et cent', () => {
    // Une valeur nette sous le plus bas enregistre ne doit pas produire de negatif.
    expect(currentMilestone(-6000, -5000).percent).toBe(0);
  });

  it('expose des paliers strictement croissants', () => {
    for (let i = 1; i < MILESTONES.length; i += 1) {
      expect(MILESTONES[i]).toBeGreaterThan(MILESTONES[i - 1]);
    }
  });
});

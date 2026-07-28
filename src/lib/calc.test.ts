import { describe, it, expect } from 'vitest';
import { totalDebt } from './calc';
import type { AppState } from './types';

describe('totalDebt', () => {
  it('additionne les dettes', () => {
    const state = {
      debts: [
        { id: 'a', name: 'Conso', amount: 3000, previousAmount: 3000 },
        { id: 'b', name: 'Auto', amount: 2000, previousAmount: 2000 },
      ],
    } as unknown as AppState;
    expect(totalDebt(state)).toBe(5000);
  });
});

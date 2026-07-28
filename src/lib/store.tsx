import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState } from './types';
import { loadState, saveState, currentMonthKey } from './storage';
import { recomputeAchievements, createSnapshot } from './calc';

interface StoreContextValue {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  update: (patch: Partial<AppState>) => void;
  takeSnapshot: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(() => loadState());
  const autoSnapRef = useRef(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [state.theme]);

  // Auto-snapshot once per month on first load
  useEffect(() => {
    if (autoSnapRef.current) return;
    autoSnapRef.current = true;
    const thisMonth = currentMonthKey();
    if (state.lastUpdateMonth !== thisMonth) {
      setStateRaw((prev) => {
        if (prev.lastUpdateMonth === thisMonth) return prev;
        const snap = createSnapshot(prev);
        const filtered = prev.snapshots.filter((s) => s.date !== snap.date);
        return {
          ...prev,
          snapshots: [...filtered, snap].sort((a, b) => a.date.localeCompare(b.date)),
          lastUpdateMonth: thisMonth,
          assets: prev.assets.map((a) => ({ ...a, previousValue: a.value })),
          debts: prev.debts.map((d) => ({ ...d, previousAmount: d.amount })),
        };
      });
    }
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const setState = (updater: (prev: AppState) => AppState) => {
      setStateRaw((prev) => {
        const next = updater(prev);
        return { ...next, achievements: recomputeAchievements(next) };
      });
    };
    const update = (patch: Partial<AppState>) => setState((prev) => ({ ...prev, ...patch }));
    const takeSnapshot = () => {
      setStateRaw((prev) => {
        const snap = createSnapshot(prev);
        const filtered = prev.snapshots.filter((s) => s.date !== snap.date);
        return {
          ...prev,
          snapshots: [...filtered, snap].sort((a, b) => a.date.localeCompare(b.date)),
          lastUpdateMonth: currentMonthKey(),
        };
      });
    };
    return { state, setState, update, takeSnapshot };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

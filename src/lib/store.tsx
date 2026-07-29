import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState } from './types';
import { loadState, saveState } from './storage';
import { currentMonthKey } from './movements';
import { addMovement as add, deleteMovement as remove, setDebtTotal as setDebt, takeMonthlySnapshot, type MovementDraft } from './actions';

interface StoreContextValue {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  update: (patch: Partial<AppState>) => void;
  addMovement: (draft: MovementDraft) => void;
  deleteMovement: (id: string) => void;
  setDebtTotal: (amount: number) => void;
  justClosedMonth: string | null;
  dismissReport: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [justClosedMonth, setJustClosedMonth] = useState<string | null>(null);
  const rolloverDone = useRef(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [state.theme]);

  // Au premier lancement d'un nouveau mois, on cloture le mois precedent et on
  // signale le bilan a afficher. Le garde-fou empeche le double declenchement
  // du mode strict de React en developpement.
  useEffect(() => {
    if (rolloverDone.current) return;
    rolloverDone.current = true;

    const thisMonth = currentMonthKey();
    if (state.lastUpdateMonth === thisMonth) return;

    const closing = state.lastUpdateMonth;
    setState((prev) => takeMonthlySnapshot(prev, prev.lastUpdateMonth ?? thisMonth));
    setState((prev) => ({ ...prev, lastUpdateMonth: thisMonth }));
    if (closing) setJustClosedMonth(closing);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      setState,
      update: (patch) => setState((prev) => ({ ...prev, ...patch })),
      addMovement: (draft) => setState((prev) => add(prev, draft)),
      deleteMovement: (id) => setState((prev) => remove(prev, id)),
      setDebtTotal: (amount) => setState((prev) => setDebt(prev, amount)),
      justClosedMonth,
      dismissReport: () => setJustClosedMonth(null),
    }),
    [state, justClosedMonth]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore doit etre utilise dans un StoreProvider');
  return ctx;
}

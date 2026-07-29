import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StoreProvider, useStore } from '@/lib/store';
import { BottomNav, type TabId } from '@/components/BottomNav';
import { AddButton } from '@/components/AddButton';
import { AddMovementSheet } from '@/components/AddMovementSheet';
import { Dashboard } from '@/views/Dashboard';
import { Mois } from '@/views/Mois';
import { Patrimoine } from '@/views/Patrimoine';
import { Settings } from '@/views/Settings';
import { netWorth } from '@/lib/calc';
import { formatEuro } from '@/lib/storage';

const TAB_TITLES: Record<TabId, string> = {
  dashboard: 'Dashboard',
  mois: 'Mois',
  patrimoine: 'Patrimoine',
  settings: 'Réglages',
};

function Header({ tab }: { tab: TabId }) {
  const { state } = useStore();
  const net = netWorth(state);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">{TAB_TITLES[tab]}</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">ASCEND</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Valeur nette</p>
          <p className="text-sm font-semibold tabular-nums">{formatEuro(net)}</p>
        </div>
      </div>
    </header>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [adding, setAdding] = useState(false);

  return (
    <div className="min-h-full bg-background">
      <Header tab={tab} />
      <main className="mx-auto max-w-md px-5 pb-32 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'mois' && <Mois />}
            {tab === 'patrimoine' && <Patrimoine />}
            {tab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AddButton onClick={() => setAdding(true)} />
      {adding && <AddMovementSheet onClose={() => setAdding(false)} />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

export default App;

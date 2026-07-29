import { Plus } from 'lucide-react';

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Ajouter un mouvement"
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl transition-transform active:scale-95"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}

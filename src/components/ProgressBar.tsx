import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string;
  height?: string;
}

export function ProgressBar({ value, className, color, height = 'h-2' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-secondary', height, className)}>
      <motion.div
        className={cn('h-full rounded-full', color ?? 'bg-primary')}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

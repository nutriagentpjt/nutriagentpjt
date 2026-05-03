import { cn } from '@/components/ui/utils';

export interface ProgressBarProps {
  className?: string;
  color?: string;
  label?: string;
  max?: number;
  value: number;
}

export function ProgressBar({ className, color, label, max = 100, value }: ProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const percentage = Math.max(0, Math.min(100, (value / safeMax) * 100));

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      {label ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{label}</span>
          <span className="text-muted-foreground">
            {value} / {safeMax}
          </span>
        </div>
      ) : null}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ backgroundColor: color, width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

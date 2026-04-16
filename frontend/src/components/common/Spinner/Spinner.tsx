import { Loader2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';

export interface SpinnerProps {
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
} as const;

export function Spinner({ className, color, size = 'md' }: SpinnerProps) {
  return <Loader2 className={cn('animate-spin', sizeMap[size], className)} style={color ? { color } : undefined} />;
}

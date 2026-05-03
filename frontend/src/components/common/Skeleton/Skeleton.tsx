import type { ComponentPropsWithoutRef } from 'react';
import { Skeleton as UISkeleton } from '@/components/ui/skeleton';
import { cn } from '@/components/ui/utils';

export interface SkeletonProps extends ComponentPropsWithoutRef<typeof UISkeleton> {
  height?: number | string;
  variant?: 'default' | 'rounded' | 'circular';
  width?: number | string;
}

export function Skeleton({ className, height, style, variant = 'default', width, ...props }: SkeletonProps) {
  return (
    <UISkeleton
      className={cn(
        variant === 'rounded' ? 'rounded-xl' : '',
        variant === 'circular' ? 'rounded-full' : '',
        className,
      )}
      style={{ ...style, height, width }}
      {...props}
    />
  );
}

import type { ComponentPropsWithoutRef } from 'react';
import { Badge as UIBadge } from '@/components/ui/badge';

const variantMap = {
  success: 'secondary',
  warning: 'outline',
  info: 'default',
} as const;

export interface BadgeProps extends Omit<ComponentPropsWithoutRef<typeof UIBadge>, 'variant'> {
  variant?: keyof typeof variantMap;
}

export function Badge({ variant = 'info', ...props }: BadgeProps) {
  return <UIBadge variant={variantMap[variant]} {...props} />;
}

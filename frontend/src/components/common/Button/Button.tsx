import { Loader2 } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { Button as UIButton } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  danger: 'destructive',
} as const;

const sizeMap = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
} as const;

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<typeof UIButton>, 'variant' | 'size'> {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  loading?: boolean;
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  size = 'md',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <UIButton
      className={cn('relative', className)}
      disabled={disabled || loading}
      size={sizeMap[size]}
      variant={variantMap[variant]}
      {...props}
    >
      {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
      {children}
    </UIButton>
  );
}

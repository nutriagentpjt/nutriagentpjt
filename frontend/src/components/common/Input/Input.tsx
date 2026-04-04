import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Input as UIInput } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';

export interface InputProps extends Omit<ComponentPropsWithoutRef<typeof UIInput>, 'size'> {
  error?: string;
  hint?: ReactNode;
  label?: ReactNode;
}

export function Input({ className, error, hint, id, label, ...props }: InputProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label className="text-sm font-medium text-foreground" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <UIInput
        aria-invalid={error ? true : undefined}
        className={cn(error ? 'border-destructive focus-visible:ring-destructive/20' : '', className)}
        id={id}
        {...props}
      />
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

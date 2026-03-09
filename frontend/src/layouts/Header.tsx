import type { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  description?: string;
  rightSlot?: ReactNode;
}

export function Header({ title, description, rightSlot }: HeaderProps) {
  if (!title) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/85 px-5 py-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        </div>
        {rightSlot}
      </div>
    </header>
  );
}

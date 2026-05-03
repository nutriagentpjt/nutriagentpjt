import type { ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export interface BottomSheetProps {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: (open: boolean) => void;
  title?: string;
}

export function BottomSheet({ children, description, footer, isOpen, onClose, title }: BottomSheetProps) {
  return (
    <Drawer direction="bottom" onOpenChange={onClose} open={isOpen}>
      <DrawerContent>
        {title || description ? (
          <DrawerHeader>
            {title ? <DrawerTitle>{title}</DrawerTitle> : null}
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>
        ) : null}
        <div className="px-4 pb-4">{children}</div>
        {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
      </DrawerContent>
    </Drawer>
  );
}

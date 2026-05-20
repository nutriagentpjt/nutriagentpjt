import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/components/ui/utils';

interface OverlayScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  containerClassName?: string;
  thumbInsetTop?: number;
  thumbInsetBottom?: number;
}

const MIN_THUMB_HEIGHT = 28;
const DEFAULT_THUMB_INSET_TOP = 4;
const DEFAULT_THUMB_INSET_BOTTOM = 4;

export const OverlayScrollArea = forwardRef<HTMLDivElement, OverlayScrollAreaProps>(
  (
    {
      children,
      className,
      containerClassName,
      thumbInsetTop = DEFAULT_THUMB_INSET_TOP,
      thumbInsetBottom = DEFAULT_THUMB_INSET_BOTTOM,
      ...props
    },
    forwardedRef,
  ) => {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);
    const hideTimeoutRef = useRef<number | null>(null);
    const pointerInsideRef = useRef(false);
    const focusInsideRef = useRef(false);
    const [thumbState, setThumbState] = useState({
      visible: false,
      offset: 0,
      height: 0,
      enabled: false,
    });

    useImperativeHandle(forwardedRef, () => viewportRef.current as HTMLDivElement, []);

    const clearHideTimeout = useCallback(() => {
      if (hideTimeoutRef.current != null) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }, []);

    const scheduleHide = useCallback(() => {
      clearHideTimeout();
      hideTimeoutRef.current = window.setTimeout(() => {
        if (pointerInsideRef.current || focusInsideRef.current) {
          return;
        }

        setThumbState((current) => ({ ...current, visible: false }));
      }, 700);
    }, [clearHideTimeout]);

    const recalculateThumb = useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const { clientHeight, scrollHeight, scrollTop } = viewport;
      const canScroll = scrollHeight > clientHeight + 1;

      if (!canScroll) {
        setThumbState((current) => ({
          ...current,
          enabled: false,
          visible: false,
          height: 0,
          offset: 0,
        }));
        return;
      }

      const trackHeight = Math.max(clientHeight - thumbInsetTop - thumbInsetBottom, 0);
      const nextHeight = Math.min(
        trackHeight,
        Math.max(MIN_THUMB_HEIGHT, (clientHeight / scrollHeight) * trackHeight),
      );
      const maxOffset = Math.max(trackHeight - nextHeight, 0);
      const nextOffset =
        scrollHeight === clientHeight
          ? 0
          : (scrollTop / (scrollHeight - clientHeight)) * maxOffset;

      setThumbState((current) => ({
        ...current,
        enabled: true,
        height: nextHeight,
        offset: nextOffset + thumbInsetTop,
      }));
    }, [thumbInsetBottom, thumbInsetTop]);

    const showThumb = useCallback(() => {
      const viewport = viewportRef.current;
      const canScroll = viewport ? viewport.scrollHeight > viewport.clientHeight + 1 : false;
      recalculateThumb();
      if (canScroll) {
        setThumbState((current) => ({ ...current, visible: true }));
        scheduleHide();
      }
    }, [recalculateThumb, scheduleHide]);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const handleScroll = () => {
        showThumb();
      };

      const handlePointerEnter = () => {
        pointerInsideRef.current = true;
        showThumb();
      };

      const handlePointerLeave = () => {
        pointerInsideRef.current = false;
        scheduleHide();
      };

      const handleFocusIn = () => {
        focusInsideRef.current = true;
        showThumb();
      };

      const handleFocusOut = () => {
        focusInsideRef.current = false;
        scheduleHide();
      };

      const attachResizeObservers = () => {
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = new ResizeObserver(() => {
          recalculateThumb();
        });

        resizeObserverRef.current.observe(viewport);
        Array.from(viewport.children).forEach((child) => {
          if (child instanceof HTMLElement) {
            resizeObserverRef.current?.observe(child);
          }
        });
      };

      attachResizeObservers();

      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = new MutationObserver(() => {
        attachResizeObservers();
        recalculateThumb();
      });
      mutationObserverRef.current.observe(viewport, { childList: true, subtree: true });

      viewport.addEventListener('scroll', handleScroll, { passive: true });
      viewport.addEventListener('mouseenter', handlePointerEnter);
      viewport.addEventListener('mouseleave', handlePointerLeave);
      viewport.addEventListener('pointerdown', showThumb, { passive: true });
      viewport.addEventListener('touchstart', showThumb, { passive: true });
      viewport.addEventListener('focusin', handleFocusIn);
      viewport.addEventListener('focusout', handleFocusOut);
      window.addEventListener('resize', recalculateThumb);

      recalculateThumb();

      return () => {
        viewport.removeEventListener('scroll', handleScroll);
        viewport.removeEventListener('mouseenter', handlePointerEnter);
        viewport.removeEventListener('mouseleave', handlePointerLeave);
        viewport.removeEventListener('pointerdown', showThumb);
        viewport.removeEventListener('touchstart', showThumb);
        viewport.removeEventListener('focusin', handleFocusIn);
        viewport.removeEventListener('focusout', handleFocusOut);
        window.removeEventListener('resize', recalculateThumb);
        resizeObserverRef.current?.disconnect();
        mutationObserverRef.current?.disconnect();
        clearHideTimeout();
      };
    }, [clearHideTimeout, recalculateThumb, scheduleHide, showThumb]);

    const thumbStyle = useMemo(
      () => ({
        height: `${thumbState.height}px`,
        transform: `translateY(${thumbState.offset}px)`,
      }),
      [thumbState.height, thumbState.offset],
    );

    return (
      <div className={cn('relative min-h-0', containerClassName)}>
        <div
          ref={viewportRef}
          className={cn('app-scrollbar h-full min-h-0 overflow-y-auto', className)}
          {...props}
        >
          {children}
        </div>

        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute right-1 z-10 w-1.5 rounded-full transition-opacity duration-200',
            thumbState.visible && thumbState.enabled ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            top: `${thumbInsetTop}px`,
            bottom: `${thumbInsetBottom}px`,
          }}
        >
          <div
            className="w-full rounded-full bg-gray-400/80 shadow-[0_0_0_1px_rgba(255,255,255,0.45)] backdrop-blur-sm"
            style={thumbStyle}
          />
        </div>
      </div>
    );
  },
);

OverlayScrollArea.displayName = 'OverlayScrollArea';

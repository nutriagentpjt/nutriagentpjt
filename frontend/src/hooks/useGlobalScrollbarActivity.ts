import { useEffect, useRef } from 'react';

const SCROLLBAR_ACTIVITY_DATASET_KEY = 'scrollbarActive';

export function useGlobalScrollbarActivity() {
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const setActive = () => {
      document.body.dataset[SCROLLBAR_ACTIVITY_DATASET_KEY] = 'true';

      if (hideTimeoutRef.current != null) {
        window.clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = window.setTimeout(() => {
        delete document.body.dataset[SCROLLBAR_ACTIVITY_DATASET_KEY];
      }, 900);
    };

    const listenerOptions: AddEventListenerOptions = { capture: true, passive: true };

    document.addEventListener('scroll', setActive, listenerOptions);
    document.addEventListener('wheel', setActive, listenerOptions);
    document.addEventListener('touchmove', setActive, listenerOptions);
    document.addEventListener('pointerdown', setActive, listenerOptions);

    return () => {
      document.removeEventListener('scroll', setActive, listenerOptions);
      document.removeEventListener('wheel', setActive, listenerOptions);
      document.removeEventListener('touchmove', setActive, listenerOptions);
      document.removeEventListener('pointerdown', setActive, listenerOptions);

      if (hideTimeoutRef.current != null) {
        window.clearTimeout(hideTimeoutRef.current);
      }

      delete document.body.dataset[SCROLLBAR_ACTIVITY_DATASET_KEY];
    };
  }, []);
}

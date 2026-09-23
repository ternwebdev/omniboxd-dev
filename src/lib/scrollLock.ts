import { useEffect } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';

export function lockScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }
  lockCount++;
}

export function unlockScroll() {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow || '';
    document.documentElement.style.overflow = originalHtmlOverflow || '';
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }
}

/**
 * Hook to lock body and html scrolling while a modal or dialog is open.
 * Safely handles stacked modals via reference counting.
 */
export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isOpen]);
}

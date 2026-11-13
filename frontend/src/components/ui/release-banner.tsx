'use client';

import { useCallback, useState, useSyncExternalStore, type ReactNode } from 'react';
import { X } from "@/components/icons";

const changeEvent = 'release-banner-dismissed';
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

const serverSnapshot = () => false;

/** Adapted from the supplied banner. It stays in the page flow and needs no global offset or script. */
export function Banner({
  id, children, dismissLabel = 'Dismiss announcement', variant = 'rainbow',
}: {
  id: string;
  children: ReactNode;
  dismissLabel?: string;
  variant?: 'normal' | 'rainbow';
}) {
  const key = `release-banner:${id}`;
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const readDismissal = useCallback(() => {
    try { return localStorage.getItem(key) === 'true'; }
    catch { return false; }
  }, [key]);
  const saved = useSyncExternalStore(subscribe, readDismissal, serverSnapshot);

  if (saved || dismissedId === id) return null;

  return (
    <aside className={`mb-4 grid min-h-12 grid-cols-[minmax(0,1fr)_44px] items-center gap-2 rounded-2xl border border-orange-400/25 bg-black/65 px-3 py-1 text-sm leading-6 text-white sm:px-4 ${variant === 'rainbow' ? 'bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent' : ''}`}>
      <div className="min-w-0 break-words py-1">{children}</div>
      <button type="button" aria-label={dismissLabel} onClick={() => {
        setDismissedId(id);
        try {
          localStorage.setItem(key, 'true');
          window.dispatchEvent(new Event(changeEvent));
        } catch { /* Still dismiss for this visit when storage is unavailable. */ }
      }} className="grid size-11 place-items-center rounded-lg text-orange-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-300">
        <X aria-hidden="true" className="size-4" />
      </button>
    </aside>
  );
}

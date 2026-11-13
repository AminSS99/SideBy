'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { ChevronDown, GitBranch, Pin } from "@/components/icons";

export type ChangelogCategory = 'new' | 'improved' | 'fixed';

export interface ChangelogEntry {
  id: string;
  date?: string;
  category: ChangelogCategory;
  title: string;
  summary: string;
  version: string;
  bullets: readonly string[];
}

const copy = {
  en: {
    title: 'Release history',
    hint: 'Select an update to keep it open. Select it again to close.',
    empty: 'No verified release notes have been published yet.',
    undated: 'Release highlights',
    categories: { new: 'New', improved: 'Improved', fixed: 'Fixed' },
  },
  az: {
    title: 'Buraxılış tarixçəsi',
    hint: 'Yeniliyi açıq saxlamaq üçün seçin. Bağlamaq üçün yenidən seçin.',
    empty: 'Hələ yenilik yoxdur.',
    undated: 'Buraxılışın əsas yenilikləri',
    categories: { new: 'Yeni', improved: 'Təkmilləşdirmə', fixed: 'Düzəliş' },
  },
} as const;

const categoryStyle: Record<ChangelogCategory, string> = {
  new: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  improved: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  fixed: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
};

/** Adapted from the supplied changelog timeline for a full-page release archive. */
export function ChangelogTimeline({ entries, locale = 'en', emptyMessage }: {
  entries: readonly ChangelogEntry[];
  locale?: keyof typeof copy;
  emptyMessage?: string;
}) {
  const id = useId();
  const [pinned, setPinned] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const labels = copy[locale];
  const sorted = [...entries].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const active = pinned ?? preview;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      setPinned(null);
      setPreview(null);
      return;
    }
    const next = {
      ArrowDown: Math.min(index + 1, sorted.length - 1),
      ArrowUp: Math.max(index - 1, 0),
      Home: 0,
      End: sorted.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setPreview(null);
    document.getElementById(`${id}-trigger-${next}`)?.focus();
  }

  return (
    <section aria-labelledby={`${id}-title`} className="max-w-4xl rounded-3xl border border-white/10 bg-black/35 p-3 sm:p-6">
      <header className="mb-4 flex items-start gap-3 px-1 sm:mb-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
          <GitBranch aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 id={`${id}-title`} className="text-lg font-bold text-white sm:text-xl">{labels.title}</h2>
          {sorted.length > 0 && <p className="mt-1 text-sm leading-5 text-white/65">{labels.hint}</p>}
        </div>
      </header>
      {sorted.length === 0 ? <p className="px-1 py-4 text-sm text-white/65">{emptyMessage ?? labels.empty}</p> : (
        <ol onPointerLeave={() => setPreview(null)} className="space-y-1">
          {sorted.map((entry, index) => {
            const month = entry.date?.slice(0, 7) ?? '';
            const date = new Date(`${entry.date}T00:00:00Z`);
            const showMonth = index === 0 || (sorted[index - 1].date?.slice(0, 7) ?? '') !== month;
            const open = active === entry.id;
            const isPinned = pinned === entry.id;
            const trigger = `${id}-trigger-${index}`;
            const panel = `${id}-panel-${index}`;
            return (
              <li key={entry.id} onPointerMove={(event) => {
                if (event.pointerType === 'mouse' && (event.movementX !== 0 || event.movementY !== 0) && !pinned) setPreview(entry.id);
              }}>
                {showMonth && <p className="pb-2 pl-8 pt-3 font-mono text-xs uppercase tracking-wider text-white/65">
                  {Number.isNaN(date.getTime()) ? month || labels.undated : monthFormat.format(date)}
                </p>}
                <div className={`relative rounded-xl border ${open ? 'border-orange-400/25 bg-orange-500/[0.07]' : 'border-transparent'}`}>
                  <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-[15px] w-px ${open ? 'bg-orange-400/65' : 'bg-white/15'} motion-safe:transition-colors`} />
                  <h3>
                    <button
                      type="button"
                      id={trigger}
                      aria-expanded={open}
                      aria-controls={panel}
                      onKeyDown={(event) => onKeyDown(event, index)}
                      onClick={() => {
                        setPreview(null);
                        setPinned(isPinned ? null : entry.id);
                      }}
                      className="relative grid min-h-12 w-full grid-cols-[20px_minmax(0,1fr)_16px] items-center gap-2 rounded-xl px-[5px] py-2 pr-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-300 sm:gap-3 sm:pr-3"
                    >
                      <span aria-hidden="true" className={`mx-auto size-2 rounded-full ring-4 ring-[#151217] ${open ? 'bg-orange-300' : 'bg-white/40'} motion-safe:transition-colors`} />
                      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
                        <span className="flex shrink-0 items-center gap-2">
                          {entry.date && <time dateTime={entry.date} className="font-mono text-xs text-white/65">{entry.date}</time>}
                          <span className={`rounded border px-1.5 py-0.5 text-xs ${categoryStyle[entry.category]}`}>{labels.categories[entry.category]}</span>
                        </span>
                        <span className="basis-full break-words text-sm font-semibold leading-5 text-white sm:basis-auto sm:text-base">{entry.title}</span>
                      </span>
                      {isPinned ? <Pin aria-hidden="true" className="size-4 text-orange-200" /> : (
                        <ChevronDown aria-hidden="true" className={`size-4 text-white/65 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </h3>
                  <div id={panel} role="region" aria-labelledby={trigger} hidden={!open} className="relative ml-8 mr-3 pb-4 pt-1 sm:ml-10 sm:mr-5">
                    <p className="break-words font-mono text-xs text-orange-200">{entry.version}</p>
                    <p className="mt-2 text-sm leading-6 text-white/80">{entry.summary}</p>
                    {entry.bullets.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-white/75">
                      {entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

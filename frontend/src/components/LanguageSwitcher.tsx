import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "@/components/icons";
import { LANGS, useI18n, type Lang } from "@/i18n";
import { captureEvent } from "@/lib/posthog";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  /** "menu" renders a popover button; "list" renders inline buttons (mobile drawer, settings). */
  variant?: "menu" | "list";
  align?: "left" | "right";
}

export const LanguageSwitcher = ({ className, variant = "menu", align = "right" }: LanguageSwitcherProps) => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Lang) => {
    if (next !== lang) captureEvent("language_changed", { from: lang, to: next });
    setLang(next);
    setOpen(false);
  };

  if (variant === "list") {
    return (
      <div className={cn("grid grid-cols-3 gap-2", className)} role="radiogroup" aria-label={t("lang.label")}>
        {LANGS.map((item) => (
          <button
            key={item.code}
            type="button"
            role="radio"
            aria-checked={lang === item.code}
            onClick={() => choose(item.code)}
            className={cn(
              "min-h-11 rounded-lg border px-3 text-sm font-semibold transition-colors",
              lang === item.code
                ? "border-orange-400/60 bg-orange-500/15 text-orange-200"
                : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]",
            )}
          >
            {item.short}
            <span className="ml-1.5 hidden text-xs font-normal opacity-70 min-[420px]:inline">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.label")}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/[0.11] bg-white/[0.055] px-3 text-xs font-semibold tracking-wide text-white transition hover:bg-white/[0.085] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <Globe className="h-4 w-4" />
        {LANGS.find((item) => item.code === lang)?.short}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("lang.label")}
          className={cn(
            "absolute top-full z-[60] mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-[#0c0b0a] p-1 shadow-2xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {LANGS.map((item) => (
            <li key={item.code} role="option" aria-selected={lang === item.code}>
              <button
                type="button"
                onClick={() => choose(item.code)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm text-white/85 hover:bg-white/[0.08]"
              >
                <span>
                  <span className="mr-2 text-xs font-bold text-white/50">{item.short}</span>
                  {item.label}
                </span>
                {lang === item.code && <Check className="h-4 w-4 text-orange-300" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;

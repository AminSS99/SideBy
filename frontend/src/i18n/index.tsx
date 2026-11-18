import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type MessageKey } from "./locales/en";
import { az } from "./locales/az";
import { ru } from "./locales/ru";

export type Lang = "en" | "az" | "ru";
export const LANGS: readonly { code: Lang; label: string; short: string; htmlLang: string }[] = [
  { code: "en", label: "English", short: "EN", htmlLang: "en" },
  { code: "az", label: "Azərbaycanca", short: "AZ", htmlLang: "az" },
  { code: "ru", label: "Русский", short: "RU", htmlLang: "ru" },
] as const;

const STORAGE_KEY = "sideby.lang";
const dictionaries: Record<Lang, Partial<Record<MessageKey, string>>> = { en, az, ru };

export const isLang = (value: unknown): value is Lang => value === "en" || value === "az" || value === "ru";

const readStored = (): Lang | null => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLang(value) ? value : null;
  } catch {
    return null;
  }
};

/** Pick the first supported language from the browser's preference list. */
export const detectLang = (): Lang => {
  if (typeof window === "undefined") return "en";
  try {
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    if (isLang(fromQuery)) return fromQuery;
  } catch {
    /* ignore malformed URLs */
  }
  const stored = readStored();
  if (stored) return stored;
  const preferred = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (base === "az") return "az";
    if (base === "ru") return "ru";
    if (base === "en") return "en";
  }
  return "en";
};

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
  /** BCP-47 tag for Intl formatting. */
  locale: string;
}

const intlLocale: Record<Lang, string> = { en: "en-US", az: "az-AZ", ru: "ru-RU" };

const translate = (lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string => {
  const template = dictionaries[lang][key] ?? en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
};

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => undefined,
  t: (key, vars) => translate("en", key, vars),
  locale: intlLocale.en,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    document.documentElement.lang = LANGS.find((item) => item.code === lang)?.htmlLang ?? "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: language still applies for this session */
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      locale: intlLocale[lang],
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;

/** Non-React access (toasts fired from utilities). */
export const tStatic: TFunction = (key, vars) => translate(detectLang(), key, vars);
export type { MessageKey };

const STATUS_KEYS: Record<string, MessageKey> = {
  completed: "status.completed",
  running: "status.running",
  queued: "status.queued",
  pending: "status.pending",
  failed: "status.failed",
  active: "status.active",
  error: "status.error",
  draft: "status.draft",
  cancelled: "status.cancelled",
  canceled: "status.cancelled",
  uploading: "status.uploading",
  indexing: "status.indexing",
  indexed: "status.indexed",
  unsupported: "status.unsupported",
  sensitive: "status.sensitive",
  invited: "status.invited",
  fulfilled: "status.fulfilled",
};

/** Translate a server status string; unknown values pass through unchanged. */
export const statusLabel = (t: TFunction, status: string): string => {
  const key = STATUS_KEYS[status];
  return key ? t(key) : status;
};

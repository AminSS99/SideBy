import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useI18n } from "@/i18n";
import type { ComparisonData } from "@/components/Comparison/types";

type Status = "idle" | "loading" | "done" | "error" | "limit";

const PREF_KEY = "sideby.translate.results";

const readPref = (): boolean => {
  try {
    return window.localStorage.getItem(PREF_KEY) === "1";
  } catch {
    return false;
  }
};
const writePref = (on: boolean) => {
  try {
    if (on) window.localStorage.setItem(PREF_KEY, "1");
    else window.localStorage.removeItem(PREF_KEY);
  } catch {
    /* preference is a convenience only */
  }
};

/**
 * Optional AI translation of a finished comparison into the UI language.
 * Research stays English; this only swaps prose fields. Once a viewer opts in,
 * later comparisons translate automatically until they switch back.
 */
export function useResultTranslation(comparisonId: string | undefined, original: ComparisonData | null | undefined) {
  const { lang } = useI18n();
  const supported = lang === "az" || lang === "ru";
  const [wanted, setWanted] = useState<boolean>(readPref);
  const [status, setStatus] = useState<Status>("idle");
  const [attempt, setAttempt] = useState(0);
  const cache = useRef(new Map<string, ComparisonData>());
  const [translated, setTranslated] = useState<ComparisonData | null>(null);

  const cacheKey = useMemo(
    () => (comparisonId && original ? `${comparisonId}:${lang}:${original.updatedAt}:${original.verdict.summary.length}` : null),
    [comparisonId, lang, original],
  );

  useEffect(() => {
    if (!supported || !wanted || !comparisonId || !original || !cacheKey) {
      setTranslated(null);
      setStatus("idle");
      return;
    }
    const hit = cache.current.get(cacheKey);
    if (hit) {
      setTranslated(hit);
      setStatus("done");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    void (async () => {
      try {
        const response = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/translate`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang }),
          signal: controller.signal,
        });
        const data = (await response.json()) as { result?: ComparisonData; translated?: boolean };
        if (!response.ok || !data.result) throw new ApiError("translate failed", response.status);
        cache.current.set(cacheKey, data.result);
        setTranslated(data.result);
        setStatus("done");
      } catch (error) {
        if (controller.signal.aborted) return;
        setTranslated(null);
        setStatus(error instanceof ApiError && error.status === 429 ? "limit" : "error");
      }
    })();
    return () => controller.abort();
  }, [supported, wanted, comparisonId, original, cacheKey, lang, attempt]);

  const enable = useCallback(() => {
    writePref(true);
    setWanted(true);
    setAttempt((value) => value + 1);
  }, []);
  const disable = useCallback(() => {
    writePref(false);
    setWanted(false);
  }, []);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    supported,
    lang,
    status,
    wanted,
    enable,
    disable,
    retry,
    displayed: supported && wanted && status === "done" && translated ? translated : original ?? null,
    isTranslated: supported && wanted && status === "done" && translated !== null,
  };
}

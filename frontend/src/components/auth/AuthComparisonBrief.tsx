import { ArrowLeftRight } from "@/components/icons";
import { useT } from "@/i18n";

/** Reassure first-time visitors that sign-in preserves their decision brief. */
export function AuthComparisonBrief({ destination }: { destination: string }) {
  const t = useT();
  const url = new URL(destination, "https://sideby.invalid");
  const query = url.pathname === "/app/comparisons" ? url.searchParams.get("q")?.trim() : null;
  if (!query) return null;
  return (
    <section aria-label={t("auth.brief.aria")} className="rounded-2xl border border-orange-300/20 bg-orange-400/[0.06] p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-orange-200">
        <ArrowLeftRight className="h-4 w-4" aria-hidden="true" /> {t("auth.brief.continue")}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-white/90">{query.slice(0, 200)}{query.length > 200 ? "…" : ""}</p>
      <p className="mt-1 text-xs leading-5 text-white/65">{t("auth.brief.note")}</p>
    </section>
  );
}

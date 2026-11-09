import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Compass,
  ExternalLink,
  FileSearch,
  Globe,
  Loader2,
  Microscope,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { GlowCard } from "@/components/GlowCard";
import { buildApiUrl } from "@/config/env";
import { ApiError, apiFetch, describeApiFailure } from "@/lib/api";
import { safeHref } from "@/lib/safe-url";

interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchOutcome {
  query: string;
  results: WebResult[];
  usage: { limit: number | null; remaining: number | null };
}

const STARTER_QUERIES = [
  "Neon vs Supabase pricing 2026",
  "Cursor vs Windsurf enterprise security",
  "Vercel vs Cloudflare Workers cold start",
  "Linear vs Jira API rate limits",
];

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const ResearchPage = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".res-header, .res-input, .res-body", {
        y: 14,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform",
      });
    });
    return () => mm.revert();
  }, { scope: containerRef });

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    try {
      const response = await apiFetch(
        buildApiUrl("/api/web-search"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        },
        { retries: 0 },
      );
      const data = (await response.json()) as SearchOutcome;
      setOutcome(data);
      setRemaining(data.usage.remaining);
      setLimitReached(data.usage.remaining === 0);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setLimitReached(true);
        setRemaining(0);
      } else {
        toast.error(describeApiFailure(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const effectiveRemaining = limitReached ? 0 : remaining ?? 2;

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="res-header flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-300">
            <Sparkles className="h-3.5 w-3.5" /> Live web search
          </p>
          <h1 className="mt-2.5 font-serif text-3xl tracking-tight text-[#fdfbf7] sm:text-4xl">
            Research Canvas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#fdfbf7]/75">
            Search the live web for sources before you compare. Free accounts get 2 searches a day.
          </p>
        </div>

        {/* Visual daily allowance counter */}
        <div
          aria-live="polite"
          className={`inline-flex w-fit items-center gap-3 rounded-2xl border px-4 py-2.5 text-xs ${
            limitReached
              ? "border-amber-400/30 bg-amber-500/[0.08] text-amber-200"
              : "border-white/[0.1] bg-white/[0.035] text-[#fdfbf7]/85"
          }`}
        >
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 1].map((slot) => {
              const filled = slot < effectiveRemaining;
              return (
                <span
                  key={slot}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    filled
                      ? "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,.6)]"
                      : "border border-white/25 bg-transparent"
                  }`}
                />
              );
            })}
          </span>
          <span className="font-medium">
            {limitReached
              ? "You've used today's free searches · resets at midnight UTC"
              : remaining !== null
                ? `${remaining} free ${remaining === 1 ? "search" : "searches"} left today`
                : "2 free searches per day"}
          </span>
        </div>
      </div>

      <div className="res-input relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#100e0c] p-4 shadow-[0_24px_70px_rgba(0,0,0,.45)] sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-500/[0.08] blur-3xl"
        />
        <form onSubmit={runSearch} className="relative z-10 mx-auto max-w-4xl">
          <div className="group flex w-full flex-col items-stretch gap-2 rounded-xl border border-white/[0.12] bg-[#090807] p-2 transition-all focus-within:border-orange-400/50 focus-within:ring-2 focus-within:ring-orange-400/25 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center">
              <Microscope className="ml-3.5 hidden h-5 w-5 shrink-0 text-[#fdfbf7]/50 transition-colors group-focus-within:text-orange-300 sm:block" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={300}
                aria-label="Web search query"
                placeholder="What do you want to find? e.g. Neon vs Supabase pricing 2026"
                className="min-h-12 w-full bg-transparent px-3.5 py-2.5 font-serif text-base text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/40 focus-visible:outline-none sm:text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={query.trim().length < 3 || loading || limitReached}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 text-xs font-bold uppercase tracking-widest text-white shadow-[0_10px_28px_rgba(249,115,22,.22)] transition duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching
                </>
              ) : (
                <>
                  Search
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs text-[#fdfbf7]/70" aria-live="polite">
              {limitReached
                ? "You've used today's free searches. They reset at midnight UTC."
                : remaining !== null
                  ? `${remaining} free ${remaining === 1 ? "search" : "searches"} left today`
                  : "2 free searches per day"}
            </p>
            <span className="font-mono text-[11px] text-[#fdfbf7]/55">
              Minimum 3 characters · Primary sources prioritized
            </span>
          </div>
        </form>
      </div>

      <div className="res-body" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div
            role="status"
            aria-label="Searching the live web for sources"
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <p className=" inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scanning live documentation & benchmarks…
              </p>
              <span className="font-mono text-xs text-[#fdfbf7]/60">Querying index</span>
            </div>
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/[0.08] bg-[#100e0c] p-5 sm:p-6"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-28 animate-pulse rounded-full bg-white/[0.08]" />
                  <div className="h-4 w-16 animate-pulse rounded-full bg-white/[0.05]" />
                </div>
                <div className="mt-3.5 h-6 w-3/4 animate-pulse rounded-lg bg-white/[0.1]" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-white/[0.05]" />
                </div>
              </div>
            ))}
          </div>
        ) : outcome ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
              <h2 className="font-serif text-2xl tracking-tight text-[#fdfbf7]">
                {outcome.results.length} {outcome.results.length === 1 ? "source" : "sources"} for “{outcome.query}”
              </h2>
              <span className="font-mono text-xs text-[#fdfbf7]/60">
                Verified external links
              </span>
            </div>

            {outcome.results.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.09] bg-[#100e0c] p-8 text-center">
                <FileSearch className="mx-auto h-8 w-8 text-orange-300/80" />
                <p className="mt-3 font-serif text-xl text-[#fdfbf7]">
                  No sources found for that query
                </p>
                <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[#fdfbf7]/70">
                  No sources found. Try a more specific search with product names, pricing tiers, or benchmark terms.
                </p>
              </div>
            ) : (
              <div className="grid gap-3.5">
                {outcome.results.map((result, index) => (
                  <GlowCard
                    key={`${result.url}-${index}`}
                    glowColor="rgba(249, 115, 22, 0.14)"
                    containerClassName="rounded-2xl border-white/[0.1] bg-[#100e0c] transition duration-200 hover:border-orange-300/30"
                    className="p-5 sm:p-6"
                  >
                    <a
                      href={safeHref(result.url)}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/20 bg-orange-400/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-200">
                          <Globe className="h-3 w-3" />
                          {hostOf(result.url)}
                        </span>
                        <span className="font-mono text-xs text-[#fdfbf7]/55">
                          Source 0{index + 1}
                        </span>
                      </div>

                      <h3 className="mt-3 flex items-start justify-between gap-3 font-serif text-xl leading-snug text-[#fdfbf7] transition-colors group-hover:text-orange-200">
                        <span className="min-w-0 break-words">{result.title}</span>
                        <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[#fdfbf7]/55 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-300" />
                      </h3>

                      {result.snippet ? (
                        <p className="mt-2.5 text-sm leading-relaxed text-[#fdfbf7]/75">
                          {result.snippet}
                        </p>
                      ) : null}

                      <p className="mt-3 truncate font-mono text-xs text-[#fdfbf7]/55">
                        {result.url}
                      </p>
                    </a>
                  </GlowCard>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Editorial Empty State */
          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-400/[0.08] text-orange-300">
                  <Compass className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-serif text-2xl text-[#fdfbf7]">
                  Inspect primary evidence before you run a full comparison
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#fdfbf7]/70">
                  Enter a technical question above or pick a starter prompt below to pull official pricing pages, documentation, and benchmark reports.
                </p>
              </div>

              <div className="w-full lg:max-w-md">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#fdfbf7]/65">
                  Try a research query
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_QUERIES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuery(preset)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-left text-xs font-medium text-[#fdfbf7]/80 transition duration-200 hover:border-orange-300/35 hover:bg-orange-400/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-[0.99]"
                    >
                      <span>{preset}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-300" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPage;

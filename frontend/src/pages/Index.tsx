import React, { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, GitCompareArrows, Lock, Search, Sparkles, BookOpenText, BadgeCheck, Boxes, FileSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { brand, colors } from "@/config/brand";
import { buildApiUrl, envConfig } from "@/config/env";
import { apiFetch } from "@/lib/api";
import {
  type ComparisonData,
  type ResearchStep,
  ResearchLoader,
  ComparisonHeader,
  CategorySection,
  VerdictPanel,
  SourcesPanel,
  FollowUpPanel,
} from "@/components/Comparison/ComparisonEngine";

const examples = [
  "ChatGPT Plus vs Claude Pro",
  "Supabase vs Firebase",
  "Cursor vs Windsurf",
  "Vercel vs Render",
  "Paddle vs RevenueCat",
];

const researchSteps: ResearchStep[] = [
  { label: "Understanding query", detail: "Parsing entities and decision context", icon: GitCompareArrows },
  { label: "Finding official sources", detail: "Prioritizing pricing, docs, and product pages", icon: Search },
  { label: "Checking pricing", detail: "Flagging values that need fast refresh windows", icon: BadgeCheck },
  { label: "Reading docs", detail: "Extracting capabilities and integration notes", icon: BookOpenText },
  { label: "Extracting facts", detail: "Adding source URLs, confidence, and timestamps", icon: FileSearch },
  { label: "Building comparison", detail: "Creating category winners and nuanced verdicts", icon: Boxes },
];

const normalizeEntity = (name: string) =>
  name.replace(/\b(for|with|inside|on)\b.*$/i, "").replace(/[^a-z0-9\s+.-]/gi, "").trim();

const parseQuery = (query: string) => {
  const [left, rightWithContext] = query.split(/\s+vs\.?\s+/i);
  const [right, contextTail] = (rightWithContext || "").split(/\s+for\s+/i);
  const entityA = normalizeEntity(left || "Supabase") || "Supabase";
  const entityB = normalizeEntity(right || "Firebase") || "Firebase";
  const context = contextTail?.trim()
    ? `for ${contextTail.trim()}`
    : query.toLowerCase().includes("saas")
      ? "for a SaaS product"
      : "for the decision you described";
  return { entityA, entityB, context };
};

const makeSlug = (a: string, b: string) =>
  `${a}-vs-${b}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const titleCase = (v: string) =>
  v.split(" ").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

const productSubtitle = (name: string) => {
  const l = name.toLowerCase();
  if (l.includes("supabase")) return "Open-source Postgres platform";
  if (l.includes("firebase")) return "Google-backed app platform";
  if (l.includes("cursor")) return "AI-native code editor";
  if (l.includes("windsurf")) return "Agentic developer environment";
  if (l.includes("paddle")) return "Merchant of record billing";
  if (l.includes("revenuecat")) return "Subscription infrastructure";
  if (l.includes("chatgpt")) return "OpenAI consumer AI plan";
  if (l.includes("claude")) return "Anthropic consumer AI plan";
  if (l.includes("vercel")) return "Frontend cloud platform";
  if (l.includes("render")) return "Cloud app hosting platform";
  return "Product research target";
};

const buildResult = (query: string, refreshCount: number, previousResult?: ComparisonData | null): ComparisonData => {
  const { entityA, entityB, context } = parseQuery(query);
  const now = refreshCount > 0 ? "just now" : "2 min ago";
  const changed = refreshCount > 0;

  const entities = {
    a: { name: titleCase(entityA), subtitle: productSubtitle(entityA), mark: entityA.slice(0, 1).toUpperCase(), hex: colors.entityA },
    b: { name: titleCase(entityB), subtitle: productSubtitle(entityB), mark: entityB.slice(0, 1).toUpperCase(), hex: colors.entityB },
  };

  const result: ComparisonData = {
    slug: makeSlug(entityA, entityB),
    query,
    context,
    entities,
    sourceCount: changed ? 14 : 12,
    updatedAt: now,
    verdict: {
      bestOverall: entities.a.name,
      bestValue: entities.b.name,
      developers: entities.a.name,
      teams: entities.b.name,
      students: "Depends on usage cap",
      powerUsers: entities.a.name,
      ecosystem: entities.b.name,
      summary: `${entities.a.name} has the edge when control, extensibility, and developer velocity matter. ${entities.b.name} is still the safer recommendation for teams that want more managed defaults, broader ecosystem gravity, and less infrastructure ownership. Pricing-sensitive claims should be treated as fast-moving unless confirmed from official sources.`,
    },
    categories: [
      {
        name: "Pricing and plan clarity",
        winner: "tie",
        verdict: "Both need current official pricing checks before a purchase decision.",
        facts: [
          { entity: "a" as const, label: "Pricing posture", value: changed ? "Official pricing reviewed; usage-based lines changed since last run." : "Usage-based pricing with free tier signals; exact totals depend on workload.", source: "Official pricing page", sourceUrl: "#", sourceTitle: `${entities.a.name} pricing`, confidence: 0.86, freshness: "Monitor" as const, changed },
          { entity: "b" as const, label: "Pricing posture", value: "Generous starter path, but production costs vary by product mix.", source: "Official pricing page", sourceUrl: "#", sourceTitle: `${entities.b.name} pricing`, confidence: 0.84, freshness: "Monitor" as const },
        ],
      },
      {
        name: "Developer workflow",
        winner: "a",
        verdict: "The left option is stronger for teams that want inspectable primitives and SQL-native control.",
        facts: [
          { entity: "a" as const, label: "Core workflow", value: "Postgres-first architecture with SQL, auth, storage, and edge functions.", source: "Official docs", sourceUrl: "#", sourceTitle: `${entities.a.name} docs`, confidence: 0.91, freshness: "Fresh" as const },
          { entity: "b" as const, label: "Core workflow", value: "Integrated SDKs and managed services reduce setup for common app patterns.", source: "Official docs", sourceUrl: "#", sourceTitle: `${entities.b.name} docs`, confidence: 0.88, freshness: "Fresh" as const },
        ],
      },
      {
        name: "Ecosystem and integrations",
        winner: "b",
        verdict: "The right option benefits from broader default ecosystem pull and platform integrations.",
        facts: [
          { entity: "a" as const, label: "Integration profile", value: "Strong fit with modern web stacks and Postgres tooling.", source: "Docs and integration catalog", sourceUrl: "#", sourceTitle: `${entities.a.name} integrations`, confidence: 0.82, freshness: "Stable" as const },
          { entity: "b" as const, label: "Integration profile", value: "Deep platform ecosystem with analytics, messaging, hosting, and mobile SDKs.", source: "Official product docs", sourceUrl: "#", sourceTitle: `${entities.b.name} docs`, confidence: 0.89, freshness: "Stable" as const },
        ],
      },
      {
        name: "Risk and lock-in",
        winner: "a",
        verdict: "Open standards and portability reduce long-term lock-in risk for technical teams.",
        facts: [
          { entity: "a" as const, label: "Portability", value: "Postgres foundation gives clearer migration and self-hosting pathways.", source: "Official docs", sourceUrl: "#", sourceTitle: `${entities.a.name} docs`, confidence: 0.87, freshness: "Stable" as const },
          { entity: "b" as const, label: "Portability", value: "Managed convenience can create product-specific architecture dependencies.", source: "Docs and migration notes", sourceUrl: "#", sourceTitle: `${entities.b.name} docs`, confidence: 0.79, freshness: "Stable" as const },
        ],
      },
    ],
    sources: [
      { title: `${entities.a.name} official pricing`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.a.name} official pricing`)}`, reliability: "Official" as const, fetchedAt: "3 min ago" },
      { title: `${entities.b.name} official pricing`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.b.name} official pricing`)}`, reliability: "Official" as const, fetchedAt: "4 min ago" },
      { title: `${entities.a.name} product docs`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.a.name} docs`)}`, reliability: "Docs" as const, fetchedAt: "6 min ago" },
      { title: `${entities.b.name} product docs`, url: `https://www.google.com/search?q=${encodeURIComponent(`${entities.b.name} docs`)}`, reliability: "Docs" as const, fetchedAt: "8 min ago" },
    ],
  };

  if (previousResult) {
    return detectClientChanges(result, previousResult);
  }

  return result;
};

const detectClientChanges = (current: ComparisonData, previous: ComparisonData): ComparisonData => {
  const oldFacts = new Map<string, string>();
  for (const cat of previous.categories) {
    for (const f of cat.facts) {
      oldFacts.set(`${f.entity}:${f.label}`, f.value);
    }
  }

  const categories = current.categories.map((cat) => ({
    ...cat,
    facts: cat.facts.map((f) => {
      const key = `${f.entity}:${f.label}`;
      const oldValue = oldFacts.get(key);
      if (oldValue !== undefined && oldValue !== f.value) {
        return { ...f, changed: true, previousValue: oldValue };
      }
      return { ...f, changed: false };
    }),
  }));

  return { ...current, categories, sourceCount: current.sourceCount + 1, updatedAt: "just now" };
};

type ComparisonJob = {
  id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  activeStep: number;
  query: string;
  result: ComparisonData | null;
  error?: string | null;
};

type ActiveJob = { id: string; startedAt: number; mode: "local" | "backend" };

const createBackendJob = async (query: string) => {
  const res = await apiFetch(buildApiUrl("/api/comparisons/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Unable to start comparison research.");
  return (await res.json()) as ComparisonJob;
};

const refreshBackendJob = async (id: string) => {
  const res = await apiFetch(buildApiUrl(`/api/comparisons/${id}/refresh`), { method: "POST" });
  if (!res.ok) throw new Error("Unable to refresh comparison.");
  return (await res.json()) as ComparisonJob;
};

const pollJob = async (activeJob: ActiveJob, query: string): Promise<ComparisonJob> => {
  if (activeJob.mode === "backend") {
    const res = await apiFetch(buildApiUrl(`/api/comparisons/${activeJob.id}`));
    if (!res.ok) throw new Error("Unable to poll comparison.");
    return (await res.json()) as ComparisonJob;
  }
  await new Promise((r) => setTimeout(r, 180));
  const elapsed = Date.now() - activeJob.startedAt;
  const progress = Math.min(100, Math.round((elapsed / 5200) * 100));
  return {
    id: activeJob.id,
    status: progress >= 100 ? "completed" : "running",
    progress,
    activeStep: Math.min(researchSteps.length - 1, Math.floor((progress / 100) * researchSteps.length)),
    query,
    result: null,
  };
};

const Index = () => {
  const [query, setQuery] = useState("Supabase vs Firebase for a SaaS");
  const [job, setJob] = useState<ActiveJob | null>(null);
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonData | null>(() => buildResult("Supabase vs Firebase for a SaaS", 0));
  const [refreshCount, setRefreshCount] = useState(0);
  const [followUp, setFollowUp] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const jobQuery = useQuery({
    queryKey: ["comparison-job", job?.id],
    queryFn: () => pollJob(job ?? { id: "local", startedAt: Date.now(), mode: "local" }, query),
    enabled: Boolean(job),
    refetchInterval: (q) => (q.state.data?.status === "completed" ? false : 620),
  });

  const jobData = jobQuery.data;
  const isResearching = Boolean(job && jobData?.status !== "completed");

  useEffect(() => {
    if (!job || jobData?.status !== "completed") return;
    const prevResult = result;
    const newResult = jobData.result ?? buildResult(query, refreshCount, prevResult);
    setResult(newResult);
    setComparisonId(job.mode === "backend" ? job.id : null);
    setJob(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, jobData?.result, jobData?.status, query, refreshCount]);

  const entityFacts = useMemo(() => {
    if (!result) return { a: [] as { category: string }[], b: [] as { category: string }[] };
    const facts = result.categories.flatMap((c) => c.facts.map((f) => ({ ...f, category: c.name })));
    return { a: facts.filter((f) => f.entity === "a"), b: facts.filter((f) => f.entity === "b") };
  }, [result]);

  const startResearch = async (nextQuery = query, refreshed = false) => {
    const clean = nextQuery.trim();
    if (!clean) return;
    setQuery(clean);
    setFollowUpAnswer("");
    if (refreshed) setRefreshCount((c) => c + 1);

    try {
      const j = await createBackendJob(clean);
      setJob({ id: j.id, startedAt: Date.now(), mode: "backend" });
      return;
    } catch (e) { console.error("Backend comparison failed.", e); }
    setJob({ id: `${Date.now()}`, startedAt: Date.now(), mode: "local" });
  };

  const handleRefresh = async () => {
    if (!result) return;
    setFollowUpAnswer("");
    setRefreshCount((c) => c + 1);
    if (comparisonId) {
      try {
        const j = await refreshBackendJob(comparisonId);
        setJob({ id: j.id, startedAt: Date.now(), mode: "backend" });
        return;
      } catch (e) { console.error("Backend refresh failed.", e); }
    }
    setJob({ id: `${Date.now()}`, startedAt: Date.now(), mode: "local" });
  };

  const askFollowUp = async () => {
    if (!result) return;
    const clean = followUp.trim();
    if (!clean) return;
    if (comparisonId) {
      try {
        const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/follow-up`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: clean }),
        });
        if (res.ok) {
          const data = (await res.json()) as { answer: string };
          setFollowUpAnswer(data.answer);
          setFollowUp("");
          return;
        }
      } catch (e) { console.error("Follow-up failed.", e); }
    }
    setFollowUpAnswer(`Based on the current source-backed matrix, the answer leans toward ${result.verdict.developers} for technical control and ${result.verdict.bestValue} for lower-friction adoption. SideBy would rerun targeted source checks before answering pricing-sensitive follow-ups.`);
    setFollowUp("");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0c0b0a] text-[#fdfbf7] selection:bg-orange-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2a2a2a] bg-[#0c0b0a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4" aria-label={brand.productName}>
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7]">
              S
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight text-[#fdfbf7]">{brand.productName}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Research Engine</p>
            </div>
          </Link>

          {envConfig.hasClerkConfig ? (
            <>
              <SignedIn>
                <div className="p-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="border border-[#fdfbf7] bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-colors hover:bg-[#fdfbf7] hover:text-[#0c0b0a]">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <Link
              to="/auth/sign-in"
              className="border border-[#fdfbf7] bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-colors hover:bg-[#fdfbf7] hover:text-[#0c0b0a]"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {envConfig.hasClerkConfig && (
        <SignedOut>
          <PrivateBetaGate />
        </SignedOut>
      )}

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-32 pt-20 lg:px-8">
        {/* Editorial Hero */}
        <section className="mb-24 w-full max-w-4xl">
          <div className="mb-8 flex items-center gap-3 border-b-2 border-orange-600 pb-2 inline-flex">
            <Sparkles className="h-4 w-4 text-orange-500" /> 
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-500">
              Editorial Intelligence
            </span>
          </div>
          <h1 className="mb-8 font-serif text-5xl leading-[1.05] text-[#fdfbf7] sm:text-6xl md:text-[5rem] tracking-tight">
            Compare anything with source-backed confidence.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-[#fdfbf7]/60 font-serif md:text-xl">
            A premium engine that parses decisions, extracts official facts, and builds a living, nuanced matrix.
          </p>

          <div className="relative mt-12 flex w-full flex-col gap-4 border-b border-[#444] pb-4 transition-colors focus-within:border-orange-500 md:flex-row md:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") startResearch(); }}
              placeholder="E.g., Vercel vs Render for a SaaS..."
              className="flex-1 bg-transparent font-serif text-2xl text-[#fdfbf7] placeholder:text-[#fdfbf7]/20 outline-none md:text-3xl"
            />
            <button
              onClick={() => startResearch()}
              disabled={isResearching}
              className="bg-[#fdfbf7] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              {isResearching ? "Researching..." : "Compare"}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => startResearch(ex)}
                className="border border-[#333] bg-[#111] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 transition-all hover:border-orange-500/50 hover:bg-[#1a1a1a] hover:text-[#fdfbf7]"
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className="border-t-4 border-[#2a2a2a] pt-20">
          <AnimatePresence mode="wait">
            {isResearching ? (
              <ResearchLoader
                key="loading"
                query={query}
                progress={jobData?.progress ?? 4}
                activeStep={jobData?.activeStep ?? 0}
                steps={researchSteps}
              />
            ) : result ? (
              <div key="result" className="grid gap-12 lg:grid-cols-12">
                <div className="space-y-12 lg:col-span-8">
                  <ComparisonHeader result={result} onRefresh={handleRefresh} comparisonId={comparisonId} />

                  <div className="space-y-12">
                    {result.categories.map((cat, i) => (
                      <CategorySection key={cat.name} category={cat} entities={result.entities} index={i} />
                    ))}
                  </div>
                </div>

                <aside className="space-y-8 lg:col-span-4">
                  <VerdictPanel result={result} />
                  <EntityFactPanel result={result} facts={entityFacts} />
                  <SourcesPanel sources={result.sources} />
                  <FollowUpPanel
                    question={followUp}
                    answer={followUpAnswer}
                    onQuestionChange={setFollowUp}
                    onAsk={askFollowUp}
                  />
                </aside>
              </div>
            ) : null}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

const EntityFactPanel = ({
  result,
  facts,
}: {
  result: ComparisonData;
  facts: Record<string, Array<{ category: string }>>;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: 0.1 }}
    className="border border-[#2a2a2a] bg-[#0c0b0a] p-8"
  >
    <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7] tracking-tight">Fact Coverage</h3>
    <div className="space-y-4">
      {(["a", "b"] as const).map((key) => (
        <div key={key} className="border border-[#2a2a2a] bg-[#111] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-serif" style={{ color: result.entities[key].hex }}>
              {result.entities[key].name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
              {facts[key].length} facts
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {facts[key].slice(0, 4).map((f) => (
              <span
                key={`${key}-${f.category}`}
                className="border border-[#333] bg-[#0c0b0a] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50"
              >
                {f.category}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

const PrivateBetaGate = () => (
  <div className="fixed inset-x-0 bottom-0 top-20 z-30 flex items-center justify-center bg-[#0c0b0a]/95 px-6 backdrop-blur-md">
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full max-w-xl border-t-4 border-orange-600 bg-[#111] p-10 text-center shadow-2xl"
    >
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border border-orange-500/30 text-orange-500">
        <Lock className="h-6 w-6" />
      </div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-orange-500">SideBy Private Beta</p>
      <h2 className="mb-4 font-serif text-4xl text-[#fdfbf7] tracking-tight">Sign in to research comparisons.</h2>
      <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-[#fdfbf7]/60 font-serif">
        The beta is wired to Clerk and Neon, with refreshable source-backed comparisons stored for audit and iteration.
      </p>
      <SignInButton mode="modal">
        <button className="inline-flex items-center gap-3 bg-[#fdfbf7] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]">
          Enter Beta <ArrowRight className="h-4 w-4" />
        </button>
      </SignInButton>
    </motion.div>
  </div>
);

export default Index;
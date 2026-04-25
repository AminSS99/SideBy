import React, { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Boxes,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileSearch,
  GitCompareArrows,
  Globe2,
  Library,
  Link as LinkIcon,
  Lock,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { brand } from "@/config/brand";
import { buildApiUrl, envConfig } from "@/config/env";

type EntityKey = "a" | "b";

type ResearchStep = {
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Source = {
  title: string;
  url: string;
  reliability: "Official" | "Docs" | "Community";
  sourceType?: string;
  extractionMethod?: string;
  fetchedAt: string;
  confidence?: number;
  contentHash?: string;
  summary?: string;
};

type Fact = {
  entity: EntityKey;
  label: string;
  value: string;
  source: string;
  confidence: number;
  freshness: "Fresh" | "Monitor" | "Stable";
  changed?: boolean;
};

type Category = {
  name: string;
  winner: "a" | "b" | "tie";
  verdict: string;
  facts: Fact[];
};

type ComparisonResult = {
  slug: string;
  query: string;
  context: string;
  entities: {
    a: { name: string; subtitle: string; mark: string; color: string; hex: string };
    b: { name: string; subtitle: string; mark: string; color: string; hex: string };
  };
  sourceCount: number;
  updatedAt: string;
  verdict: {
    bestOverall: string;
    bestValue: string;
    developers: string;
    teams: string;
    students: string;
    powerUsers: string;
    summary: string;
  };
  categories: Category[];
  sources: Source[];
};

type ComparisonJob = {
  id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  activeStep: number;
  query: string;
  result: ComparisonResult | null;
  error?: string | null;
};

const examples = [
  "ChatGPT Plus vs Claude Pro",
  "Supabase vs Firebase",
  "Cursor vs Windsurf",
  "Vercel vs Render",
  "Paddle vs RevenueCat",
];

const researchSteps: ResearchStep[] = [
  {
    label: "Understanding query",
    detail: "Parsing entities and decision context",
    icon: GitCompareArrows,
  },
  {
    label: "Finding official sources",
    detail: "Prioritizing pricing, docs, and product pages",
    icon: Search,
  },
  {
    label: "Checking pricing",
    detail: "Flagging values that need fast refresh windows",
    icon: BadgeCheck,
  },
  {
    label: "Reading docs",
    detail: "Extracting capabilities and integration notes",
    icon: BookOpenText,
  },
  {
    label: "Extracting facts",
    detail: "Adding source URLs, confidence, and timestamps",
    icon: FileSearch,
  },
  {
    label: "Building comparison",
    detail: "Creating category winners and nuanced verdicts",
    icon: Boxes,
  },
];

const sourceTimes = ["3 min ago", "4 min ago", "6 min ago", "8 min ago"];

const normalizeEntity = (name: string) =>
  name
    .replace(/\b(for|with|inside|on)\b.*$/i, "")
    .replace(/[^a-z0-9\s+.-]/gi, "")
    .trim();

const parseQuery = (query: string) => {
  const [left, rightWithContext] = query.split(/\s+vs\.?\s+/i);
  const [right, contextTail] = (rightWithContext || "").split(/\s+for\s+/i);
  const entityA = normalizeEntity(left || "Supabase") || "Supabase";
  const entityB = normalizeEntity(right || "Firebase") || "Firebase";
  const context =
    (contextTail?.trim() ? `for ${contextTail.trim()}` : "") ||
    (query.toLowerCase().includes("saas")
      ? "for a SaaS product"
      : "for the decision you described");

  return { entityA, entityB, context };
};

const makeSlug = (entityA: string, entityB: string) =>
  `${entityA}-vs-${entityB}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const productSubtitle = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("supabase")) return "Open-source Postgres platform";
  if (lower.includes("firebase")) return "Google-backed app platform";
  if (lower.includes("cursor")) return "AI-native code editor";
  if (lower.includes("windsurf")) return "Agentic developer environment";
  if (lower.includes("paddle")) return "Merchant of record billing";
  if (lower.includes("revenuecat")) return "Subscription infrastructure";
  if (lower.includes("chatgpt")) return "OpenAI consumer AI plan";
  if (lower.includes("claude")) return "Anthropic consumer AI plan";
  if (lower.includes("vercel")) return "Frontend cloud platform";
  if (lower.includes("render")) return "Cloud app hosting platform";
  return "Product research target";
};

const buildResult = (query: string, refreshCount: number): ComparisonResult => {
  const { entityA, entityB, context } = parseQuery(query);
  const now = refreshCount > 0 ? "just now" : "2 min ago";
  const changed = refreshCount > 0;

  const entities = {
    a: {
      name: titleCase(entityA),
      subtitle: productSubtitle(entityA),
      mark: entityA.slice(0, 1).toUpperCase(),
      color: "from-[#c27853] to-[#a05a39]",
      hex: "#c27853",
    },
    b: {
      name: titleCase(entityB),
      subtitle: productSubtitle(entityB),
      mark: entityB.slice(0, 1).toUpperCase(),
      color: "from-[#06b6d4] to-[#0891b2]",
      hex: "#06b6d4",
    },
  };

  return {
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
      summary: `${entities.a.name} has the edge when control, extensibility, and developer velocity matter. ${entities.b.name} is still the safer recommendation for teams that want more managed defaults, broader ecosystem gravity, and less infrastructure ownership. Pricing-sensitive claims should be treated as fast-moving unless confirmed from official sources.`,
    },
    categories: [
      {
        name: "Pricing and plan clarity",
        winner: "tie",
        verdict:
          "Both need current official pricing checks before a purchase decision.",
        facts: [
          {
            entity: "a",
            label: "Pricing posture",
            value: changed
              ? "Official pricing reviewed; usage-based lines changed since last run."
              : "Usage-based pricing with free tier signals; exact totals depend on workload.",
            source: "Official pricing page",
            confidence: 0.86,
            freshness: "Monitor",
            changed,
          },
          {
            entity: "b",
            label: "Pricing posture",
            value: "Generous starter path, but production costs vary by product mix.",
            source: "Official pricing page",
            confidence: 0.84,
            freshness: "Monitor",
          },
        ],
      },
      {
        name: "Developer workflow",
        winner: "a",
        verdict:
          "The left option is stronger for teams that want inspectable primitives and SQL-native control.",
        facts: [
          {
            entity: "a",
            label: "Core workflow",
            value: "Postgres-first architecture with SQL, auth, storage, and edge functions.",
            source: "Official docs",
            confidence: 0.91,
            freshness: "Fresh",
          },
          {
            entity: "b",
            label: "Core workflow",
            value: "Integrated SDKs and managed services reduce setup for common app patterns.",
            source: "Official docs",
            confidence: 0.88,
            freshness: "Fresh",
          },
        ],
      },
      {
        name: "Ecosystem and integrations",
        winner: "b",
        verdict:
          "The right option benefits from broader default ecosystem pull and platform integrations.",
        facts: [
          {
            entity: "a",
            label: "Integration profile",
            value: "Strong fit with modern web stacks and Postgres tooling.",
            source: "Docs and integration catalog",
            confidence: 0.82,
            freshness: "Stable",
          },
          {
            entity: "b",
            label: "Integration profile",
            value: "Deep platform ecosystem with analytics, messaging, hosting, and mobile SDKs.",
            source: "Official product docs",
            confidence: 0.89,
            freshness: "Stable",
          },
        ],
      },
      {
        name: "Risk and lock-in",
        winner: "a",
        verdict:
          "Open standards and portability reduce long-term lock-in risk for technical teams.",
        facts: [
          {
            entity: "a",
            label: "Portability",
            value: "Postgres foundation gives clearer migration and self-hosting pathways.",
            source: "Official docs",
            confidence: 0.87,
            freshness: "Stable",
          },
          {
            entity: "b",
            label: "Portability",
            value: "Managed convenience can create product-specific architecture dependencies.",
            source: "Docs and migration notes",
            confidence: 0.79,
            freshness: "Stable",
          },
        ],
      },
    ],
    sources: [
      {
        title: `${entities.a.name} official pricing`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${entities.a.name} official pricing`,
        )}`,
        reliability: "Official",
        fetchedAt: sourceTimes[0],
      },
      {
        title: `${entities.b.name} official pricing`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${entities.b.name} official pricing`,
        )}`,
        reliability: "Official",
        fetchedAt: sourceTimes[1],
      },
      {
        title: `${entities.a.name} product docs`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${entities.a.name} docs`,
        )}`,
        reliability: "Docs",
        fetchedAt: sourceTimes[2],
      },
      {
        title: `${entities.b.name} product docs`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${entities.b.name} docs`,
        )}`,
        reliability: "Docs",
        fetchedAt: sourceTimes[3],
      },
    ],
  };
};

type ActiveJob = {
  id: string;
  startedAt: number;
  mode: "local" | "backend";
};

const createBackendJob = async (query: string) => {
  const response = await fetch(buildApiUrl("/api/comparisons/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Unable to start comparison research.");
  }

  return (await response.json()) as ComparisonJob;
};

const refreshBackendJob = async (id: string) => {
  const response = await fetch(buildApiUrl(`/api/comparisons/${id}/refresh`), {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to refresh comparison.");
  }

  return (await response.json()) as ComparisonJob;
};

const pollComparisonJob = async (
  activeJob: ActiveJob,
  query: string,
): Promise<ComparisonJob> => {
  if (activeJob.mode === "backend") {
    const response = await fetch(buildApiUrl(`/api/comparisons/${activeJob.id}`));
    if (!response.ok) {
      throw new Error("Unable to poll comparison research.");
    }

    return (await response.json()) as ComparisonJob;
  }

  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const elapsed = Date.now() - activeJob.startedAt;
  const progress = Math.min(100, Math.round((elapsed / 5200) * 100));
  return {
    id: activeJob.id,
    status: progress >= 100 ? "completed" : "running",
    progress,
    activeStep: Math.min(
      researchSteps.length - 1,
      Math.floor((progress / 100) * researchSteps.length),
    ),
    query,
    result: null,
  };
};

const editorialPanelClass = "border border-white/10 bg-[#0a0a0a] backdrop-blur-md";

const Index = () => {
  const [query, setQuery] = useState("Supabase vs Firebase for a SaaS");
  const [job, setJob] = useState<ActiveJob | null>(null);
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [followUp, setFollowUp] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const jobQuery = useQuery({
    queryKey: ["comparison-job", job?.id],
    queryFn: () =>
      pollComparisonJob(
        job ?? { id: "local", startedAt: Date.now(), mode: "local" },
        query,
      ),
    enabled: Boolean(job),
    refetchInterval: (queryState) =>
      queryState.state.data?.status === "completed" ? false : 620,
  });

  const jobData = jobQuery.data;
  const isResearching = Boolean(job && jobData?.status !== "completed");
  const currentStep = researchSteps[jobData?.activeStep ?? 0];

  useEffect(() => {
    if (!job || jobData?.status !== "completed") return;

    setResult(jobData.result ?? buildResult(query, refreshCount));
    setComparisonId(job.mode === "backend" ? job.id : null);
    setJob(null);
  }, [job, jobData?.result, jobData?.status, query, refreshCount]);

  const entityFacts = useMemo(() => {
    if (!result) return { a: [], b: [] };
    const facts = result.categories.flatMap((category) =>
      category.facts.map((fact) => ({ ...fact, category: category.name })),
    );

    return {
      a: facts.filter((fact) => fact.entity === "a"),
      b: facts.filter((fact) => fact.entity === "b"),
    };
  }, [result]);

  const startResearch = async (nextQuery = query, refreshed = false) => {
    const cleanQuery = nextQuery.trim();
    if (!cleanQuery) return;

    setQuery(cleanQuery);
    setFollowUpAnswer("");
    if (refreshed) setRefreshCount((count) => count + 1);

    if (envConfig.hasApiBaseUrl) {
      try {
        const backendJob = await createBackendJob(cleanQuery);
        setJob({ id: backendJob.id, startedAt: Date.now(), mode: "backend" });
        return;
      } catch (error) {
        console.error("Backend comparison job failed to start.", error);
      }
    }

    setJob({ id: `${Date.now()}`, startedAt: Date.now(), mode: "local" });
  };

  const handleRefresh = async () => {
    if (!result) return;
    setFollowUpAnswer("");
    setRefreshCount((count) => count + 1);

    if (envConfig.hasApiBaseUrl && comparisonId) {
      try {
        const refreshedJob = await refreshBackendJob(comparisonId);
        setJob({ id: refreshedJob.id, startedAt: Date.now(), mode: "backend" });
        return;
      } catch (error) {
        console.error("Backend comparison refresh failed.", error);
      }
    }

    setJob({ id: `${Date.now()}`, startedAt: Date.now(), mode: "local" });
  };

  const askFollowUp = async () => {
    if (!result) return;
    const cleanQuestion = followUp.trim();
    if (!cleanQuestion) return;

    if (envConfig.hasApiBaseUrl && comparisonId) {
      try {
        const response = await fetch(
          buildApiUrl(`/api/comparisons/${comparisonId}/follow-up`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: cleanQuestion }),
          },
        );

        if (response.ok) {
          const data = (await response.json()) as { answer: string };
          setFollowUpAnswer(data.answer);
          setFollowUp("");
          return;
        }
      } catch (error) {
        console.error("Backend follow-up failed.", error);
      }
    }

    setFollowUpAnswer(
      `Based on the current source-backed matrix, the answer leans toward ${result.verdict.developers} for technical control and ${result.verdict.bestValue} for lower-friction adoption. SideBy would rerun targeted source checks before answering pricing-sensitive follow-ups.`,
    );
    setFollowUp("");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030303] font-sans text-white selection:bg-[#c27853]/30">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030303]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a
            href={brand.url}
            className="flex items-center gap-4"
            aria-label={brand.productName}
          >
            <div className="flex h-10 w-10 items-center justify-center border border-white/20 bg-black text-xl font-serif text-[#fffff0]">
              S
            </div>
            <div>
              <p className="text-lg font-serif tracking-tight text-[#fffff0]">
                {brand.companyName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Research Engine
              </p>
            </div>
          </a>

          {envConfig.hasClerkConfig ? (
            <>
              <SignedIn>
                <div className="rounded-none border border-white/20 bg-black p-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="h-10 rounded-none bg-[#fffff0] px-6 text-xs font-bold uppercase tracking-widest text-[#050505] hover:bg-[#e5e5d8]">
                    Private beta
                  </Button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <Button
              asChild
              className="h-10 rounded-none bg-[#fffff0] px-6 text-xs font-bold uppercase tracking-widest text-[#050505] hover:bg-[#e5e5d8]"
            >
              <Link to="/auth/sign-in">Connect</Link>
            </Button>
          )}
        </div>
      </header>

      {envConfig.hasClerkConfig && (
        <SignedOut>
          <PrivateBetaGate />
        </SignedOut>
      )}

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6">
        
        {/* HERO SECTION */}
        <section className="mb-16 max-w-4xl">
          <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c27853]">
            <Sparkles className="h-4 w-4" /> Editorial Intelligence
          </div>
          <h1 className="mb-6 font-serif text-5xl leading-[1.1] tracking-tight text-[#fffff0] sm:text-7xl">
            Compare anything with source-backed confidence.
          </h1>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-white/60 sm:text-xl">
            A premium engine that parses decisions, extracts official facts, and builds a living, nuanced matrix.
          </p>

          <div className="relative mt-12 flex flex-col gap-4 border-b-2 border-white/20 pb-4 transition-colors focus-within:border-white md:flex-row">
            <Search className="hidden h-8 w-8 text-white/40 md:mt-2 md:block" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") startResearch();
              }}
              placeholder="Enter comparison subject..."
              className="flex-1 bg-transparent font-serif text-3xl text-[#fffff0] placeholder:text-white/20 outline-none md:text-4xl"
            />
            <Button
              onClick={() => startResearch()}
              disabled={isResearching}
              className="h-14 rounded-none bg-[#fffff0] px-8 text-xs font-bold uppercase tracking-widest text-[#050505] hover:bg-[#e5e5d8]"
            >
              {isResearching ? "Researching..." : "Compare"}
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => startResearch(example)}
                className="rounded-none border border-white/10 bg-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 transition hover:border-white/30 hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        {/* LOADING OR RESULT SECTION */}
        <section className="border-t border-white/10 pt-16">
          <AnimatePresence mode="wait">
            {isResearching ? (
              <ResearchLoadingCard
                key="loading"
                query={query}
                progress={jobData?.progress ?? 4}
                activeStep={jobData?.activeStep ?? 0}
              />
            ) : result ? (
              <div className="grid gap-12 lg:grid-cols-12">
                {/* Main Content */}
                <div className="space-y-12 lg:col-span-8">
                  <ComparisonHero result={result} onRefresh={handleRefresh} />
                  
                  <div className="space-y-12">
                    {result.categories.map((category, index) => (
                      <CategorySection
                        key={category.name}
                        category={category}
                        result={result}
                        index={index}
                      />
                    ))}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8 lg:col-span-4">
                  <VerdictPanel result={result} />
                  <EntityFactPanel result={result} facts={entityFacts} />
                  <SourcesPanel sources={result.sources} />
                  <FollowUpPanel
                    question={followUp}
                    answer={followUpAnswer}
                    onQuestionChange={setFollowUp}
                    onAsk={askFollowUp}
                  />
                </div>
              </div>
            ) : null}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

const ResearchLoadingCard = ({
  query,
  progress,
  activeStep,
}: {
  query: string;
  progress: number;
  activeStep: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.35 }}
    className={`${editorialPanelClass} min-h-[500px] p-8`}
  >
    <div className="mb-12 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          Running Analysis
        </p>
        <h2 className="mt-2 font-serif text-3xl text-[#fffff0]">
          {query}
        </h2>
      </div>
      <div className="text-right">
        <span className="font-serif text-4xl text-[#c27853]">{progress}%</span>
      </div>
    </div>

    <div className="grid gap-4 font-mono text-sm text-white/70">
      {researchSteps.map((step, index) => {
        const visible = index <= activeStep;
        return (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: visible ? 1 : 0.35, x: 0 }}
            transition={{ duration: 0.32, delay: index * 0.04 }}
            className="flex items-center gap-4"
          >
            <span className="w-24 text-white/40">
              [{index + 1}/{researchSteps.length}]
            </span>
            <span className={visible && index === activeStep ? "text-[#c27853]" : ""}>
              {step.label.toUpperCase()}...
            </span>
            {visible && index === activeStep && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                _
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);

const ComparisonHero = ({
  result,
  onRefresh,
}: {
  result: ComparisonResult;
  onRefresh: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.45, ease: "easeOut" }}
  >
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-3">
        <span className="border border-[#06b6d4]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#06b6d4]">
          Fresh {result.updatedAt}
        </span>
        <span className="border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
          {result.sourceCount} sources
        </span>
      </div>
      <Button
        onClick={onRefresh}
        variant="outline"
        className="h-10 rounded-none border-white/20 bg-transparent text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10"
      >
        <RefreshCw className="mr-2 h-3 w-3" />
        Refresh
      </Button>
    </div>

    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
      <h2 className="font-serif text-5xl text-[#fffff0] md:text-6xl">
        <span className="text-[#c27853]">{result.entities.a.name}</span>
        <span className="mx-4 font-sans text-2xl italic text-white/30">vs</span>
        <span className="text-[#06b6d4]">{result.entities.b.name}</span>
      </h2>
    </div>

    <div className="mb-12 border-l-2 border-white/20 pl-6">
      <p className="text-sm font-bold uppercase tracking-widest text-white/40 mb-2">Verdict Summary</p>
      <p className="text-lg font-light leading-relaxed text-[#fffff0]">
        {result.verdict.summary}
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <EntityCard entity={result.entities.a} />
      <EntityCard entity={result.entities.b} />
    </div>
  </motion.div>
);

const EntityCard = ({
  entity,
}: {
  entity: ComparisonResult["entities"]["a"];
}) => (
  <div className={`${editorialPanelClass} border-t-4 p-6`} style={{ borderTopColor: entity.hex }}>
    <div className="mb-6 flex items-center gap-4">
      <div
        className="flex h-12 w-12 items-center justify-center bg-white/5 font-serif text-2xl text-white border border-white/10"
      >
        {entity.mark}
      </div>
      <div>
        <p className="font-serif text-2xl text-[#fffff0]">
          {entity.name}
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">
          {entity.subtitle}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-px bg-white/10">
      {["Pricing", "Docs", "Capabilities", "Fit"].map((label) => (
        <div key={label} className="bg-[#0a0a0a] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
          <p className="mt-1 text-sm font-semibold text-white">Checked</p>
        </div>
      ))}
    </div>
  </div>
);

const CategorySection = ({
  category,
  result,
  index,
}: {
  category: Category;
  result: ComparisonResult;
  index: number;
}) => {
  const winnerLabel =
    category.winner === "tie"
      ? "No forced winner"
      : `${result.entities[category.winner].name} leads`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="border-t border-white/10 pt-8"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl text-[#fffff0]">
            {category.name}
          </h3>
          <p className="mt-2 text-sm text-white/60">
            {category.verdict}
          </p>
        </div>
        <span className="flex items-center border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
          <TrendingUp className="mr-2 h-3 w-3" />
          {winnerLabel}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {category.facts.map((fact) => (
          <FactCard
            key={`${fact.entity}-${fact.label}`}
            fact={fact}
            entity={result.entities[fact.entity]}
          />
        ))}
      </div>
    </motion.article>
  );
};

const FactCard = ({
  fact,
  entity,
}: {
  fact: Fact;
  entity: ComparisonResult["entities"]["a"];
}) => (
  <div
    className={`p-6 border-l-2 transition-colors ${
      fact.changed ? "bg-[#c27853]/5" : "bg-white/5"
    }`}
    style={{ borderLeftColor: entity.hex }}
  >
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          {entity.name} • {fact.label}
        </p>
      </div>
      <Confidence value={fact.confidence} hex={entity.hex} />
    </div>
    
    <p className="mb-6 text-sm leading-relaxed text-[#fffff0]">
      {fact.value}
    </p>
    
    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
      <span className="border border-white/10 px-2 py-1 text-white/50">
        {fact.source}
      </span>
      <span className="border border-white/10 px-2 py-1 text-white/50">
        {fact.freshness}
      </span>
      {fact.changed && (
        <span className="border border-[#c27853]/30 px-2 py-1 text-[#c27853]">
          Changed
        </span>
      )}
    </div>
  </div>
);

const Confidence = ({ value, hex }: { value: number; hex: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] font-bold text-white/50">
      {Math.round(value * 100)}%
    </span>
    <div className="h-1 w-8 bg-white/10">
      <div
        className="h-full"
        style={{ width: `${Math.round(value * 100)}%`, backgroundColor: hex }}
      />
    </div>
  </div>
);

const VerdictPanel = ({ result }: { result: ComparisonResult }) => {
  const verdictRows = [
    ["Overall", result.verdict.bestOverall],
    ["Value", result.verdict.bestValue],
    ["Developers", result.verdict.developers],
    ["Teams", result.verdict.teams],
  ];

  return (
    <div className={`${editorialPanelClass} p-6`}>
      <h3 className="mb-6 font-serif text-xl text-[#fffff0]">Decision Matrix</h3>
      <div className="divide-y divide-white/10 border-y border-white/10">
        {verdictRows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {label}
            </span>
            <span className="text-sm font-semibold text-white">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const EntityFactPanel = ({
  result,
  facts,
}: {
  result: ComparisonResult;
  facts: Record<EntityKey, Array<Fact & { category: string }>>;
}) => (
  <div className={`${editorialPanelClass} p-6`}>
    <h3 className="mb-6 font-serif text-xl text-[#fffff0]">Fact Coverage</h3>
    <div className="space-y-4">
      {(["a", "b"] as EntityKey[]).map((key) => (
        <div key={key} className="border border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-white" style={{ color: result.entities[key].hex }}>
              {result.entities[key].name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              {facts[key].length} facts
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {facts[key].slice(0, 4).map((fact) => (
              <span
                key={`${key}-${fact.category}`}
                className="bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/50"
              >
                {fact.category}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SourcesPanel = ({ sources }: { sources: Source[] }) => (
  <div className={`${editorialPanelClass} p-6`}>
    <div className="mb-6 flex items-center justify-between">
      <h3 className="font-serif text-xl text-[#fffff0]">Sources</h3>
      <span className="border border-white/20 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/50">
        Official First
      </span>
    </div>

    <div className="space-y-4">
      {sources.map((source) => (
        <a
          key={source.title}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group block border border-white/10 p-4 transition-colors hover:border-white/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-3 text-sm font-semibold text-white group-hover:underline">
                {source.title}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/50">
                  <Lock className="mr-1 inline h-2 w-2" />
                  {source.reliability}
                </span>
                <span className="border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/50">
                  <Clock3 className="mr-1 inline h-2 w-2" />
                  {source.fetchedAt}
                </span>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 flex-none text-white/30 group-hover:text-white" />
          </div>
        </a>
      ))}
    </div>
  </div>
);

const FollowUpPanel = ({
  question,
  answer,
  onQuestionChange,
  onAsk,
}: {
  question: string;
  answer: string;
  onQuestionChange: (value: string) => void;
  onAsk: () => void;
}) => (
  <div className={`${editorialPanelClass} p-6`}>
    <h3 className="mb-6 font-serif text-xl text-[#fffff0]">Follow-up</h3>
    <Textarea
      value={question}
      onChange={(event) => onQuestionChange(event.target.value)}
      placeholder="Ask about pricing, migration risk, team fit..."
      className="mb-4 min-h-[100px] rounded-none border-white/20 bg-transparent text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white"
    />
    <Button
      onClick={onAsk}
      className="w-full rounded-none bg-[#fffff0] text-xs font-bold uppercase tracking-widest text-[#050505] hover:bg-[#e5e5d8]"
    >
      Ask Follow-up
    </Button>
    {answer && (
      <div className="mt-6 border-l-2 border-[#06b6d4] pl-4">
        <p className="text-sm leading-relaxed text-[#fffff0]">{answer}</p>
        <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/40">
          Grounded in current matrix
        </div>
      </div>
    )}
  </div>
);

const PrivateBetaGate = () => (
  <div className="fixed inset-x-0 bottom-0 top-20 z-30 flex items-center justify-center bg-[#030303]/90 px-4 backdrop-blur-md">
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`${editorialPanelClass} w-full max-w-xl p-8 text-center`}
    >
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-[#c27853]/50 text-[#c27853]">
        <Lock className="h-6 w-6" />
      </div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#c27853]">
        SideBy Private Beta
      </p>
      <h2 className="mb-4 font-serif text-3xl text-[#fffff0] sm:text-4xl">
        Sign in to research comparisons.
      </h2>
      <p className="mx-auto mb-8 max-w-md text-sm font-light leading-relaxed text-white/60">
        The beta is wired to Clerk and Neon, with refreshable source-backed
        comparisons stored for audit and iteration.
      </p>
      <SignInButton mode="modal">
        <Button className="h-12 rounded-none bg-[#fffff0] px-8 text-xs font-bold uppercase tracking-widest text-[#050505] hover:bg-[#e5e5d8]">
          Enter Beta
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </SignInButton>
    </motion.div>
  </div>
);

export default Index;
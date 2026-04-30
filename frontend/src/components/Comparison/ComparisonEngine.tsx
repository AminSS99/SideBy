import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { colors } from "@/config/brand";
import { resolveLogo } from "@/lib/logos";
import { ShareButton } from "@/components/ShareModal";

type EntityKey = "a" | "b";

type Entity = {
  name: string;
  subtitle: string;
  mark: string;
  hex: string;
  logoUrl?: string;
};

type ComparisonFact = {
  entity: EntityKey;
  label: string;
  value: string;
  source: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
  freshness: "Fresh" | "Monitor" | "Stable";
  changed?: boolean;
  previousValue?: string;
};

type Category = {
  name: string;
  winner: "a" | "b" | "tie";
  verdict: string;
  facts: ComparisonFact[];
};

type ComparisonData = {
  slug: string;
  query: string;
  context: string;
  entities: { a: Entity; b: Entity };
  sourceCount: number;
  updatedAt: string;
  verdict: {
    bestOverall: string;
    bestValue: string;
    developers: string;
    teams: string;
    students: string;
    powerUsers: string;
    ecosystem?: string;
    summary: string;
  };
  categories: Category[];
  sources: ComparisonSource[];
};

type ComparisonSource = {
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

type ResearchStep = {
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Sharp, editorial panel styling
const panelClass = "border border-[#2a2a2a] bg-[#0c0b0a] rounded-sm";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const stagger = (index: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: index * 0.06, ease: "easeOut" },
});

// ─── Research Loading Screen ───────────────────────────────────────────────

export const ResearchLoader = ({
  query,
  progress,
  activeStep,
  steps,
}: {
  query: string;
  progress: number;
  activeStep: number;
  steps: ResearchStep[];
}) => (
  <motion.div {...fadeIn} className={`${panelClass} min-h-[500px] p-8 lg:p-12 shadow-2xl`}>
    <div className="mb-12 flex flex-col gap-4 border-b border-[#2a2a2a] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
          SideBy Research Engine
        </p>
        <h2 className="mt-4 font-serif text-3xl text-[#fdfbf7] lg:text-5xl tracking-tight">
          {query}
        </h2>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-serif text-5xl font-light text-orange-500 tabular-nums">
          {progress}
        </span>
        <span className="mb-2 text-sm text-[#fdfbf7]/40">%</span>
      </div>
    </div>

    <div className="mb-10">
      <div className="h-0.5 w-full bg-[#2a2a2a] overflow-hidden">
        <motion.div
          className="h-full bg-orange-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>

    <div className="grid gap-4 font-sans text-sm">
      {steps.map((step, index) => {
        const visible = index <= activeStep;
        const isActive = index === activeStep;
        return (
          <motion.div
            key={step.label}
            className={cn(
              "flex items-center gap-4 px-2 py-2 transition-colors",
              isActive && "bg-[#1a1512] border-l-2 border-orange-600",
              !isActive && "border-l-2 border-transparent"
            )}
            animate={{ opacity: visible ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
          >
            <span className="w-7 text-[#fdfbf7]/30 tabular-nums text-xs font-serif italic">
              {String(index + 1).padStart(2, "0")}
            </span>
            <step.icon
              className={cn(
                "h-4 w-4",
                isActive ? "text-orange-500" : "text-[#fdfbf7]/30",
              )}
            />
            <div className="flex-1">
              <span className={cn(isActive ? "text-orange-400 font-medium" : "text-[#fdfbf7]/80")}>
                {step.label}
              </span>
            </div>
            {isActive && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-orange-500"
              >
                ▍
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);

// ─── Comparison Header ─────────────────────────────────────────────────────

export const ComparisonHeader = ({
  result,
  onRefresh,
  comparisonId,
}: {
  result: ComparisonData;
  onRefresh: () => void;
  comparisonId?: string | null;
}) => (
  <motion.div {...fadeIn}>
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Fresh {result.updatedAt}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
          {result.sourceCount} verified sources
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ShareButton
          entityA={result.entities.a.name}
          entityB={result.entities.b.name}
          slug={result.slug}
          comparisonId={comparisonId}
          className="rounded-sm border border-[#2a2a2a] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#444] text-[#fdfbf7]"
        />
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-sm border border-[#2a2a2a] bg-[#111] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fdfbf7] transition-all hover:bg-[#1a1a1a] hover:border-[#444]"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <div className="mb-8 flex flex-col md:flex-row md:items-baseline md:justify-between">
      <h2 className="font-serif text-5xl text-[#fdfbf7] sm:text-6xl md:text-7xl leading-none tracking-tight">
        <span style={{ color: colors.entityA }}>
          {result.entities.a.name}
        </span>
        <span className="mx-4 font-serif italic font-light text-[#fdfbf7]/30 text-4xl sm:text-5xl">
          vs
        </span>
        <span style={{ color: colors.entityB }}>
          {result.entities.b.name}
        </span>
      </h2>
    </div>

    <div className="mb-12 border-l-2 border-orange-600 pl-6 py-2">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-500">
        Executive Verdict
      </p>
      <p className="max-w-3xl text-lg leading-relaxed text-[#fdfbf7]/90 font-serif">
        {result.verdict.summary}
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <EntityCard entity={result.entities.a} side="a" />
      <EntityCard entity={result.entities.b} side="b" />
    </div>
  </motion.div>
);

// ─── Entity Card ───────────────────────────────────────────────────────────

export const EntityCard = ({
  entity,
  side,
}: {
  entity: Entity;
  side: "a" | "b";
}) => {
  const accentColor = side === "a" ? colors.entityA : colors.entityB;
  const logo = resolveLogo(entity.name);
  return (
    <div
      className={`${panelClass} overflow-hidden border-t-2 p-8`}
      style={{ borderTopColor: accentColor }}
    >
      <div className="mb-6 flex items-center gap-5">
        {logo ? (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-sm overflow-hidden bg-[#1a1a1a] border border-[#333]"
          >
            <img
              src={logo.url}
              alt={entity.name}
              className="h-8 w-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-serif text-2xl" style="color:${accentColor}">${entity.mark}</span>`;
              }}
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-sm border font-serif text-2xl"
            style={{
              borderColor: `${accentColor}40`,
              background: `${accentColor}10`,
              color: accentColor,
            }}
          >
            {entity.mark}
          </div>
        )}
        <div>
          <p className="font-serif text-2xl text-[#fdfbf7]">{entity.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 mt-1">
            {entity.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#2a2a2a] bg-[#2a2a2a]">
        {["Pricing", "Docs", "Capabilities", "Ecosystem"].map((label) => (
          <div key={label} className="bg-[#0c0b0a] p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">
              {label}
            </p>
            <p className="text-xs font-semibold text-emerald-500">
              Verified
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Category Section ──────────────────────────────────────────────────────

export const CategorySection = ({
  category,
  entities,
  index,
}: {
  category: Category;
  entities: ComparisonData["entities"];
  index: number;
}) => {
  const winnerEntity =
    category.winner === "tie" ? null : entities[category.winner];
  const winnerColor =
    category.winner === "a"
      ? colors.entityA
      : category.winner === "b"
        ? colors.entityB
        : null;

  return (
    <motion.article
      {...stagger(index)}
      className="border-t border-[#2a2a2a] pt-12"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-serif text-3xl text-[#fdfbf7] tracking-tight">{category.name}</h3>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#fdfbf7]/70 font-serif">
            {category.verdict}
          </p>
        </div>
        {winnerEntity && (
          <span
            className="flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{
              borderColor: winnerColor || '#fff',
              color: winnerColor || '#fff',
            }}
          >
            <CrownIcon className="h-3 w-3" />
            {winnerEntity.name} leads
          </span>
        )}
        {category.winner === "tie" && (
          <span className="flex items-center gap-2 whitespace-nowrap border-b-2 border-[#555] px-1 py-1 text-[11px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
            <span className="text-sm font-serif">⚖</span>
            Tied
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {category.facts.map((fact) => (
          <FactCard
            key={`${fact.entity}-${fact.label}`}
            fact={fact}
            entity={entities[fact.entity]}
          />
        ))}
      </div>
    </motion.article>
  );
};

// ─── Fact Card ─────────────────────────────────────────────────────────────

export const FactCard = ({
  fact,
  entity,
}: {
  fact: ComparisonFact;
  entity: Entity;
}) => (
  <motion.div
    className={`rounded-sm border-t-2 p-6 transition-colors bg-[#111] ${
      fact.changed
        ? "bg-[#1a1510] border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.1)]"
        : "border-[#2a2a2a]"
    }`}
    style={{ borderTopColor: fact.changed ? "#ea580c" : entity.hex }}
    whileHover={{ scale: 1.01 }}
  >
    <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#2a2a2a] pb-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: entity.hex }}>
          {entity.name}
        </p>
        <p className="text-sm font-serif text-[#fdfbf7] mt-1">{fact.label}</p>
      </div>
      <ConfidenceGauge value={fact.confidence} color={entity.hex} />
    </div>

    <p className="mb-5 text-sm leading-relaxed text-[#fdfbf7]/80">{fact.value}</p>

    {fact.changed && fact.previousValue && (
      <div className="mb-5 border-l-2 border-[#444] pl-3 py-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-1">Previously</p>
        <p className="text-xs text-[#fdfbf7]/50 line-through">{fact.previousValue}</p>
      </div>
    )}

    <div className="flex flex-wrap gap-2 pt-2">
      <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#0c0b0a] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
        <SourcePin className="h-2.5 w-2.5" />
        {fact.source}
      </span>
      <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#0c0b0a] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
        <FreshnessDot freshness={fact.freshness} />
        {fact.freshness}
      </span>
      {fact.changed && (
        <span className="inline-flex items-center gap-1.5 border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-orange-400">
          Updated
        </span>
      )}
    </div>
  </motion.div>
);

// ─── Confidence Gauge ──────────────────────────────────────────────────────

const ConfidenceGauge = ({
  value,
  color,
}: {
  value: number;
  color: string;
}) => (
  <div className="flex flex-col items-end gap-1">
    <span className="text-[10px] font-bold tabular-nums text-[#fdfbf7]/50 uppercase tracking-widest">
      {Math.round(value * 100)}% Conf
    </span>
    <div className="h-0.5 w-12 bg-[#2a2a2a]">
      <motion.div
        className="h-full"
        style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  </div>
);

// ─── Freshness Dot ─────────────────────────────────────────────────────────

const FreshnessDot = ({ freshness }: { freshness: string }) => {
  const color =
    freshness === "Fresh"
      ? "bg-emerald-500"
      : freshness === "Monitor"
        ? "bg-amber-500"
        : "bg-[#555]";
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
};

// ─── Verdict Panel ─────────────────────────────────────────────────────────

export const VerdictPanel = ({ result }: { result: ComparisonData }) => {
  const rows = [
    { label: "Best Overall", value: result.verdict.bestOverall, key: "bestOverall" },
    { label: "Best Value", value: result.verdict.bestValue, key: "bestValue" },
    { label: "Developers", value: result.verdict.developers, key: "developers" },
    { label: "Teams", value: result.verdict.teams, key: "teams" },
    { label: "Students", value: result.verdict.students, key: "students" },
    { label: "Power Users", value: result.verdict.powerUsers, key: "powerUsers" },
    { label: "Ecosystem", value: result.verdict.ecosystem || "Depends on stack", key: "ecosystem" },
  ];

  return (
    <div className={`${panelClass} p-8`}>
      <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7] tracking-tight">Decision Matrix</h3>
      <div className="divide-y divide-[#2a2a2a] border-y border-[#2a2a2a]">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between py-3.5"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
              {row.label}
            </span>
            <span className="text-sm font-medium text-[#fdfbf7]/90">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Sources Panel ─────────────────────────────────────────────────────────

export const SourcesPanel = ({
  sources,
}: {
  sources: ComparisonSource[];
}) => (
  <div className={`${panelClass} p-8`}>
    <div className="mb-6 flex items-center justify-between">
      <h3 className="font-serif text-2xl text-[#fdfbf7] tracking-tight">Sources</h3>
      <span className="border border-[#333] bg-[#111] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
        Verified
      </span>
    </div>

    <div className="space-y-4">
      {sources.map((source) => (
        <a
          key={source.title}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group block border-b border-[#2a2a2a] pb-4 last:border-0 last:pb-0 transition-all hover:pl-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-sm font-medium text-[#fdfbf7]/80 group-hover:text-orange-400 transition-colors">
                {source.title}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {source.reliability}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                  {source.fetchedAt}
                </span>
              </div>
            </div>
            <svg className="h-4 w-4 flex-none text-[#fdfbf7]/20 group-hover:text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  </div>
);

// ─── Follow-up Panel ───────────────────────────────────────────────────────

export const FollowUpPanel = ({
  question,
  answer,
  onQuestionChange,
  onAsk,
}: {
  question: string;
  answer: string;
  onQuestionChange: (v: string) => void;
  onAsk: () => void;
}) => (
  <div className={`${panelClass} p-8`}>
    <h3 className="mb-5 font-serif text-2xl text-[#fdfbf7] tracking-tight">Ask Follow-up</h3>
    <textarea
      value={question}
      onChange={(e) => onQuestionChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onAsk();
        }
      }}
      placeholder="Ask about pricing, migration risk, team fit..."
      className="mb-4 min-h-[120px] w-full resize-none rounded-sm border border-[#333] bg-[#080808] p-4 text-sm text-[#fdfbf7] placeholder:text-[#fdfbf7]/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
    />
    <button
      onClick={onAsk}
      className="w-full rounded-sm bg-[#fdfbf7] px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]"
    >
      Submit Inquiry
    </button>
    {answer && (
      <div className="mt-6 border-l-2 border-orange-500 bg-[#15110d] p-5">
        <p className="text-sm leading-relaxed text-[#fdfbf7]/90 font-serif">{answer}</p>
        <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-orange-500/60">
          Grounded in current matrix
        </div>
      </div>
    )}
  </div>
);

// ─── Mini Icons ────────────────────────────────────────────────────────────

const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zM3 20h18" />
  </svg>
);

const SourcePin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export type { ComparisonData, ComparisonFact, Category, ComparisonSource, EntityKey, Entity, ResearchStep };
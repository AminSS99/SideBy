import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileSearch,
  FolderKanban,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { usePageTitle } from "@/hooks/usePageTitle";

type DocArticle = {
  id: string;
  category: "Get started" | "Research" | "Organize" | "Trust";
  title: string;
  summary: string;
  steps: string[];
};

const articles: DocArticle[] = [
  {
    id: "first-comparison",
    category: "Get started",
    title: "Run your first comparison",
    summary: "Turn a plain-language question into a structured, source-backed result.",
    steps: [
      "Open your dashboard and choose New comparison.",
      "Name two clear options, then add the decision context that matters to you.",
      "Review the proposed dimensions and start the research run.",
      "Use the evidence drawer to inspect the source behind each important claim.",
    ],
  },
  {
    id: "strong-query",
    category: "Get started",
    title: "Write a stronger comparison query",
    summary: "Give SideBy enough context to research the decision you actually need to make.",
    steps: [
      "Name both options explicitly: for example, “Linear vs Jira”.",
      "Add your use case, team size, budget, or constraints.",
      "Avoid asking for a fact with no decision attached; describe what winning means.",
    ],
  },
  {
    id: "read-result",
    category: "Research",
    title: "Read scores without losing the nuance",
    summary: "Understand how dimensions, confidence, citations, and the verdict work together.",
    steps: [
      "Start with the verdict, then check which assumptions it depends on.",
      "Compare dimension scores as directional summaries—not universal truth.",
      "Open cited evidence before acting on a high-impact or time-sensitive claim.",
      "Use a follow-up question when your constraints differ from the original brief.",
    ],
  },
  {
    id: "sources",
    category: "Research",
    title: "How SideBy handles sources",
    summary: "See how search, extraction, fact checks, and citation links shape a result.",
    steps: [
      "SideBy searches for relevant public sources for each comparison.",
      "Extracted facts are de-duplicated and attached to the dimensions they support.",
      "Every source can still be incomplete or outdated, so confidence and publication date matter.",
    ],
  },
  {
    id: "projects",
    category: "Organize",
    title: "Keep research inside projects",
    summary: "Group related comparisons so a decision trail stays easy to revisit.",
    steps: [
      "Create or select a workspace from the app switcher.",
      "Create a project for a customer, launch, purchase, or research theme.",
      "Move related comparisons into that project and use descriptive titles.",
    ],
  },
  {
    id: "exports",
    category: "Organize",
    title: "Export and share a result",
    summary: "Take a comparison into a brief, handoff, or downstream workflow.",
    steps: [
      "Open a completed comparison and choose Export.",
      "Use Markdown for a readable brief or JSON for a structured handoff.",
      "Keep citation links with the exported claims so reviewers can verify them.",
    ],
  },
  {
    id: "usage-limits",
    category: "Trust",
    title: "Understand usage limits",
    summary: "Know what happens when a research action reaches the current plan allowance.",
    steps: [
      "The free plan currently includes 5 comparisons per day.",
      "Follow-ups, refreshes, and exports have separate daily allowances.",
      "When a limit is reached, SideBy pauses that action and tells you when to retry.",
    ],
  },
  {
    id: "privacy",
    category: "Trust",
    title: "Account and research privacy",
    summary: "A practical view of access, authentication, and sensitive information.",
    steps: [
      "Authenticated app routes require a valid SideBy account.",
      "Provider credentials stay on the server and are never shipped to the browser.",
      "Do not place secrets, regulated records, or private credentials in a comparison prompt.",
      "Read the privacy policy for the current legal terms that govern your data.",
    ],
  },
];

const categoryMeta = {
  "Get started": { icon: Sparkles, tone: "text-orange-200 bg-orange-400/10 border-orange-300/20" },
  Research: { icon: FileSearch, tone: "text-sky-200 bg-sky-400/10 border-sky-300/20" },
  Organize: { icon: FolderKanban, tone: "text-violet-200 bg-violet-400/10 border-violet-300/20" },
  Trust: { icon: ShieldCheck, tone: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20" },
} satisfies Record<DocArticle["category"], { icon: typeof Sparkles; tone: string }>;

const categories = Object.keys(categoryMeta) as DocArticle["category"][];

const Docs = () => {
  usePageTitle("Docs");
  const pageRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DocArticle["category"] | "All">("All");
  const [openArticle, setOpenArticle] = useState<string>("first-comparison");

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatches = category === "All" || article.category === category;
      const queryMatches =
        normalizedQuery.length === 0 ||
        [article.title, article.summary, article.category, ...article.steps]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;
      gsap.from(".docs-reveal", {
        y: 28,
        duration: 0.75,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform",
      });
    },
    { scope: pageRef },
  );

  return (
    <div ref={pageRef} className="min-h-screen overflow-hidden bg-[#060504] text-[#fdfbf7] selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(249,115,22,0.18),transparent_36%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,52px_52px,52px_52px]" />
      <MarketingNav />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <section className="docs-reveal overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] px-5 py-8 shadow-2xl shadow-orange-950/20 sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1fr_0.72fr] lg:items-end lg:gap-12 lg:px-14 lg:py-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
              <BookOpen className="h-3.5 w-3.5" /> SideBy field guide
            </div>
            <h1 className="max-w-3xl font-serif text-[2.65rem] leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Get from question to <span className="bg-gradient-to-r from-orange-200 via-amber-100 to-rose-200 bg-clip-text text-transparent">confident decision.</span>
            </h1>
          </div>
          <div className="mt-6 lg:mt-0">
            <p className="max-w-xl text-base leading-7 text-white/58">
              Practical answers for researching, checking evidence, organizing work, and understanding your SideBy account.
            </p>
            <Link to="/dashboard" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300">
              Open your workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="docs-reveal sticky top-16 z-20 -mx-4 mt-6 border-y border-white/10 bg-[#060504]/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mt-8 sm:rounded-2xl sm:border sm:bg-white/[0.035] sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              aria-label="Search SideBy documentation"
              placeholder="Search SideBy documentation"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-[16px] text-white outline-none transition placeholder:text-white/35 focus:border-orange-300/50 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filter documentation by category">
            {(["All", ...categories] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                  category === item ? "border-orange-300/40 bg-orange-400/15 text-orange-100" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.72fr_1.8fr] lg:items-start">
          <aside className="docs-reveal rounded-2xl border border-white/10 bg-white/[0.025] p-5 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Start here</p>
            <h2 className="mt-3 font-serif text-2xl text-white">A five-minute first run</h2>
            <ol className="mt-5 space-y-4">
              {["Describe the decision", "Review the dimensions", "Check cited evidence"].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-white/60">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-300/20 bg-orange-400/10 text-xs font-bold text-orange-200">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Gauge className="h-4 w-4" /> Research is a process</div>
              <p className="mt-2 text-xs leading-5 text-white/45">Treat scores as a map. The citations are where you verify the terrain.</p>
            </div>
          </aside>

          <section className="docs-reveal" aria-live="polite">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200/70">Documentation</p>
                <h2 className="mt-2 font-serif text-3xl text-white">{filteredArticles.length} {filteredArticles.length === 1 ? "answer" : "answers"}</h2>
              </div>
              {(query || category !== "All") && (
                <button type="button" onClick={() => { setQuery(""); setCategory("All"); }} className="min-h-10 text-xs font-semibold text-white/50 underline decoration-white/20 underline-offset-4 hover:text-white">
                  Clear filters
                </button>
              )}
            </div>

            {filteredArticles.length > 0 ? (
              <div className="space-y-3">
                {filteredArticles.map((article) => {
                  const isOpen = openArticle === article.id;
                  const meta = categoryMeta[article.category];
                  const Icon = meta.icon;
                  return (
                    <article key={article.id} className={`overflow-hidden rounded-2xl border transition ${isOpen ? "border-orange-300/25 bg-white/[0.055]" : "border-white/10 bg-white/[0.025] hover:border-white/20"}`}>
                      <button
                        type="button"
                        onClick={() => setOpenArticle(isOpen ? "" : article.id)}
                        aria-expanded={isOpen}
                        aria-controls={`${article.id}-content`}
                        className="flex min-h-[84px] w-full items-start gap-3 p-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300 sm:items-center sm:gap-4 sm:p-5"
                      >
                        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:mt-0 ${meta.tone}`}><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">{article.category}</span>
                          <span className="mt-1 block text-base font-semibold text-white sm:text-lg">{article.title}</span>
                          <span className="mt-1 block text-sm leading-5 text-white/48">{article.summary}</span>
                        </span>
                        <ChevronDown className={`mt-2 h-5 w-5 shrink-0 text-white/40 transition-transform sm:mt-0 ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div id={`${article.id}-content`} className="border-t border-white/8 px-4 pb-5 pt-4 sm:pl-[5.75rem] sm:pr-8">
                          <ol className="space-y-3">
                            {article.steps.map((step) => (
                              <li key={step} className="flex gap-3 text-sm leading-6 text-white/64">
                                <Check className="mt-1 h-4 w-4 shrink-0 text-orange-300" /> {step}
                              </li>
                            ))}
                          </ol>
                          {article.id === "privacy" && <Link to="/legal/privacy" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-200 hover:text-orange-100">Read privacy policy <ArrowRight className="h-4 w-4" /></Link>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-14 text-center">
                <Search className="mx-auto h-7 w-7 text-white/25" />
                <h3 className="mt-4 font-serif text-2xl text-white">No matching answer yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Try a broader phrase, clear the category filter, or send the question to the SideBy team.</p>
                <Link to="/contact" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white hover:bg-white/5">Ask a question</Link>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <BrandFooter />
          <div className="flex gap-6">
            <Link to="/legal/privacy" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Privacy</Link>
            <Link to="/legal/terms" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Docs;

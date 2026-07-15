import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, BookOpen, Check, ChevronDown, Clock3, Compass, Search } from "lucide-react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { usePageTitle } from "@/hooks/usePageTitle";

type NoteCategory = "Decision craft" | "Research systems" | "Inside SideBy";

type FieldNote = {
  id: string;
  number: string;
  title: string;
  excerpt: string;
  category: NoteCategory;
  readTime: string;
  takeaways: string[];
};

const fieldNotes: FieldNote[] = [
  {
    id: "decision-brief",
    number: "01",
    title: "The comparison is only as good as the decision brief",
    excerpt: "Why “A vs B” is a search query, not yet a useful decision question.",
    category: "Decision craft",
    readTime: "4 min",
    takeaways: [
      "Name the use case before you name the winner.",
      "Put hard constraints—budget, timeline, compliance, team skill—into the prompt.",
      "Separate must-haves from preferences so a small advantage does not outweigh a blocker.",
      "Re-run the decision when the constraints change; the old verdict may no longer fit.",
    ],
  },
  {
    id: "citations",
    number: "02",
    title: "A citation is a starting point, not a trust badge",
    excerpt: "A practical way to read source-backed AI without switching off your judgment.",
    category: "Research systems",
    readTime: "5 min",
    takeaways: [
      "Check whether the source actually supports the nearby claim.",
      "Prefer current primary documentation for capabilities, limits, and pricing.",
      "Treat confidence as a signal about evidence quality—not a guarantee of truth.",
      "Verify high-impact claims independently before a purchase, migration, or policy decision.",
    ],
  },
  {
    id: "scores",
    number: "03",
    title: "Scores compress nuance. Use them like a map",
    excerpt: "How to get the speed of a matrix without pretending every trade-off is objective.",
    category: "Decision craft",
    readTime: "4 min",
    takeaways: [
      "Look at the weighting behind the total before comparing totals.",
      "A narrow score difference often means the decision is sensitive to assumptions.",
      "Read the evidence for the two or three dimensions that can reverse the verdict.",
      "Use a follow-up question to test a different scenario instead of forcing one answer to fit all.",
    ],
  },
  {
    id: "pipeline",
    number: "04",
    title: "What happens during a SideBy research run",
    excerpt: "The eight-stage pipeline behind search, evidence, scoring, and the final verdict.",
    category: "Inside SideBy",
    readTime: "6 min",
    takeaways: [
      "The query is parsed into entities and dimensions before research begins.",
      "Search and extraction collect candidate evidence from public sources.",
      "Facts are de-duplicated, attached to dimensions, and used to score both options.",
      "The verdict is generated last, after the research structure is assembled.",
    ],
  },
  {
    id: "refresh",
    number: "05",
    title: "When to refresh a comparison—and when not to",
    excerpt: "A simple rule for keeping research current without treating freshness as accuracy.",
    category: "Research systems",
    readTime: "3 min",
    takeaways: [
      "Refresh when pricing, product capabilities, or policy may have changed.",
      "Do not refresh merely because the verdict is inconvenient; change the brief if your context changed.",
      "Compare new evidence with the previous version to see what actually moved.",
    ],
  },
  {
    id: "failure",
    number: "06",
    title: "A research failure should fail visibly",
    excerpt: "Why honest limits, retries, and missing evidence make an AI product more useful.",
    category: "Inside SideBy",
    readTime: "4 min",
    takeaways: [
      "A partial result should not masquerade as a complete one.",
      "Rate limits and retry states need a clear next action, not a generic error.",
      "Missing evidence is information: it tells the user which conclusion needs manual research.",
    ],
  },
];

const categories = ["All", "Decision craft", "Research systems", "Inside SideBy"] as const;

const Blog = () => {
  usePageTitle("Field Notes");
  const pageRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [activePost, setActivePost] = useState<string>("decision-brief");

  const visibleNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return fieldNotes.filter((note) => {
      const categoryMatches = category === "All" || note.category === category;
      const queryMatches = !normalizedQuery || [note.title, note.excerpt, note.category, ...note.takeaways].join(" ").toLowerCase().includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".notes-reveal", { y: 28, duration: 0.75, stagger: 0.08, ease: "power3.out", clearProps: "transform" });
    },
    { scope: pageRef },
  );

  return (
    <div ref={pageRef} className="min-h-screen overflow-hidden bg-[#060504] text-[#fdfbf7] selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.14),transparent_34%),radial-gradient(circle_at_8%_65%,rgba(139,92,246,0.08),transparent_28%),linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:auto,auto,52px_52px,52px_52px]" />
      <MarketingNav />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <section className="notes-reveal grid gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-9 shadow-2xl shadow-orange-950/20 sm:px-10 sm:py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:px-14 lg:py-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
              <BookOpen className="h-3.5 w-3.5" /> SideBy field notes
            </div>
            <h1 className="max-w-4xl font-serif text-[2.75rem] leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Better research habits for <span className="bg-gradient-to-r from-orange-200 via-amber-100 to-rose-200 bg-clip-text text-transparent">hard choices.</span>
            </h1>
          </div>
          <div>
            <p className="text-base leading-7 text-white/58">Short, practical notes about evidence, scoring, AI research systems, and the craft of asking a better comparison question.</p>
            <Link to="/docs" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-orange-200 hover:text-orange-100">Browse the field guide <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="notes-reveal sticky top-16 z-20 -mx-4 mt-6 border-y border-white/10 bg-[#060504]/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mt-8 sm:rounded-2xl sm:border sm:bg-white/[0.035] sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" aria-label="Search field notes" placeholder="Search field notes" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-4 text-[16px] text-white outline-none transition placeholder:text-white/30 focus:border-orange-300/50 focus:ring-4 focus:ring-orange-500/10" />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filter field notes by topic">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${category === item ? "border-orange-300/40 bg-orange-400/15 text-orange-100" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"}`}>{item}</button>
            ))}
          </div>
        </section>

        <section className="notes-reveal mt-8" aria-live="polite">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">The notebook</p>
              <h2 className="mt-2 font-serif text-3xl text-white">{visibleNotes.length} {visibleNotes.length === 1 ? "note" : "notes"}</h2>
            </div>
            {(category !== "All" || query) && <button type="button" onClick={() => { setCategory("All"); setQuery(""); }} className="min-h-10 text-xs font-semibold text-white/50 underline decoration-white/20 underline-offset-4 hover:text-white">Clear filters</button>}
          </div>

          {visibleNotes.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleNotes.map((note) => {
                const isActive = activePost === note.id;
                return (
                  <article key={note.id} className={`overflow-hidden rounded-2xl border transition ${isActive ? "border-orange-300/25 bg-white/[0.055]" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}>
                    <button type="button" onClick={() => setActivePost(isActive ? "" : note.id)} aria-expanded={isActive} aria-controls={`${note.id}-body`} className="flex min-h-[190px] w-full flex-col p-5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300 sm:p-6">
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">{note.category}</span>
                        <span className="flex items-center gap-1.5 text-[11px] text-white/30"><Clock3 className="h-3.5 w-3.5" /> {note.readTime}</span>
                      </div>
                      <div className="mt-8 flex w-full items-start gap-4">
                        <span className="font-mono text-xs text-orange-200/55">{note.number}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif text-2xl leading-tight text-white sm:text-[1.7rem]">{note.title}</span>
                          <span className="mt-3 block text-sm leading-6 text-white/48">{note.excerpt}</span>
                        </span>
                        <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-white/35 transition-transform ${isActive ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {isActive && (
                      <div id={`${note.id}-body`} className="border-t border-white/8 px-5 pb-6 pt-5 sm:px-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200/65">Key takeaways</p>
                        <ul className="space-y-3">
                          {note.takeaways.map((takeaway) => <li key={takeaway} className="flex gap-3 text-sm leading-6 text-white/62"><Check className="mt-1 h-4 w-4 shrink-0 text-orange-300" />{takeaway}</li>)}
                        </ul>
                        <Link to="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 px-5 text-xs font-semibold text-white transition hover:bg-white/5">Put it into practice <ArrowRight className="h-4 w-4" /></Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-14 text-center">
              <Compass className="mx-auto h-7 w-7 text-white/25" />
              <h3 className="mt-4 font-serif text-2xl text-white">No note matches that search</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Try a broader phrase or clear the topic filter.</p>
            </div>
          )}
        </section>
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

export default Blog;

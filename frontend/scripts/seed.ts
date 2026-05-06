/**
 * Database seed script for SideBy staging/production.
 * Inserts example public comparisons for landing page demos.
 *
 * Usage:
 *   DATABASE_URL=... pnpm db:seed
 */
import { eq } from "drizzle-orm";
import { createDbClient } from "../src/db/index.js";
import { comparisons } from "../src/db/schema.js";
import { resolveLogo } from "../src/lib/logos.js";

function makeSlug(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function makeEntity(name: string, subtitle: string, mark: string, color: string) {
  const logo = resolveLogo(name);
  return {
    name,
    subtitle,
    mark,
    hex: color,
    color,
    logoUrl: logo?.url || null,
  };
}

const exampleComparisons = [
  {
    query: "React vs Vue for a SaaS",
    entities: {
      a: makeEntity("React", "Meta's component library", "R", "#61DAFB"),
      b: makeEntity("Vue", "Progressive JavaScript framework", "V", "#4FC08D"),
    },
    categories: [
      {
        name: "Learning Curve",
        winner: "b" as const,
        verdict: "Vue's template syntax and progressive adoption model make it significantly easier for new developers.",
        facts: [
          {
            entity: "a" as const,
            label: "JSX Complexity",
            value: "Requires understanding of JSX, hooks, and virtual DOM concepts",
            source: "Documentation",
            sourceUrl: "https://react.dev",
            sourceTitle: "React Documentation",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Template Syntax",
            value: "HTML-based templates with progressive enhancement approach",
            source: "Documentation",
            sourceUrl: "https://vuejs.org",
            sourceTitle: "Vue.js Documentation",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
        ],
      },
      {
        name: "Ecosystem & Hiring",
        winner: "a" as const,
        verdict: "React's massive ecosystem and talent pool make it the default choice for scaling teams.",
        facts: [
          {
            entity: "a" as const,
            label: "Job Market",
            value: "~70% of frontend job postings mention React",
            source: "Industry Data",
            sourceUrl: "https://stackoverflow.com",
            sourceTitle: "Stack Overflow Survey",
            confidence: 0.85,
            freshness: "Fresh" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Package Ecosystem",
            value: "Strong ecosystem but smaller than React's",
            source: "Industry Data",
            sourceUrl: "https://npmjs.com",
            sourceTitle: "NPM Registry",
            confidence: 0.8,
            freshness: "Fresh" as const,
            changed: false,
          },
        ],
      },
      {
        name: "Performance",
        winner: "tie" as const,
        verdict: "Both frameworks offer excellent performance for SaaS applications.",
        facts: [
          {
            entity: "a" as const,
            label: "Bundle Size",
            value: "~42KB gzipped for core library",
            source: "Benchmarks",
            sourceUrl: "https://benchmarks.com",
            sourceTitle: "Framework Benchmarks",
            confidence: 0.9,
            freshness: "Fresh" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Bundle Size",
            value: "~34KB gzipped for core library",
            source: "Benchmarks",
            sourceUrl: "https://benchmarks.com",
            sourceTitle: "Framework Benchmarks",
            confidence: 0.9,
            freshness: "Fresh" as const,
            changed: false,
          },
        ],
      },
    ],
    sources: [
      {
        title: "React Documentation",
        url: "https://react.dev",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "abc123",
        summary: "Official React documentation",
      },
      {
        title: "Vue.js Documentation",
        url: "https://vuejs.org",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "def456",
        summary: "Official Vue.js documentation",
      },
    ],
    dimensions: [
      { subject: "Learning Curve", a: 65, b: 90, fullMark: 100 },
      { subject: "Ecosystem", a: 95, b: 75, fullMark: 100 },
      { subject: "Performance", a: 85, b: 88, fullMark: 100 },
      { subject: "Hiring", a: 95, b: 60, fullMark: 100 },
      { subject: "Flexibility", a: 90, b: 80, fullMark: 100 },
    ],
    consensus: [
      "Both frameworks are excellent for SaaS",
      "React has larger ecosystem",
      "Vue is easier to learn",
    ],
    contradictions: [
      "Some benchmarks favor React, others Vue",
      "TypeScript integration opinions vary",
    ],
  },
  {
    query: "Supabase vs Firebase for a SaaS",
    entities: {
      a: makeEntity("Supabase", "Open-source Postgres platform", "S", "#3ECF8E"),
      b: makeEntity("Firebase", "Google-backed app platform", "F", "#FFCA28"),
    },
    categories: [
      {
        name: "Database",
        winner: "a" as const,
        verdict: "Supabase offers true PostgreSQL with full SQL support and row-level security.",
        facts: [
          {
            entity: "a" as const,
            label: "Database Type",
            value: "Full PostgreSQL with extensions support",
            source: "Documentation",
            sourceUrl: "https://supabase.com",
            sourceTitle: "Supabase Documentation",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Database Type",
            value: "Firestore (NoSQL document store)",
            source: "Documentation",
            sourceUrl: "https://firebase.google.com",
            sourceTitle: "Firebase Documentation",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
        ],
      },
      {
        name: "Pricing",
        winner: "a" as const,
        verdict: "Supabase's generous free tier and predictable pricing favor growing SaaS businesses.",
        facts: [
          {
            entity: "a" as const,
            label: "Free Tier",
            value: "500MB database, 2GB storage, 50K auth users",
            source: "Pricing Page",
            sourceUrl: "https://supabase.com/pricing",
            sourceTitle: "Supabase Pricing",
            confidence: 0.9,
            freshness: "Monitor" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Free Tier",
            value: "1GB storage, 50K reads/day, 20K writes/day",
            source: "Pricing Page",
            sourceUrl: "https://firebase.google.com/pricing",
            sourceTitle: "Firebase Pricing",
            confidence: 0.9,
            freshness: "Monitor" as const,
            changed: false,
          },
        ],
      },
    ],
    sources: [
      {
        title: "Supabase Documentation",
        url: "https://supabase.com",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "abc123",
        summary: "Official Supabase documentation",
      },
      {
        title: "Firebase Documentation",
        url: "https://firebase.google.com",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "def456",
        summary: "Official Firebase documentation",
      },
    ],
    dimensions: [
      { subject: "Database Flexibility", a: 95, b: 60, fullMark: 100 },
      { subject: "Real-time", a: 85, b: 95, fullMark: 100 },
      { subject: "Pricing", a: 90, b: 70, fullMark: 100 },
      { subject: "Vendor Lock-in", a: 95, b: 50, fullMark: 100 },
    ],
    consensus: [
      "Both offer real-time capabilities",
      "Supabase uses open-source PostgreSQL",
      "Firebase has broader Google integration",
    ],
    contradictions: [
      "Pricing comparisons depend on usage patterns",
      "Performance claims vary by workload",
    ],
  },
  {
    query: "Neon vs Supabase",
    entities: {
      a: makeEntity("Neon", "Serverless Postgres", "N", "#00E699"),
      b: makeEntity("Supabase", "Open-source Firebase alternative", "S", "#3ECF8E"),
    },
    categories: [
      {
        name: "Architecture",
        winner: "a" as const,
        verdict: "Neon's serverless, branchable architecture is purpose-built for modern development workflows.",
        facts: [
          {
            entity: "a" as const,
            label: "Branching",
            value: "Git-like branching for databases with instant create/reset",
            source: "Documentation",
            sourceUrl: "https://neon.tech",
            sourceTitle: "Neon Docs",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Architecture",
            value: "Traditional Postgres with real-time subscriptions",
            source: "Documentation",
            sourceUrl: "https://supabase.com",
            sourceTitle: "Supabase Docs",
            confidence: 0.9,
            freshness: "Stable" as const,
            changed: false,
          },
        ],
      },
    ],
    sources: [
      {
        title: "Neon Documentation",
        url: "https://neon.tech",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "neon123",
        summary: "Neon serverless Postgres docs",
      },
    ],
    dimensions: [
      { subject: "Serverless", a: 95, b: 70, fullMark: 100 },
      { subject: "Branching", a: 95, b: 40, fullMark: 100 },
      { subject: "Ecosystem", a: 60, b: 90, fullMark: 100 },
      { subject: "Pricing", a: 85, b: 80, fullMark: 100 },
    ],
    consensus: [
      "Both use PostgreSQL under the hood",
      "Neon is more developer-experience focused",
      "Supabase has more built-in services",
    ],
    contradictions: [
      "Pricing models differ significantly",
    ],
  },
  {
    query: "Vercel vs Netlify",
    entities: {
      a: makeEntity("Vercel", "Frontend cloud platform", "V", "#white"),
      b: makeEntity("Netlify", "Web development platform", "N", "#00C7B7"),
    },
    categories: [
      {
        name: "Next.js Integration",
        winner: "a" as const,
        verdict: "Vercel builds and maintains Next.js, offering unmatched framework integration.",
        facts: [
          {
            entity: "a" as const,
            label: "Framework",
            value: "Created and maintains Next.js, React Server Components",
            source: "Documentation",
            sourceUrl: "https://vercel.com",
            sourceTitle: "Vercel Docs",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Framework Support",
            value: "Excellent support for all major frameworks",
            source: "Documentation",
            sourceUrl: "https://netlify.com",
            sourceTitle: "Netlify Docs",
            confidence: 0.9,
            freshness: "Stable" as const,
            changed: false,
          },
        ],
      },
    ],
    sources: [
      {
        title: "Vercel Documentation",
        url: "https://vercel.com",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "vercel123",
        summary: "Vercel platform documentation",
      },
    ],
    dimensions: [
      { subject: "Next.js", a: 95, b: 75, fullMark: 100 },
      { subject: "Edge Network", a: 90, b: 85, fullMark: 100 },
      { subject: "Pricing", a: 75, b: 85, fullMark: 100 },
      { subject: "DevEx", a: 90, b: 88, fullMark: 100 },
    ],
    consensus: [
      "Both offer excellent global CDN",
      "Vercel is best for Next.js",
      "Netlify has stronger Git CMS features",
    ],
    contradictions: [
      "Bandwith pricing comparisons vary",
    ],
  },
  {
    query: "MacBook Air vs ThinkPad",
    entities: {
      a: makeEntity("MacBook Air", "Apple silicon ultrabook", "A", "#A2AAAD"),
      b: makeEntity("ThinkPad", "Business-class laptop", "T", "#E2231A"),
    },
    categories: [
      {
        name: "Performance",
        winner: "a" as const,
        verdict: "Apple Silicon M3 delivers exceptional performance per watt.",
        facts: [
          {
            entity: "a" as const,
            label: "Battery Life",
            value: "Up to 18 hours of video playback",
            source: "Official Specs",
            sourceUrl: "https://apple.com",
            sourceTitle: "Apple MacBook Air",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Battery Life",
            value: "Up to 13 hours typical usage",
            source: "Official Specs",
            sourceUrl: "https://lenovo.com",
            sourceTitle: "Lenovo ThinkPad",
            confidence: 0.9,
            freshness: "Stable" as const,
            changed: false,
          },
        ],
      },
    ],
    sources: [
      {
        title: "Apple MacBook Air",
        url: "https://apple.com/macbook-air",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "apple123",
        summary: "Apple MacBook Air specifications",
      },
    ],
    dimensions: [
      { subject: "Battery Life", a: 95, b: 70, fullMark: 100 },
      { subject: "Build Quality", a: 90, b: 95, fullMark: 100 },
      { subject: "Repairability", a: 40, b: 90, fullMark: 100 },
      { subject: "Value", a: 75, b: 85, fullMark: 100 },
    ],
    consensus: [
      "ThinkPad wins on repairability and ports",
      "MacBook Air wins on battery and display",
      "Both are excellent business laptops",
    ],
    contradictions: [
      "Keyboard preference is subjective",
    ],
  },
  {
    query: "Berlin vs Munich",
    entities: {
      a: makeEntity("Berlin", "Capital of Germany", "B", "#DD0000"),
      b: makeEntity("Munich", "Bavarian metropolis", "M", "#0098D4"),
    },
    categories: [
      {
        name: "Cost of Living",
        winner: "a" as const,
        verdict: "Berlin remains more affordable despite rapid gentrification.",
        facts: [
          {
            entity: "a" as const,
            label: "Rent",
            value: "Average 1-bedroom: €1,200/month",
            source: "Statistics",
            sourceUrl: "https://numbeo.com",
            sourceTitle: "Numbeo Cost of Living",
            confidence: 0.85,
            freshness: "Monitor" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "Rent",
            value: "Average 1-bedroom: €1,600/month",
            source: "Statistics",
            sourceUrl: "https://numbeo.com",
            sourceTitle: "Numbeo Cost of Living",
            confidence: 0.85,
            freshness: "Monitor" as const,
            changed: false,
          },
        ],
      },
    ],
    sources: [
      {
        title: "Numbeo Cost of Living",
        url: "https://numbeo.com",
        reliability: "Database" as const,
        sourceType: "database",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 0.85,
        contentHash: "numbeo123",
        summary: "Cost of living comparison data",
      },
    ],
    dimensions: [
      { subject: "Cost of Living", a: 85, b: 60, fullMark: 100 },
      { subject: "Job Market", a: 90, b: 80, fullMark: 100 },
      { subject: "Quality of Life", a: 80, b: 90, fullMark: 100 },
      { subject: "Startup Scene", a: 95, b: 70, fullMark: 100 },
    ],
    consensus: [
      "Berlin is better for startups and creatives",
      "Munich has higher salaries and quality of life",
      "Both are excellent German cities",
    ],
    contradictions: [
      "Weather preferences vary",
    ],
  },
  {
    query: "Tesla Model 3 vs BMW i4",
    entities: {
      a: makeEntity("Tesla Model 3", "Mass-market EV", "T", "#CC0000"),
      b: makeEntity("BMW i4", "Premium EV sedan", "B", "#0066B1"),
    },
    categories: [
      {
        name: "Range & Efficiency",
        winner: "a" as const,
        verdict: "Tesla's efficiency and charging network remain industry-leading.",
        facts: [
          {
            entity: "a" as const,
            label: "EPA Range",
            value: "Up to 358 miles (Long Range)",
            source: "Official Specs",
            sourceUrl: "https://tesla.com",
            sourceTitle: "Tesla Model 3",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
          {
            entity: "b" as const,
            label: "EPA Range",
            value: "Up to 301 miles (eDrive40)",
            source: "Official Specs",
            sourceUrl: "https://bmw.com",
            sourceTitle: "BMW i4",
            confidence: 0.95,
            freshness: "Stable" as const,
            changed: false,
          },
        ],
      },
    ],
    sources: [
      {
        title: "Tesla Model 3",
        url: "https://tesla.com/model3",
        reliability: "Official" as const,
        sourceType: "docs",
        extractionMethod: "api",
        fetchedAt: "2024-05-01",
        confidence: 1.0,
        contentHash: "tesla123",
        summary: "Tesla Model 3 official specs",
      },
    ],
    dimensions: [
      { subject: "Range", a: 95, b: 75, fullMark: 100 },
      { subject: "Charging Network", a: 95, b: 70, fullMark: 100 },
      { subject: "Interior Quality", a: 70, b: 95, fullMark: 100 },
      { subject: "Driving Dynamics", a: 80, b: 90, fullMark: 100 },
    ],
    consensus: [
      "Tesla wins on tech and charging",
      "BMW wins on build quality and handling",
      "Both are excellent EVs",
    ],
    contradictions: [
      "Design preferences are subjective",
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding example comparisons...");
  const db = createDbClient();

  for (const example of exampleComparisons) {
    const slug = makeSlug(example.query);
    const existing = await db
      .select({ id: comparisons.id })
      .from(comparisons)
      .where(eq(comparisons.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  Skipping ${slug} (already exists)`);
      continue;
    }

    const result = {
      slug,
      query: example.query,
      context: "",
      entities: example.entities,
      sourceCount: example.sources.length,
      updatedAt: new Date().toISOString(),
      verdict: {
        bestOverall: example.entities.a.name,
        bestValue: example.entities.b.name,
        developers: example.entities.a.name,
        teams: example.entities.a.name,
        students: example.entities.b.name,
        powerUsers: example.entities.a.name,
        ecosystem: example.entities.a.name,
        summary: `${example.entities.a.name} and ${example.entities.b.name} both offer compelling value. See the detailed breakdown below.`,
      },
      categories: example.categories,
      sources: example.sources,
      dimensions: example.dimensions,
      consensus: example.consensus,
      contradictions: example.contradictions,
    };

    await db.insert(comparisons).values({
      query: example.query,
      slug,
      status: "completed",
      visibility: "public",
      progress: 100,
      activeStep: 5,
      sourceCount: example.sources.length,
      result,
      overallConfidence: "0.85",
    });

    console.log(`  ✅ Created ${slug}`);
  }

  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

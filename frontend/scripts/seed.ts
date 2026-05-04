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

const exampleComparisons = [
  {
    query: "React vs Vue for a SaaS",
    slug: "react-vs-vue-2024",
    result: {
      slug: "react-vs-vue-2024",
      query: "React vs Vue for a SaaS",
      context: "for a SaaS product",
      entities: {
        a: {
          name: "React",
          subtitle: "Meta's component library",
          mark: "R",
          color: "#61DAFB",
          hex: "#61DAFB",
          logoUrl: "https://cdn.simpleicons.org/react/61DAFB",
        },
        b: {
          name: "Vue",
          subtitle: "Progressive JavaScript framework",
          mark: "V",
          color: "#4FC08D",
          hex: "#4FC08D",
          logoUrl: "https://cdn.simpleicons.org/vuedotjs/4FC08D",
        },
      },
      sourceCount: 12,
      updatedAt: "2024-05-01",
      verdict: {
        bestOverall: "React",
        bestValue: "Vue",
        developers: "React",
        teams: "React",
        students: "Vue",
        powerUsers: "React",
        ecosystem: "React",
        summary:
          "React dominates the SaaS ecosystem with unmatched hiring pool, third-party integrations, and enterprise adoption. Vue offers a gentler learning curve and faster time-to-market for solo founders and small teams.",
      },
      categories: [
        {
          name: "Learning Curve",
          winner: "b",
          verdict: "Vue's template syntax and progressive adoption model make it significantly easier for new developers.",
          facts: [
            {
              entity: "a",
              label: "JSX Complexity",
              value: "Requires understanding of JSX, hooks, and virtual DOM concepts",
              source: "Documentation",
              sourceUrl: "https://react.dev",
              sourceTitle: "React Documentation",
              confidence: 0.95,
              freshness: "Stable",
              changed: false,
            },
            {
              entity: "b",
              label: "Template Syntax",
              value: "HTML-based templates with progressive enhancement approach",
              source: "Documentation",
              sourceUrl: "https://vuejs.org",
              sourceTitle: "Vue.js Documentation",
              confidence: 0.95,
              freshness: "Stable",
              changed: false,
            },
          ],
        },
        {
          name: "Ecosystem & Hiring",
          winner: "a",
          verdict: "React's massive ecosystem and talent pool make it the default choice for scaling teams.",
          facts: [
            {
              entity: "a",
              label: "Job Market",
              value: "~70% of frontend job postings mention React",
              source: "Industry Data",
              sourceUrl: "https://stackoverflow.com",
              sourceTitle: "Stack Overflow Survey",
              confidence: 0.85,
              freshness: "Fresh",
              changed: false,
            },
            {
              entity: "b",
              label: "Package Ecosystem",
              value: "Strong ecosystem but smaller than React's",
              source: "Industry Data",
              sourceUrl: "https://npmjs.com",
              sourceTitle: "NPM Registry",
              confidence: 0.8,
              freshness: "Fresh",
              changed: false,
            },
          ],
        },
        {
          name: "Performance",
          winner: "tie",
          verdict: "Both frameworks offer excellent performance for SaaS applications.",
          facts: [
            {
              entity: "a",
              label: "Bundle Size",
              value: "~42KB gzipped for core library",
              source: "Benchmarks",
              sourceUrl: "https://benchmarks.com",
              sourceTitle: "Framework Benchmarks",
              confidence: 0.9,
              freshness: "Fresh",
              changed: false,
            },
            {
              entity: "b",
              label: "Bundle Size",
              value: "~34KB gzipped for core library",
              source: "Benchmarks",
              sourceUrl: "https://benchmarks.com",
              sourceTitle: "Framework Benchmarks",
              confidence: 0.9,
              freshness: "Fresh",
              changed: false,
            },
          ],
        },
      ],
      sources: [
        {
          title: "React Documentation",
          url: "https://react.dev",
          reliability: "Official",
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
          reliability: "Official",
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
  },
  {
    query: "Supabase vs Firebase for a SaaS",
    slug: "supabase-vs-firebase-2024",
    result: {
      slug: "supabase-vs-firebase-2024",
      query: "Supabase vs Firebase for a SaaS",
      context: "for a SaaS product",
      entities: {
        a: {
          name: "Supabase",
          subtitle: "Open-source Postgres platform",
          mark: "S",
          color: "#3ECF8E",
          hex: "#3ECF8E",
          logoUrl: "https://cdn.simpleicons.org/supabase/3ECF8E",
        },
        b: {
          name: "Firebase",
          subtitle: "Google-backed app platform",
          mark: "F",
          color: "#FFCA28",
          hex: "#FFCA28",
          logoUrl: "https://cdn.simpleicons.org/firebase/FFCA28",
        },
      },
      sourceCount: 10,
      updatedAt: "2024-05-01",
      verdict: {
        bestOverall: "Supabase",
        bestValue: "Supabase",
        developers: "Supabase",
        teams: "Firebase",
        students: "Firebase",
        powerUsers: "Supabase",
        ecosystem: "Firebase",
        summary:
          "Supabase wins for developers wanting Postgres flexibility, SQL, and no vendor lock-in. Firebase excels for rapid prototyping and teams deeply integrated with Google Cloud.",
      },
      categories: [
        {
          name: "Database",
          winner: "a",
          verdict: "Supabase offers true PostgreSQL with full SQL support and row-level security.",
          facts: [
            {
              entity: "a",
              label: "Database Type",
              value: "Full PostgreSQL with extensions support",
              source: "Documentation",
              sourceUrl: "https://supabase.com",
              sourceTitle: "Supabase Documentation",
              confidence: 0.95,
              freshness: "Stable",
              changed: false,
            },
            {
              entity: "b",
              label: "Database Type",
              value: "Firestore (NoSQL document store)",
              source: "Documentation",
              sourceUrl: "https://firebase.google.com",
              sourceTitle: "Firebase Documentation",
              confidence: 0.95,
              freshness: "Stable",
              changed: false,
            },
          ],
        },
        {
          name: "Pricing",
          winner: "a",
          verdict: "Supabase's generous free tier and predictable pricing favor growing SaaS businesses.",
          facts: [
            {
              entity: "a",
              label: "Free Tier",
              value: "500MB database, 2GB storage, 50K auth users",
              source: "Pricing Page",
              sourceUrl: "https://supabase.com/pricing",
              sourceTitle: "Supabase Pricing",
              confidence: 0.9,
              freshness: "Monitor",
              changed: false,
            },
            {
              entity: "b",
              label: "Free Tier",
              value: "1GB storage, 50K reads/day, 20K writes/day",
              source: "Pricing Page",
              sourceUrl: "https://firebase.google.com/pricing",
              sourceTitle: "Firebase Pricing",
              confidence: 0.9,
              freshness: "Monitor",
              changed: false,
            },
          ],
        },
      ],
      sources: [
        {
          title: "Supabase Documentation",
          url: "https://supabase.com",
          reliability: "Official",
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
          reliability: "Official",
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
  },
];

async function seed() {
  console.log("🌱 Seeding example comparisons...");
  const db = createDbClient();

  for (const example of exampleComparisons) {
    const existing = await db
      .select({ id: comparisons.id })
      .from(comparisons)
      .where(eq(comparisons.slug, example.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  Skipping ${example.slug} (already exists)`);
      continue;
    }

    await db.insert(comparisons).values({
      query: example.query,
      slug: example.slug,
      status: "completed",
      visibility: "public",
      progress: 100,
      activeStep: 5,
      sourceCount: example.result.sourceCount,
      result: example.result,
      overallConfidence: "0.85",
    });

    console.log(`  ✅ Created ${example.slug}`);
  }

  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

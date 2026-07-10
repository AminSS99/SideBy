export type ComparisonCategory =
  | "software"
  | "developer_tool"
  | "ai_tool"
  | "product"
  | "company_service"
  | "place"
  | "education"
  | "career"
  | "finance_info"
  | "health_fitness"
  | "method_framework"
  | "technical_standard"
  | "politics_policy"
  | "general_research"
  | "unsupported"
  | "sensitive";

export type ComparisonIntentStatus =
  | "ready"
  | "needs_entities"
  | "needs_context"
  | "incomparable"
  | "unsupported"
  | "sensitive";

export type SafetyLevel = "standard" | "informational" | "restricted" | "blocked";
export type TaxonomyFreshnessClass = "volatile" | "medium" | "stable";

export type DimensionTemplate = {
  name: string;
  description: string;
  weight: number;
};

export type ComparisonCategoryDefinition = {
  id: ComparisonCategory;
  label: string;
  shortLabel: string;
  description: string;
  examples: string[];
  blockedExamples: string[];
  defaultDimensions: DimensionTemplate[];
  sourceRequirements: string[];
  searchAngles: string[];
  resultTone: string;
  disclaimer?: string;
  freshnessClass: TaxonomyFreshnessClass;
  safetyLevel: SafetyLevel;
  keywords: string[];
  entityHints: string[];
};

export type PolicySignal = {
  id: string;
  label: string;
  message: string;
  severity: "info" | "warn" | "block";
};

export type ComparisonTaxonomySummary = {
  category: ComparisonCategory;
  label: string;
  status: ComparisonIntentStatus;
  safetyLevel: SafetyLevel;
  confidence: number;
  disclaimer?: string;
  policyNote?: string;
  sourceRequirements: string[];
};

export type ComparisonIntent = ComparisonTaxonomySummary & {
  canStart: boolean;
  entityA: string | null;
  entityB: string | null;
  message: string;
  suggestion?: string;
  signals: PolicySignal[];
};

const dims = (items: Array<[string, string, number]>): DimensionTemplate[] =>
  items.map(([name, description, weight]) => ({ name, description, weight }));

export const COMPARISON_CATEGORIES: Record<ComparisonCategory, ComparisonCategoryDefinition> = {
  software: {
    id: "software",
    label: "Software",
    shortLabel: "Software",
    description: "Programming languages, frameworks, operating systems, databases, and software platforms.",
    examples: ["React vs Vue", "PostgreSQL vs MySQL", "iOS vs Android", "Python vs Go"],
    blockedExamples: ["One developer vs another developer", "Which user group is better at coding"],
    defaultDimensions: dims([
      ["Capability Fit", "Core feature coverage for the stated use case", 1.15],
      ["Performance", "Speed, resource usage, latency, and real-world efficiency", 1.05],
      ["Developer Experience", "Documentation, tooling, setup, debugging, and workflow quality", 1],
      ["Ecosystem", "Libraries, integrations, community, and hiring availability", 0.95],
      ["Scalability", "Ability to support larger teams, workloads, and complexity", 0.9],
      ["Security & Maintenance", "Security posture, update cadence, and long-term maintainability", 0.85],
    ]),
    sourceRequirements: ["official docs", "release notes", "pricing pages when relevant", "benchmarks or reputable technical analysis"],
    searchAngles: ["official documentation features", "pricing limits", "performance benchmark", "security release notes"],
    resultTone: "Technical, source-grounded, and decision-oriented.",
    freshnessClass: "volatile",
    safetyLevel: "standard",
    keywords: ["software", "framework", "library", "database", "language", "operating system", "os", "sdk", "api"],
    entityHints: [
      "react", "vue", "angular", "svelte", "next.js", "nuxt", "remix", "astro", "tailwind",
      "typescript", "javascript", "python", "go", "rust", "swift", "kotlin", "java", "php",
      "postgres", "postgresql", "mysql", "mongodb", "redis", "sqlite", "dynamodb", "linux",
      "windows", "macos", "ios", "android",
    ],
  },
  developer_tool: {
    id: "developer_tool",
    label: "Developer Tools",
    shortLabel: "Dev Tool",
    description: "Hosting, infrastructure, IDEs, BaaS, CI/CD, observability, and engineering workflow products.",
    examples: ["Supabase vs Firebase", "Vercel vs Render", "Cursor vs Windsurf", "Sentry vs Datadog"],
    blockedExamples: ["Comparing individual developers", "Which engineering team is smarter"],
    defaultDimensions: dims([
      ["Pricing", "Free tiers, usage limits, overage risk, and scale-up costs", 1.15],
      ["Developer Experience", "Setup speed, local workflow, docs, CLI, and SDK quality", 1.1],
      ["Reliability", "Uptime, status history, support quality, and operational maturity", 1],
      ["Integrations", "Framework, cloud, repository, marketplace, and API integrations", 0.95],
      ["Scalability", "Limits, enterprise controls, regional support, and workload growth", 0.9],
      ["Security & Compliance", "Auth, audit logs, compliance, data controls, and access model", 0.85],
    ]),
    sourceRequirements: ["official docs", "pricing pages", "status pages", "changelogs", "credible reviews"],
    searchAngles: ["official pricing documentation", "developer docs features", "status uptime incident", "security compliance"],
    resultTone: "Practical for teams choosing a production stack.",
    freshnessClass: "volatile",
    safetyLevel: "standard",
    keywords: ["hosting", "deploy", "database platform", "backend as a service", "baas", "ci", "cd", "ide", "observability", "devops"],
    entityHints: [
      "supabase", "firebase", "neon", "vercel", "netlify", "render", "railway", "fly.io",
      "heroku", "aws", "azure", "gcp", "cloudflare", "digitalocean", "cursor", "windsurf",
      "copilot", "github actions", "circleci", "sentry", "datadog", "linear", "jira",
    ],
  },
  ai_tool: {
    id: "ai_tool",
    label: "AI Tools",
    shortLabel: "AI Tool",
    description: "AI assistants, model providers, AI coding tools, search assistants, and model APIs.",
    examples: ["ChatGPT Plus vs Claude Pro", "OpenAI vs Anthropic", "Perplexity vs ChatGPT", "Cursor vs GitHub Copilot"],
    blockedExamples: ["Which race has better intelligence", "Ranking protected groups by ability"],
    defaultDimensions: dims([
      ["Output Quality", "Accuracy, reasoning, instruction following, and task fit", 1.25],
      ["Speed", "Latency, streaming quality, throughput, and responsiveness", 0.95],
      ["Pricing", "Subscription price, token cost, limits, and enterprise pricing clarity", 1.05],
      ["Context & Modalities", "Context window, file handling, image, audio, video, and tool support", 0.95],
      ["Privacy & Data Controls", "Data retention, training controls, workspace controls, and compliance", 0.95],
      ["Ecosystem", "API, integrations, plugins, SDKs, and workflow compatibility", 0.85],
    ]),
    sourceRequirements: ["official product docs", "pricing pages", "model cards or system cards", "release notes", "reputable benchmark coverage"],
    searchAngles: ["official pricing limits", "model card system card", "release notes features", "privacy data controls"],
    resultTone: "Current, careful, and explicit about fast-moving model changes.",
    disclaimer: "AI product capabilities and pricing change quickly. Verify important limits on official pages before purchase or deployment.",
    freshnessClass: "volatile",
    safetyLevel: "informational",
    keywords: ["ai", "llm", "model", "chatbot", "assistant", "coding assistant", "agent", "generative"],
    entityHints: [
      "chatgpt", "claude", "gemini", "openai", "anthropic", "perplexity", "mistral",
      "llama", "cohere", "deepseek", "grok", "copilot", "cursor", "windsurf",
    ],
  },
  product: {
    id: "product",
    label: "Products",
    shortLabel: "Product",
    description: "Consumer products, hardware, cars, phones, laptops, cameras, and physical goods.",
    examples: ["iPhone 16 vs Pixel 10", "Tesla Model 3 vs Hyundai Ioniq 6", "MacBook Air vs ThinkPad X1", "AirPods Max vs Sony WH-1000XM6"],
    blockedExamples: ["Prescription medicine A vs prescription medicine B", "Weapons for harming people"],
    defaultDimensions: dims([
      ["Price & Value", "Price, included features, total cost, and resale or ownership value", 1.15],
      ["Feature Set", "Capabilities, specs, included services, and practical differences", 1.05],
      ["Performance", "Benchmarks, speed, endurance, range, or real-world output", 1],
      ["Quality & Durability", "Build quality, warranty, repairability, and reliability", 0.95],
      ["User Experience", "Ease of use, comfort, design, software, and daily workflow fit", 0.9],
      ["Availability & Support", "Regional availability, service network, returns, and support", 0.8],
    ]),
    sourceRequirements: ["official specs", "pricing pages", "warranty pages", "reputable reviews", "benchmarks where available"],
    searchAngles: ["official specs pricing", "warranty support", "review benchmark", "availability"],
    resultTone: "Buyer-focused, concrete, and clear about tradeoffs.",
    freshnessClass: "medium",
    safetyLevel: "standard",
    keywords: ["product", "phone", "laptop", "car", "camera", "headphones", "tv", "monitor", "bike", "ev", "electric vehicle"],
    entityHints: [
      "iphone", "pixel", "galaxy", "macbook", "thinkpad", "xps", "surface", "airpods",
      "sony", "bose", "tesla", "bmw", "mercedes", "toyota", "honda", "hyundai", "kia",
      "rivian", "lucid", "canon", "nikon", "sony alpha", "steam deck", "playstation", "xbox",
    ],
  },
  company_service: {
    id: "company_service",
    label: "Companies & Services",
    shortLabel: "Service",
    description: "SaaS products, vendors, marketplaces, payment processors, and business services.",
    examples: ["Stripe vs Adyen", "Shopify vs WooCommerce", "Notion vs Coda", "HubSpot vs Salesforce"],
    blockedExamples: ["A founder vs another founder", "Which nationality makes better companies"],
    defaultDimensions: dims([
      ["Core Offering", "Product capabilities, service scope, and fit for the stated customer", 1.15],
      ["Pricing", "Plans, fees, transaction costs, and long-term cost clarity", 1.1],
      ["Integrations", "App ecosystem, API coverage, workflow integrations, and partners", 0.95],
      ["Reliability & Support", "Uptime, support channels, onboarding, and account management", 0.95],
      ["Security & Compliance", "Compliance posture, permissions, auditability, and data handling", 0.9],
      ["Market Maturity", "Adoption, roadmap stability, ecosystem trust, and switching risk", 0.8],
    ]),
    sourceRequirements: ["official pages", "pricing pages", "docs", "security pages", "credible market or customer reviews"],
    searchAngles: ["official pricing plans", "documentation integrations", "security compliance", "customer reviews"],
    resultTone: "Business-oriented and explicit about use-case fit.",
    freshnessClass: "medium",
    safetyLevel: "standard",
    keywords: ["company", "service", "saas", "vendor", "payment", "ecommerce", "crm", "marketplace", "subscription"],
    entityHints: [
      "stripe", "adyen", "paddle", "paypal", "shopify", "woocommerce", "notion", "coda",
      "airtable", "linear", "jira", "salesforce", "hubspot", "slack", "teams", "zoom",
      "figma", "canva", "webflow", "framer",
    ],
  },
  place: {
    id: "place",
    label: "Places",
    shortLabel: "Place",
    description: "Cities, countries, regions, schools, venues, or destinations compared for a concrete use case.",
    examples: ["Lisbon vs Barcelona for remote workers", "Austin vs Denver for startups", "Japan vs Korea for first-time travelers"],
    blockedExamples: ["Which nationality is better", "Ranking ethnic groups", "Which country has smarter people"],
    defaultDimensions: dims([
      ["Cost of Living", "Housing, groceries, dining, taxes, and day-to-day costs", 1.15],
      ["Opportunity Fit", "Jobs, ecosystem, schools, tourism, or the stated reason for comparing", 1.05],
      ["Quality of Life", "Safety, healthcare, environment, recreation, and livability", 1],
      ["Mobility", "Transit, airports, walkability, commute, and regional access", 0.9],
      ["Rules & Logistics", "Visa, residency, business setup, or travel constraints at a high level", 0.85],
      ["Culture & Community", "Language, community, food, events, and social fit", 0.8],
    ]),
    sourceRequirements: ["official government or tourism pages", "statistics sources", "cost databases", "recent reputable local guides"],
    searchAngles: ["official cost of living statistics", "safety statistics", "visa requirements official", "quality of life data"],
    resultTone: "Practical, non-stereotyping, and focused on logistics and user goals.",
    disclaimer: "Place comparisons are informational. Verify legal, visa, tax, and residency requirements with official sources or a qualified professional.",
    freshnessClass: "stable",
    safetyLevel: "informational",
    keywords: ["city", "country", "place", "travel", "remote worker", "startup", "relocation", "moving", "study abroad", "visa"],
    entityHints: [
      "lisbon", "barcelona", "austin", "denver", "berlin", "munich", "london", "paris",
      "tokyo", "seoul", "japan", "korea", "singapore", "amsterdam", "new york",
      "los angeles", "san francisco", "zurich", "dubai", "toronto", "stockholm", "madrid", "rome",
    ],
  },
  education: {
    id: "education",
    label: "Education",
    shortLabel: "Education",
    description: "Degrees, schools, bootcamps, courses, majors, learning paths, and credentials.",
    examples: ["Computer Science vs Data Science", "MBA vs Master's in Finance", "Bootcamp vs CS degree", "Coursera vs Udemy"],
    blockedExamples: ["Which students from a protected group are smarter", "Ranking religions by education value"],
    defaultDimensions: dims([
      ["Career Outcomes", "Roles, hiring signal, placement, and long-term optionality", 1.15],
      ["Cost & Time", "Tuition, opportunity cost, duration, and schedule flexibility", 1.1],
      ["Curriculum Fit", "Skill coverage, depth, specialization, and practical relevance", 1],
      ["Credential Signal", "Recognition, accreditation, alumni network, and employer trust", 0.95],
      ["Learning Format", "Online, in-person, mentorship, projects, and assessment quality", 0.85],
      ["Risk & Flexibility", "Admission risk, completion risk, transferability, and fallback options", 0.8],
    ]),
    sourceRequirements: ["official program pages", "tuition pages", "outcome reports", "accreditation or labor-market sources"],
    searchAngles: ["official curriculum tuition", "career outcomes report", "admission requirements", "accreditation"],
    resultTone: "Advisory, grounded, and focused on the learner's goal.",
    disclaimer: "Education outcomes vary by person, market, institution, and effort. Treat this as planning context, not a guarantee.",
    freshnessClass: "medium",
    safetyLevel: "informational",
    keywords: ["degree", "major", "university", "college", "course", "bootcamp", "certification", "mba", "masters", "education"],
    entityHints: [
      "computer science", "data science", "mba", "masters", "bootcamp", "coursera",
      "udemy", "edx", "khan academy", "harvard", "stanford", "mit", "bachelor",
    ],
  },
  career: {
    id: "career",
    label: "Careers",
    shortLabel: "Career",
    description: "Roles, career tracks, skills, team functions, and professional paths.",
    examples: ["Frontend vs Backend Engineering", "Product Manager vs Product Designer", "Consulting vs Product Management"],
    blockedExamples: ["Which protected group is better at leadership", "Comparing named coworkers"],
    defaultDimensions: dims([
      ["Market Demand", "Hiring demand, role availability, and industry breadth", 1.1],
      ["Compensation", "Salary range, upside, benefits, and geography sensitivity", 1],
      ["Skill Fit", "Required strengths, learning curve, and day-to-day work style", 1.05],
      ["Growth Path", "Seniority ladder, leadership paths, and long-term optionality", 0.95],
      ["Work Environment", "Collaboration style, autonomy, stress, travel, and schedule", 0.85],
      ["Entry Barriers", "Portfolio, credential, interview, and experience requirements", 0.8],
    ]),
    sourceRequirements: ["labor statistics", "salary datasets", "job descriptions", "credible career reports"],
    searchAngles: ["salary range labor statistics", "job market demand", "role responsibilities", "career path"],
    resultTone: "Career-planning focused and non-prescriptive.",
    disclaimer: "Career comparisons are informational and vary by market, company, background, and timing.",
    freshnessClass: "medium",
    safetyLevel: "informational",
    keywords: ["career", "job", "role", "engineering", "designer", "manager", "consulting", "salary", "profession"],
    entityHints: [
      "frontend", "backend", "full stack", "data analyst", "data scientist", "product manager",
      "designer", "consulting", "sales", "marketing", "founder", "engineer", "developer",
    ],
  },
  finance_info: {
    id: "finance_info",
    label: "Finance Concepts",
    shortLabel: "Finance",
    description: "Financial concepts, account types, tax-advantaged structures, and investing vehicles at an educational level.",
    examples: ["ETFs vs mutual funds", "Roth IRA vs traditional IRA", "HYSA vs money market fund"],
    blockedExamples: ["Should I buy Tesla stock or Nvidia stock today", "Bitcoin vs Ethereum price prediction", "Options strategy for my portfolio"],
    defaultDimensions: dims([
      ["Purpose & Use Case", "What each option is designed for and when it is commonly used", 1.1],
      ["Costs & Fees", "Expense ratios, account fees, transaction fees, and hidden costs", 1.05],
      ["Risk Profile", "Volatility, liquidity, principal risk, and suitability constraints", 1.05],
      ["Tax Treatment", "High-level tax considerations and withdrawal rules", 0.95],
      ["Accessibility", "Eligibility, minimums, complexity, and account availability", 0.9],
      ["Regulatory Notes", "Rules, protections, and constraints users should verify", 0.85],
    ]),
    sourceRequirements: ["official regulator pages", "IRS or government pages where relevant", "issuer docs", "reputable educational finance sources"],
    searchAngles: ["official regulator explanation", "IRS rules official", "fees risks educational", "investor.gov"],
    resultTone: "Educational, cautious, and clearly not personalized financial advice.",
    disclaimer: "This is educational information, not financial, tax, legal, or investment advice. Verify rules and consult a qualified professional for personal decisions.",
    freshnessClass: "medium",
    safetyLevel: "informational",
    keywords: ["finance", "investing", "investment", "ira", "etf", "mutual fund", "savings", "tax", "retirement", "money market"],
    entityHints: [
      "etf", "etfs", "mutual fund", "mutual funds", "roth ira", "traditional ira", "401k",
      "hysa", "high yield savings", "money market", "index fund", "bond fund", "treasury",
    ],
  },
  health_fitness: {
    id: "health_fitness",
    label: "Health & Fitness Concepts",
    shortLabel: "Fitness",
    description: "Exercise styles, wellness concepts, nutrition basics, and non-treatment fitness decisions.",
    examples: ["Running vs cycling", "Creatine vs protein powder", "HIIT vs strength training", "Yoga vs Pilates"],
    blockedExamples: ["Chemotherapy vs radiation for my cancer", "Antidepressant A vs antidepressant B", "Surgery vs medication for a condition"],
    defaultDimensions: dims([
      ["Primary Goal Fit", "Strength, endurance, recovery, body composition, or general wellness fit", 1.15],
      ["Evidence Base", "Quality and consistency of reputable research or guidance", 1.05],
      ["Safety & Contraindications", "Common risks, who should be cautious, and when to ask a clinician", 1],
      ["Cost & Accessibility", "Equipment, coaching, recurring cost, and availability", 0.9],
      ["Ease of Adherence", "Habit fit, time requirements, enjoyment, and sustainability", 0.9],
      ["Measurement", "How progress is commonly measured and verified", 0.8],
    ]),
    sourceRequirements: ["public health sources", "peer-reviewed or medical institution summaries", "sports medicine guidance", "official product labels for supplements"],
    searchAngles: ["public health guidance", "sports medicine evidence", "safety contraindications", "systematic review"],
    resultTone: "Educational, health-cautious, and never a substitute for medical care.",
    disclaimer: "This is general wellness information, not medical advice. Talk to a qualified clinician before changing care, treating a condition, or using supplements with medical risk.",
    freshnessClass: "medium",
    safetyLevel: "informational",
    keywords: ["fitness", "exercise", "workout", "training", "nutrition", "supplement", "wellness", "strength", "cardio"],
    entityHints: [
      "running", "cycling", "swimming", "walking", "hiit", "strength training", "weight training",
      "yoga", "pilates", "creatine", "protein powder", "whey", "casein", "calisthenics",
    ],
  },
  method_framework: {
    id: "method_framework",
    label: "Methods & Frameworks",
    shortLabel: "Method",
    description: "Business, product, engineering, management, design, and decision frameworks.",
    examples: ["Agile vs Waterfall", "OKRs vs KPIs", "Kanban vs Scrum", "Design thinking vs Lean startup"],
    blockedExamples: ["Which religion has better values", "Which protected group is more productive"],
    defaultDimensions: dims([
      ["Best Use Case", "Where the method works best and what problem it solves", 1.15],
      ["Implementation Complexity", "Setup effort, process overhead, and adoption difficulty", 1],
      ["Measurement", "How success is tracked and how feedback loops work", 0.95],
      ["Team Fit", "Team size, cadence, culture, and collaboration model", 0.95],
      ["Flexibility", "Adaptability, hybrid use, and resilience under changing priorities", 0.85],
      ["Risks & Failure Modes", "Common misuses, limitations, and operational risks", 0.85],
    ]),
    sourceRequirements: ["official framework docs where available", "credible practitioner guides", "case studies", "academic or standards references"],
    searchAngles: ["official guide", "implementation case study", "best practices", "limitations"],
    resultTone: "Operational and practical, focused on fit rather than ideology.",
    freshnessClass: "stable",
    safetyLevel: "standard",
    keywords: ["method", "framework", "process", "management", "strategy", "planning", "okr", "kpi", "agile", "scrum", "kanban"],
    entityHints: [
      "agile", "waterfall", "scrum", "kanban", "okr", "okrs", "kpi", "kpis",
      "lean", "six sigma", "design thinking", "jobs to be done", "jtbd", "rice", "moscow",
    ],
  },
  technical_standard: {
    id: "technical_standard",
    label: "Technical Standards",
    shortLabel: "Standard",
    description: "Protocols, file formats, standards, specifications, and technical approaches.",
    examples: ["REST vs GraphQL", "OAuth vs SAML", "WebSockets vs SSE", "JSON vs Protocol Buffers"],
    blockedExamples: ["How to bypass authentication", "Which exploit technique is better for attacking a target"],
    defaultDimensions: dims([
      ["Protocol Fit", "Problem fit, architecture fit, and compatibility with the target system", 1.15],
      ["Complexity", "Implementation burden, tooling, debugging, and operational overhead", 1],
      ["Performance", "Latency, payload size, resource use, and scaling behavior", 0.95],
      ["Interoperability", "Standards maturity, ecosystem support, and cross-platform compatibility", 0.95],
      ["Security Considerations", "Auth, data exposure, attack surface, and safe defaults", 0.9],
      ["Maintainability", "Versioning, documentation, monitoring, and long-term support", 0.85],
    ]),
    sourceRequirements: ["official specifications", "vendor docs", "standards body docs", "security guidance"],
    searchAngles: ["official specification", "security best practices", "performance comparison", "implementation guide"],
    resultTone: "Engineering-focused and exact about constraints.",
    freshnessClass: "medium",
    safetyLevel: "standard",
    keywords: ["protocol", "standard", "spec", "format", "auth", "api design", "serialization", "networking"],
    entityHints: [
      "rest", "graphql", "grpc", "websocket", "websockets", "sse", "oauth", "saml",
      "openid connect", "oidc", "json", "protobuf", "xml", "yaml", "http", "tcp", "udp",
    ],
  },
  general_research: {
    id: "general_research",
    label: "General Research",
    shortLabel: "General",
    description: "Fallback for clearly comparable non-sensitive things when the user supplies a concrete context.",
    examples: ["Option A vs Option B for a documented buying or planning decision"],
    blockedExamples: ["Anything about protected classes, people rankings, religion rankings, medical care, or personalized finance"],
    defaultDimensions: dims([
      ["Use-Case Fit", "How well each option fits the stated goal", 1.2],
      ["Cost & Value", "Costs, benefits, and tradeoffs", 1],
      ["Evidence Quality", "Strength, reliability, and recency of available sources", 1],
      ["Ease of Adoption", "Setup, learning curve, availability, and switching effort", 0.9],
      ["Risks & Constraints", "Failure modes, limitations, and decision risks", 0.85],
    ]),
    sourceRequirements: ["official or primary sources where possible", "recent reputable sources", "at least two independent sources"],
    searchAngles: ["official information", "pricing details", "review comparison", "limitations"],
    resultTone: "Careful, source-first, and explicit about uncertainty.",
    freshnessClass: "medium",
    safetyLevel: "standard",
    keywords: ["compare", "versus", "vs"],
    entityHints: [],
  },
  politics_policy: {
    id: "politics_policy",
    label: "Politics & Policy",
    shortLabel: "Politics",
    description: "Political parties, policies, ideologies, legislative proposals, and governance approaches compared factually.",
    examples: ["Democrats vs Republicans", "Capitalism vs Socialism", "Universal healthcare vs private healthcare", "Gun control vs gun rights"],
    blockedExamples: ["Which political party is evil", "Which politician is a better person", "Ranking ethnic groups by political leaning"],
    defaultDimensions: dims([
      ["Policy Positions", "Stated platform, legislative priorities, and ideological stance", 1.2],
      ["Economic Impact", "GDP, employment, deficit, tax, and distributional effects from credible sources", 1.1],
      ["Social Impact", "Healthcare, education, civil rights, and community outcomes", 1],
      ["Historical Track Record", "Legislative achievements, governance outcomes, and precedent", 0.95],
      ["Public Opinion", "Polling data, voter demographics, and approval trends", 0.9],
      ["Criticisms & Risks", "Common objections, failure modes, and unintended consequences", 0.85],
    ]),
    sourceRequirements: ["official party or government pages", "nonpartisan research organizations", "reputable news sources", "academic or policy institute sources"],
    searchAngles: ["official policy platform", "nonpartisan analysis", "economic impact study", "public opinion polling"],
    resultTone: "Factual, balanced, and nonpartisan. Present multiple perspectives with sources. Never endorse a party or ideology.",
    disclaimer: "Political comparisons are informational. SideBy presents sourced facts and multiple perspectives, not endorsements. Verify voting rules and current positions with official sources.",
    freshnessClass: "volatile",
    safetyLevel: "informational",
    keywords: ["politics", "political", "party", "democrat", "republican", "liberal", "conservative", "progressive", "libertarian", "socialist", "capitalism", "communism", "policy", "legislation", "election", "vote", "voting", "congress", "senate", "parliament", "government", "governance", "ideology", "tax policy", "healthcare policy", "immigration", "climate policy", "gun control", "abortion", "welfare"],
    entityHints: [
      "democrats", "republicans", "libertarian", "green party", "labour", "tories",
      "capitalism", "socialism", "communism", "fascism", "progressive", "conservative",
      "universal healthcare", "private healthcare", "gun control", "gun rights",
    ],
  },
  unsupported: {
    id: "unsupported",
    label: "Unsupported",
    shortLabel: "Unsupported",
    description: "Queries SideBy should not run because they are not a source-backed comparison shape.",
    examples: [],
    blockedExamples: ["Write an essay", "Tell me what to buy without options", "Compare one vague thing"],
    defaultDimensions: [],
    sourceRequirements: [],
    searchAngles: [],
    resultTone: "Do not run.",
    freshnessClass: "medium",
    safetyLevel: "blocked",
    keywords: [],
    entityHints: [],
  },
  sensitive: {
    id: "sensitive",
    label: "Sensitive",
    shortLabel: "Sensitive",
    description: "Blocked or heavily constrained categories such as people rankings, religion rankings, protected classes, medical care, and personalized high-stakes advice.",
    examples: [],
    blockedExamples: ["Islam vs Christianity which is better", "Person A vs Person B", "Which ethnicity is smarter", "Drug A vs Drug B for my condition"],
    defaultDimensions: [],
    sourceRequirements: [],
    searchAngles: [],
    resultTone: "Do not run.",
    freshnessClass: "medium",
    safetyLevel: "blocked",
    keywords: [],
    entityHints: [],
  },
};

export const SUPPORTED_COMPARISON_CATEGORIES = Object.values(COMPARISON_CATEGORIES).filter(
  (category) => !["unsupported", "sensitive", "politics_policy"].includes(category.id),
);

const vaguePatterns = [
  /^what(\s+is)?\s+the\s+best/i,
  /^which(\s+one)?\s+(is\s+)?(the\s+)?best/i,
  /^recommend\s+(a\s+)?(me\s+)?/i,
  /^help\s+me\s+(choose|decide|pick|find)/i,
  /^(should|can)\s+i\s+(use|get|buy|choose|pick)/i,
  /^best\s+\w+\s+for/i,
];

const personRoleTerms = [
  "person", "people", "celebrity", "politician", "candidate", "athlete", "singer",
  "actor", "actress", "influencer", "youtuber", "private individual", "named person",
  "employee", "coworker",
];

const wellKnownPeople = [
  "elon musk", "jeff bezos", "mark zuckerberg", "bill gates", "steve jobs",
  "taylor swift", "beyonce", "cristiano ronaldo", "lionel messi", "donald trump",
  "joe biden", "barack obama", "lebron james", "kendrick lamar", "drake",
];

const religionTerms = [
  "religion", "religions", "christianity", "islam", "judaism", "hinduism",
  "buddhism", "sikhism", "atheism", "atheist", "muslim", "christian", "jewish",
  "hindu", "buddhist", "church", "mosque", "synagogue", "quran", "bible", "torah",
];

const protectedClassTerms = [
  "race", "ethnicity", "ethnic", "gender", "sex", "sexuality", "orientation",
  "nationality", "immigrant", "disabled", "disability", "autistic", "religious group",
  "men vs women", "women vs men", "black people", "white people", "asian people",
];

const politicalSubjectTerms = [
  "politics", "political", "politician", "candidate", "election", "vote", "voting",
  "democrat", "democrats", "republican", "republicans", "liberal", "liberals",
  "conservative", "conservatives", "progressive", "progressives", "libertarian", "libertarians",
  "socialist", "socialism", "capitalist", "capitalism", "communism", "communist",
  "political party", "ideology", "government", "congress", "senate", "parliament",
  "immigration policy", "tax policy", "gun control", "abortion policy",
];

const personalAttributeTerms = [
  "personality", "appearance", "attractiveness", "beauty", "intelligence", "iq",
  "height", "weight", "age", "body", "character", "morality", "ethics",
  "salary", "income", "wealth", "reputation", "popularity", "talent",
];

const rankingHarmTerms = [
  "better", "best", "worse", "worst", "smarter", "dumber", "superior", "inferior",
  "moral", "evil", "trustworthy", "hardworking", "criminal", "dangerous", "civilized",
];

const medicalTreatmentTerms = [
  "treatment", "diagnosis", "disease", "condition", "symptom", "surgery", "therapy",
  "chemotherapy", "radiation", "antibiotic", "antidepressant", "vaccine", "insulin",
  "dose", "dosage", "prescription", "medication", "drug", "cancer", "diabetes",
  "depression", "anxiety", "adhd", "hypertension", "pregnancy",
];

const personalizedFinanceTerms = [
  "buy now", "sell now", "price prediction", "stock pick", "my portfolio", "my taxes",
  "options strategy", "day trade", "crypto trade", "leverage", "margin", "should i invest",
  "which stock", "which crypto",
];

const marketAssetTerms = [
  "stock", "stocks", "crypto", "cryptocurrency", "bitcoin", "ethereum", "token", "coin",
  "options", "futures", "forex",
];

const allowedFinanceConceptTerms = [
  "etf", "etfs", "mutual fund", "mutual funds", "index fund", "bond", "bonds",
  "treasury", "treasuries", "ira", "401k", "savings", "money market", "hysa",
];

const harmfulTechnicalTerms = [
  "exploit", "bypass authentication", "steal", "phishing", "malware", "ransomware",
  "credential stuffing", "sql injection attack", "ddos", "exfiltrate",
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9\s+./&'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const entityAliases: Record<string, string> = {
  "chat gpt": "chatgpt",
  "gpt chat": "chatgpt",
  "react js": "react",
  reactjs: "react",
  "vue js": "vue",
  vuejs: "vue",
  "node js": "node",
  nodejs: "node",
  "next js": "next",
  nextjs: "next",
  "nuxt js": "nuxt",
  nuxtjs: "nuxt",
  "open ai": "openai",
};

const canonicalEntity = (value: string) => {
  const normalized = normalize(value)
    .replace(/\b(the|official|app|website)\b/g, " ")
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|co)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const aliased = entityAliases[normalized] || normalized;
  return entityAliases[aliased.replace(/[.\s_-]+/g, "")] || aliased.replace(/[.\s_-]+/g, "");
};

const sameEntityTokenSet = (entityA: string, entityB: string) => {
  const normalizeTokens = (value: string) =>
    normalize(value)
      .split(/\s+/)
      .map((token) => entityAliases[token] || token)
      .filter((token) => token && !["the", "official", "inc", "llc", "ltd", "limited", "corp", "corporation", "company", "co"].includes(token))
      .sort();

  const a = normalizeTokens(entityA);
  const b = normalizeTokens(entityB);
  return a.length > 0 && a.length === b.length && a.every((token, index) => token === b[index]);
};

const areSameComparableEntity = (entityA: string, entityB: string) => {
  const canonicalA = canonicalEntity(entityA);
  const canonicalB = canonicalEntity(entityB);
  if (!canonicalA || !canonicalB) return false;
  if (canonicalA === canonicalB) return true;
  if (sameEntityTokenSet(entityA, entityB)) return true;
  return false;
};

const cleanEntity = (value: string) =>
  value
    .replace(/\b(for|with|inside|on|because|when|as|to)\b.*$/i, "")
    .replace(/[^a-z0-9\s+./&'-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      if (/^(vs|api|sdk|ai|ui|ux|ci|cd|crm|ira|hysa|sse|saml|oidc|json|xml|yaml|http|tcp|udp)$/i.test(part)) {
        return part.toUpperCase();
      }
      if (/^(iOS|macOS)$/i.test(part)) return part.toLowerCase() === "ios" ? "iOS" : "macOS";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");

const includesAny = (haystack: string, needles: string[]) =>
  needles.some((needle) => haystack.includes(normalize(needle)));

const includesWordAny = (haystack: string, needles: string[]) => {
  const padded = ` ${normalize(haystack)} `;
  return needles.some((needle) => padded.includes(` ${normalize(needle)} `));
};

const wordCount = (value: string) => cleanEntity(value).split(/\s+/).filter(Boolean).length;

const looksLikeNamedPersonPair = (entityA: string, entityB: string, rawQuery: string) => {
  const rawParts = rawQuery.split(/\s+vs\.?\s+/i);
  if (rawParts.length < 2) return false;
  const rawA = cleanEntity(rawParts[0]);
  const rawB = cleanEntity(rawParts.slice(1).join(" vs ").split(/\s+for\s+/i)[0]);
  const hasCapitalizedPair = (value: string) => /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/.test(value.trim());
  const normalizedPair = `${normalize(entityA)} ${normalize(entityB)}`;
  const knownNonPersonHints = SUPPORTED_COMPARISON_CATEGORIES
    .flatMap((category) => category.entityHints)
    .map(normalize)
    .filter(Boolean);

  if (includesAny(normalizedPair, wellKnownPeople)) return true;
  if (includesAny(normalizedPair, knownNonPersonHints)) return false;
  return hasCapitalizedPair(rawA) && hasCapitalizedPair(rawB);
};

export const extractComparisonEntities = (query: string) => {
  const parts = query.split(/\s+vs\.?\s+/i);
  if (parts.length < 2) return { entityA: "", entityB: "" };

  const entityA = cleanEntity(parts[0]);
  const [right] = parts.slice(1).join(" vs ").split(/\s+for\s+/i);
  const entityB = cleanEntity(right);
  return { entityA, entityB };
};

export const hasExplicitContext = (query: string) =>
  /\s+(for|as|when|inside|with)\s+[\w\s+./&'-]{3,}$/i.test(query.trim());

const categoryScore = (
  query: string,
  entityA: string,
  entityB: string,
  definition: ComparisonCategoryDefinition,
) => {
  const q = normalize(query);
  const a = normalize(entityA);
  const b = normalize(entityB);
  let score = 0;

  for (const keyword of definition.keywords) {
    const normalizedKeyword = normalize(keyword);
    if (q.includes(normalizedKeyword)) score += 2;
  }

  for (const hint of definition.entityHints) {
    const normalizedHint = normalize(hint);
    if (!normalizedHint) continue;
    if (a.includes(normalizedHint)) score += 3;
    if (b.includes(normalizedHint)) score += 3;
    if (q.includes(normalizedHint)) score += 1;
  }

  return score;
};

export const detectComparisonCategory = (
  query: string,
  entityA: string,
  entityB: string,
): { category: ComparisonCategory; confidence: number } => {
  const candidates = SUPPORTED_COMPARISON_CATEGORIES
    .filter((category) => category.id !== "general_research")
    .map((category) => ({
      category: category.id,
      score: categoryScore(query, entityA, entityB, category),
    }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best || best.score <= 0) {
    return {
      category: hasExplicitContext(query) ? "general_research" : "general_research",
      confidence: hasExplicitContext(query) ? 0.56 : 0.34,
    };
  }

  const second = candidates[1]?.score || 0;
  const confidence = Math.min(0.96, 0.58 + best.score * 0.05 + Math.max(best.score - second, 0) * 0.03);
  return { category: best.category, confidence };
};

const detectPolicySignals = (query: string, entityA: string, entityB: string): PolicySignal[] => {
  const q = normalize(query);
  const joined = `${normalize(entityA)} ${normalize(entityB)} ${q}`;
  const signals: PolicySignal[] = [];

  if (includesWordAny(joined, politicalSubjectTerms)) {
    signals.push({
      id: "political-subject",
      label: "Political subject",
      message: "SideBy does not process political subjects or political person-to-person comparisons.",
      severity: "block",
    });
  }

  if (includesWordAny(joined, personalAttributeTerms)) {
    signals.push({
      id: "personal-attribute",
      label: "Personal attribute",
      message: "SideBy compares products, tools, services, and other decision options—not personal attributes or human qualities.",
      severity: "block",
    });
  }

  if (includesAny(joined, religionTerms)) {
    signals.push({
      id: "religion-ranking",
      label: "Religion comparison",
      message: "SideBy does not rank religions, belief systems, or faith communities.",
      severity: "block",
    });
  }

  if (
    includesAny(joined, protectedClassTerms) ||
    (includesAny(joined, rankingHarmTerms) && includesAny(joined, protectedClassTerms))
  ) {
    signals.push({
      id: "protected-class-ranking",
      label: "Protected-class comparison",
      message: "SideBy does not compare protected classes or identity groups as better, worse, smarter, or more moral.",
      severity: "block",
    });
  }

  if (
    includesAny(joined, personRoleTerms) ||
    looksLikeNamedPersonPair(entityA, entityB, query)
  ) {
    signals.push({
      id: "people-vs-people",
      label: "People comparison",
      message: "SideBy avoids person-vs-person rankings. Compare products, organizations, roles, or public facts instead.",
      severity: "block",
    });
  }

  if (includesAny(joined, medicalTreatmentTerms)) {
    signals.push({
      id: "medical-treatment",
      label: "Medical treatment",
      message: "SideBy does not compare medical treatments, diagnoses, or medications in ways that could guide care.",
      severity: "block",
    });
  }

  const looksLikeMarketAssetComparison =
    includesWordAny(q, marketAssetTerms) &&
    !includesAny(q, allowedFinanceConceptTerms);

  if (includesAny(q, personalizedFinanceTerms) || looksLikeMarketAssetComparison) {
    signals.push({
      id: "personalized-finance",
      label: "Personalized finance",
      message: "SideBy can compare finance concepts educationally, but not individual securities, crypto assets, trades, taxes, or price predictions.",
      severity: "block",
    });
  }

  if (includesAny(q, harmfulTechnicalTerms)) {
    signals.push({
      id: "harmful-technical",
      label: "Harmful technical request",
      message: "SideBy does not compare methods for attacking systems or causing harm.",
      severity: "block",
    });
  }

  return signals;
};

const suggestionFor = (category: ComparisonCategory | null, entityA?: string | null) => {
  if (category && category !== "unsupported" && category !== "sensitive") {
    const example = COMPARISON_CATEGORIES[category].examples[0];
    if (example) return example;
  }
  if (entityA) return `${titleCase(entityA)} vs another option for your use case`;
  return "Supabase vs Firebase for a SaaS";
};

export const getComparisonCategoryDefinition = (category: ComparisonCategory) =>
  COMPARISON_CATEGORIES[category] || COMPARISON_CATEGORIES.general_research;

export const isBlockedCategory = (category: ComparisonCategory) =>
  category === "unsupported" || category === "sensitive";

export const summarizeComparisonTaxonomy = (intent: ComparisonIntent): ComparisonTaxonomySummary => {
  const definition = getComparisonCategoryDefinition(intent.category);
  return {
    category: intent.category,
    label: definition.label,
    status: intent.status,
    safetyLevel: intent.safetyLevel,
    confidence: intent.confidence,
    disclaimer: intent.disclaimer,
    policyNote: intent.policyNote,
    sourceRequirements: definition.sourceRequirements,
  };
};

export const analyzeComparisonQuery = (rawQuery: string): ComparisonIntent => {
  const query = rawQuery.trim();

  if (!query) {
    return {
      category: "unsupported",
      label: COMPARISON_CATEGORIES.unsupported.label,
      status: "needs_entities",
      canStart: false,
      safetyLevel: "blocked",
      confidence: 0,
      entityA: null,
      entityB: null,
      message: "Type two concrete things in an A vs B shape.",
      suggestion: "Supabase vs Firebase for a SaaS",
      sourceRequirements: [],
      signals: [],
    };
  }

  if (query.length < 7) {
    return {
      category: "unsupported",
      label: COMPARISON_CATEGORIES.unsupported.label,
      status: "needs_entities",
      canStart: false,
      safetyLevel: "blocked",
      confidence: 0.2,
      entityA: null,
      entityB: null,
      message: "This is too short to compare confidently.",
      suggestion: `${query} vs another option`,
      sourceRequirements: [],
      signals: [],
    };
  }

  if ((query.match(/\s+vs\.?\s+/gi) || []).length > 1) {
    return {
      category: "unsupported",
      label: COMPARISON_CATEGORIES.unsupported.label,
      status: "needs_entities",
      canStart: false,
      safetyLevel: "blocked",
      confidence: 0.96,
      entityA: null,
      entityB: null,
      message: "Compare exactly two options at a time.",
      suggestion: "Astra vs Astro for a web project",
      sourceRequirements: [],
      signals: [],
    };
  }

  if (vaguePatterns.some((pattern) => pattern.test(query))) {
    const { category, confidence } = detectComparisonCategory(query, "", "");
    const definition = getComparisonCategoryDefinition(category);
    return {
      category,
      label: definition.label,
      status: "needs_entities",
      canStart: false,
      safetyLevel: definition.safetyLevel,
      confidence: Math.min(confidence, 0.48),
      entityA: null,
      entityB: null,
      message: "This sounds like a recommendation request. Pick two concrete options first.",
      suggestion: suggestionFor(category),
      disclaimer: definition.disclaimer,
      sourceRequirements: definition.sourceRequirements,
      signals: [],
    };
  }

  const { entityA, entityB } = extractComparisonEntities(query);

  // Run policy signals early so harmful content is blocked regardless of entity shape.
  const signals = detectPolicySignals(query, entityA || "", entityB || "");
  const blockingSignal = signals.find((signal) => signal.severity === "block");
  if (blockingSignal) {
    return {
      category: "sensitive",
      label: COMPARISON_CATEGORIES.sensitive.label,
      status: "sensitive",
      canStart: false,
      safetyLevel: "blocked",
      confidence: 0.96,
      entityA: entityA ? titleCase(entityA) : null,
      entityB: entityB ? titleCase(entityB) : null,
      message: blockingSignal.message,
      policyNote: blockingSignal.label,
      suggestion: "Try a source-backed product, software, place, education, career, finance concept, fitness concept, or method comparison.",
      sourceRequirements: [],
      signals,
    };
  }

  if (!entityA || !entityB) {
    const { category, confidence } = detectComparisonCategory(query, "", "");
    const definition = getComparisonCategoryDefinition(category);
    return {
      category,
      label: definition.label,
      status: "ready",
      canStart: true,
      safetyLevel: definition.safetyLevel,
      confidence: Math.min(confidence, 0.55),
      entityA: entityA ? titleCase(entityA) : null,
      entityB: entityB ? titleCase(entityB) : null,
      message: "SideBy will try to extract comparable options from your query.",
      suggestion: suggestionFor(category, entityA),
      disclaimer: definition.disclaimer,
      sourceRequirements: definition.sourceRequirements,
      signals,
    };
  }

  const normalizedA = normalize(entityA);
  const normalizedB = normalize(entityB);

  if (normalizedA === normalizedB || areSameComparableEntity(entityA, entityB)) {
    const { category } = detectComparisonCategory(query, entityA, entityB);
    const definition = getComparisonCategoryDefinition(category);
    return {
      category,
      label: definition.label,
      status: "incomparable",
      canStart: false,
      safetyLevel: definition.safetyLevel,
      confidence: 0.95,
      entityA: titleCase(entityA),
      entityB: titleCase(entityB),
      message: "Both sides look like the same option. Choose two distinct things to compare, or add a qualifier like version, plan, region, or use case.",
      suggestion: `${titleCase(entityA)} vs another option for your use case`,
      disclaimer: definition.disclaimer,
      sourceRequirements: definition.sourceRequirements,
      signals: [],
    };
  }

  const { category, confidence } = detectComparisonCategory(query, entityA, entityB);
  const definition = getComparisonCategoryDefinition(category);
  const hasContext = hasExplicitContext(query);
  const entityWordCount = Math.max(wordCount(entityA), wordCount(entityB));

  if (category === "general_research" && !hasContext) {
    return {
      category,
      label: definition.label,
      status: "ready",
      canStart: true,
      safetyLevel: definition.safetyLevel,
      confidence: Math.min(confidence, 0.52),
      entityA: titleCase(entityA),
      entityB: titleCase(entityB),
      message: `Ready to compare ${titleCase(entityA)} and ${titleCase(entityB)}. Add "for ..." for a sharper verdict.`,
      suggestion: `${titleCase(entityA)} vs ${titleCase(entityB)} for a buying, work, study, or planning decision`,
      disclaimer: definition.disclaimer,
      sourceRequirements: definition.sourceRequirements,
      signals,
    };
  }

  const contextualBonus = hasContext ? 0.08 : 0;
  const specificityBonus = entityWordCount > 1 ? 0.04 : 0;
  const finalConfidence = Math.min(0.97, confidence + contextualBonus + specificityBonus);

  return {
    category,
    label: definition.label,
    status: hasContext || category !== "general_research" ? "ready" : "needs_context",
    canStart: true,
    safetyLevel: definition.safetyLevel,
    confidence: finalConfidence,
    entityA: titleCase(entityA),
    entityB: titleCase(entityB),
    message: hasContext
      ? `Ready to compare ${titleCase(entityA)} and ${titleCase(entityB)} as ${definition.label.toLowerCase()}.`
      : `Ready as ${definition.label.toLowerCase()}. Add "for ..." if you want a sharper verdict.`,
    suggestion: hasContext ? undefined : `${titleCase(entityA)} vs ${titleCase(entityB)} for your use case`,
    disclaimer: definition.disclaimer,
    sourceRequirements: definition.sourceRequirements,
    signals,
  };
};

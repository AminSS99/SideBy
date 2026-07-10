const knownLogos: Record<string, string> = {
  // Frontend
  react: "https://cdn.simpleicons.org/react/61DAFB",
  vue: "https://cdn.simpleicons.org/vuedotjs/4FC08D",
  "vue.js": "https://cdn.simpleicons.org/vuedotjs/4FC08D",
  angular: "https://cdn.simpleicons.org/angular/DD0031",
  svelte: "https://cdn.simpleicons.org/svelte/FF3E00",
  nextjs: "https://cdn.simpleicons.org/nextdotjs/white",
  nuxt: "https://cdn.simpleicons.org/nuxtdotjs/00DC82",
  astro: "https://cdn.simpleicons.org/astro/BC52EE",
  remix: "https://cdn.simpleicons.org/remix/white",
  gatsby: "https://cdn.simpleicons.org/gatsby/663399",
  tailwindcss: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
  bootstrap: "https://cdn.simpleicons.org/bootstrap/7952B3",

  // Backend / Databases
  supabase: "https://cdn.simpleicons.org/supabase/3ECF8E",
  firebase: "https://cdn.simpleicons.org/firebase/FFCA28",
  neon: "https://cdn.simpleicons.org/neondatabase/00E699",
  mongodb: "https://cdn.simpleicons.org/mongodb/47A248",
  postgresql: "https://cdn.simpleicons.org/postgresql/4169E1",
  mysql: "https://cdn.simpleicons.org/mysql/4479A1",
  prisma: "https://cdn.simpleicons.org/prisma/2D3748",
  redis: "https://cdn.simpleicons.org/redis/DC382D",
  planetscale: "https://cdn.simpleicons.org/planetscale/white",
  cockroachdb: "https://cdn.simpleicons.org/cockroachdb/6933FF",
  drizzle: "https://cdn.simpleicons.org/drizzle/C5F74F",

  // Hosting / Cloud
  vercel: "https://cdn.simpleicons.org/vercel/white",
  netlify: "https://cdn.simpleicons.org/netlify/00C7B7",
  render: "https://cdn.simpleicons.org/render/white",
  railway: "https://cdn.simpleicons.org/railway/white",
  aws: "https://cdn.simpleicons.org/amazonwebservices/FF9900",
  "amazon web services": "https://cdn.simpleicons.org/amazonwebservices/FF9900",
  azure: "https://cdn.simpleicons.org/microsoftazure/0078D4",
  gcp: "https://cdn.simpleicons.org/googlecloud/4285F4",
  "google cloud": "https://cdn.simpleicons.org/googlecloud/4285F4",
  digitalocean: "https://cdn.simpleicons.org/digitalocean/0080FF",
  cloudflare: "https://cdn.simpleicons.org/cloudflare/F38020",
  flyio: "https://cdn.simpleicons.org/flydotio/7B3FE4",
  heroku: "https://cdn.simpleicons.org/heroku/430098",

  // Languages
  typescript: "https://cdn.simpleicons.org/typescript/3178C6",
  javascript: "https://cdn.simpleicons.org/javascript/F7DF1E",
  python: "https://cdn.simpleicons.org/python/3776AB",
  rust: "https://cdn.simpleicons.org/rust/white",
  go: "https://cdn.simpleicons.org/go/00ADD8",
  "golang": "https://cdn.simpleicons.org/go/00ADD8",
  nodejs: "https://cdn.simpleicons.org/nodedotjs/339933",
  php: "https://cdn.simpleicons.org/php/777BB4",
  ruby: "https://cdn.simpleicons.org/ruby/CC342D",
  elixir: "https://cdn.simpleicons.org/elixir/4B275F",
  kotlin: "https://cdn.simpleicons.org/kotlin/7F52FF",
  swift: "https://cdn.simpleicons.org/swift/F05138",
  dart: "https://cdn.simpleicons.org/dart/0175C2",

  // AI / LLMs
  openai: "https://cdn.simpleicons.org/openai/white",
  chatgpt: "https://cdn.simpleicons.org/openai/white",
  claude: "https://cdn.simpleicons.org/anthropic/white",
  anthropic: "https://cdn.simpleicons.org/anthropic/white",
  gemini: "https://cdn.simpleicons.org/googlegemini/8E75B2",
  "google gemini": "https://cdn.simpleicons.org/googlegemini/8E75B2",
  huggingface: "https://cdn.simpleicons.org/huggingface/FFD21E",
  cohere: "https://cdn.simpleicons.org/cohere/D6A1F7",
  mistral: "https://cdn.simpleicons.org/mistralai/FF7000",
  perplexity: "https://cdn.simpleicons.org/perplexity/20B8E3",

  // Dev Tools
  github: "https://cdn.simpleicons.org/github/white",
  gitlab: "https://cdn.simpleicons.org/gitlab/FC6D26",
  docker: "https://cdn.simpleicons.org/docker/2496ED",
  kubernetes: "https://cdn.simpleicons.org/kubernetes/326CE5",
  figma: "https://cdn.simpleicons.org/figma/F24E1E",
  linear: "https://cdn.simpleicons.org/linear/5E6AD2",
  notion: "https://cdn.simpleicons.org/notion/white",
  cursor: "https://cursor.com/favicon.ico",
  windsurf: "https://windsurf.com/favicon.ico",
  vscode: "https://cdn.simpleicons.org/visualstudiocode/007ACC",
  "visual studio code": "https://cdn.simpleicons.org/visualstudiocode/007ACC",
  webstorm: "https://cdn.simpleicons.org/webstorm/white",
  replit: "https://cdn.simpleicons.org/replit/56676C",
  codesandbox: "https://cdn.simpleicons.org/codesandbox/151515",

  // Payment / SaaS
  stripe: "https://cdn.simpleicons.org/stripe/635BFF",
  paddle: "https://cdn.simpleicons.org/paddle/white",
  revenuecat: "https://cdn.simpleicons.org/revenuecat/white",
  lemon: "https://cdn.simpleicons.org/lemonsqueezy/8CFF3F",
  "lemon squeezy": "https://cdn.simpleicons.org/lemonsqueezy/8CFF3F",

  // Social / Comms
  slack: "https://cdn.simpleicons.org/slack/4A154B",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  zoom: "https://cdn.simpleicons.org/zoom/2D8CFF",
  teams: "https://cdn.simpleicons.org/microsoftteams/6264A7",
  "microsoft teams": "https://cdn.simpleicons.org/microsoftteams/6264A7",
  twitter: "https://cdn.simpleicons.org/x/white",
  x: "https://cdn.simpleicons.org/x/white",
  linkedin: "https://cdn.simpleicons.org/linkedin/0A66C2",
  youtube: "https://cdn.simpleicons.org/youtube/FF0000",
  tiktok: "https://cdn.simpleicons.org/tiktok/white",
  instagram: "https://cdn.simpleicons.org/instagram/E4405F",
  facebook: "https://cdn.simpleicons.org/facebook/0866FF",
  whatsapp: "https://cdn.simpleicons.org/whatsapp/25D366",
  telegram: "https://cdn.simpleicons.org/telegram/26A5E4",
  signal: "https://cdn.simpleicons.org/signal/3A76F0",

  // Tech Companies
  google: "https://cdn.simpleicons.org/google/4285F4",
  microsoft: "https://cdn.simpleicons.org/microsoft/5E5E5E",
  meta: "https://cdn.simpleicons.org/meta/0668E1",
  apple: "https://cdn.simpleicons.org/apple/white",
  macbook: "https://cdn.simpleicons.org/apple/white",
  iphone: "https://cdn.simpleicons.org/apple/white",
  samsung: "https://cdn.simpleicons.org/samsung/1428A0",
  nvidia: "https://cdn.simpleicons.org/nvidia/76B900",
  amd: "https://cdn.simpleicons.org/amd/ED1C24",
  intel: "https://cdn.simpleicons.org/intel/0071C5",

  // Entertainment
  spotify: "https://cdn.simpleicons.org/spotify/1ED760",
  netflix: "https://cdn.simpleicons.org/netflix/E50914",
  "apple music": "https://cdn.simpleicons.org/applemusic/FA243C",
  youtube_music: "https://cdn.simpleicons.org/youtubemusic/FF0000",

  // Automotive
  tesla: "https://cdn.simpleicons.org/tesla/CC0000",
  bmw: "https://cdn.simpleicons.org/bmw/0066B1",
  toyota: "https://cdn.simpleicons.org/toyota/EB0A1E",
  ford: "https://cdn.simpleicons.org/ford/003478",
  "mercedes-benz": "https://cdn.simpleicons.org/mercedes/white",
  mercedes: "https://cdn.simpleicons.org/mercedes/white",
  audi: "https://cdn.simpleicons.org/audi/BB0A30",
  volkswagen: "https://cdn.simpleicons.org/volkswagen/151F5D",
  porsche: "https://cdn.simpleicons.org/porsche/B12B28",
  hyundai: "https://cdn.simpleicons.org/hyundai/002C5F",
  kia: "https://cdn.simpleicons.org/kia/05141F",

  // Sports / Apparel
  nike: "https://cdn.simpleicons.org/nike/white",
  adidas: "https://cdn.simpleicons.org/adidas/white",
  puma: "https://cdn.simpleicons.org/puma/A30238",
  underarmour: "https://cdn.simpleicons.org/underarmour/1D1D1D",

  // Software / Creative
  unity: "https://cdn.simpleicons.org/unity/white",
  unrealengine: "https://cdn.simpleicons.org/unrealengine/white",
  blender: "https://cdn.simpleicons.org/blender/E87D0D",
  photoshop: "https://cdn.simpleicons.org/adobephotoshop/31A8FF",
  illustrator: "https://cdn.simpleicons.org/adobeillustrator/FF9A00",
  premiere: "https://cdn.simpleicons.org/adobepremierepro/9999FF",
  aftereffects: "https://cdn.simpleicons.org/adobeaftereffects/9999FF",
  canva: "https://cdn.simpleicons.org/canva/00C4CC",
  davinci: "https://cdn.simpleicons.org/davinciresolve/white",

  // Browsers / Security
  chrome: "https://cdn.simpleicons.org/googlechrome/4285F4",
  "google chrome": "https://cdn.simpleicons.org/googlechrome/4285F4",
  firefox: "https://cdn.simpleicons.org/firefox/FF7139",
  safari: "https://cdn.simpleicons.org/safari/006CFF",
  edge: "https://cdn.simpleicons.org/microsoftedge/0078D7",
  brave: "https://cdn.simpleicons.org/brave/FB542B",
  protonmail: "https://cdn.simpleicons.org/protonmail/6D4AFF",
  bitwarden: "https://cdn.simpleicons.org/bitwarden/175DDC",
  "1password": "https://cdn.simpleicons.org/1password/3B66BC",

  // OS
  linux: "https://cdn.simpleicons.org/linux/FCC624",
  ubuntu: "https://cdn.simpleicons.org/ubuntu/E95420",
  debian: "https://cdn.simpleicons.org/debian/A81D33",
  arch: "https://cdn.simpleicons.org/archlinux/1793D1",
  windows: "https://cdn.simpleicons.org/windows/0078D4",
  android: "https://cdn.simpleicons.org/android/34A853",
  ios: "https://cdn.simpleicons.org/apple/white",

  // Cities (flags via flagcdn for visual recognition)
  berlin: "https://flagcdn.com/w80/de.png",
  munich: "https://flagcdn.com/w80/de.png",
  "san francisco": "https://flagcdn.com/w80/us.png",
  "new york": "https://flagcdn.com/w80/us.png",
  london: "https://flagcdn.com/w80/gb.png",
  paris: "https://flagcdn.com/w80/fr.png",
  tokyo: "https://flagcdn.com/w80/jp.png",
  singapore: "https://flagcdn.com/w80/sg.png",
  amsterdam: "https://flagcdn.com/w80/nl.png",
  zurich: "https://flagcdn.com/w80/ch.png",

  // Misc
  tor: "https://cdn.simpleicons.org/torproject/7D4698",
  "tor browser": "https://cdn.simpleicons.org/torproject/7D4698",
  obsidian: "https://cdn.simpleicons.org/obsidian/7C3AED",
  logseq: "https://cdn.simpleicons.org/logseq/85C8C8",
  jira: "https://cdn.simpleicons.org/jira/0052CC",
  confluence: "https://cdn.simpleicons.org/confluence/172B4D",
  trello: "https://cdn.simpleicons.org/trello/0052CC",
  asana: "https://cdn.simpleicons.org/asana/F06A6A",
  monday: "https://cdn.simpleicons.org/monday/6161FF",
  clickup: "https://cdn.simpleicons.org/clickup/7B68EE",
};

const knownDomains: Record<string, string> = {
  supabase: "supabase.com",
  firebase: "firebase.google.com",
  cursor: "cursor.com",
  windsurf: "windsurf.com",
  vercel: "vercel.com",
  render: "render.com",
  paddle: "paddle.com",
  revenuecat: "revenuecat.com",
  linear: "linear.app",
  notion: "notion.so",
  figma: "figma.com",
  stripe: "stripe.com",
  railway: "railway.app",
  cloudflare: "cloudflare.com",
  netlify: "netlify.com",
  huggingface: "huggingface.co",
  replit: "replit.com",
  macbook: "apple.com",
  iphone: "apple.com",
  apple: "apple.com",
  samsung: "samsung.com",
  galaxy: "samsung.com",
  google: "google.com",
  microsoft: "microsoft.com",
  github: "github.com",
  gitlab: "gitlab.com",
  aws: "aws.amazon.com",
  azure: "azure.microsoft.com",
  gcp: "cloud.google.com",
  digitalocean: "digitalocean.com",
};

const logoEntries = Object.entries(knownLogos);
const domainEntries = Object.entries(knownDomains);

export const getEntityLogo = (entityName: string): string | null => {
  const key = entityName.toLowerCase().trim();
  if (knownLogos[key]) return knownLogos[key];

  for (let i = 0; i < logoEntries.length; i++) {
    const k = logoEntries[i][0];
    if (key.includes(k) || k.includes(key)) {
      return logoEntries[i][1];
    }
  }

  return null;
};

export const getEntityFavicon = (entityName: string): string | null => {
  const key = entityName.toLowerCase().trim();
  const domain = knownDomains[key];
  if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  for (let i = 0; i < domainEntries.length; i++) {
    const k = domainEntries[i][0];
    if (key.includes(k) || k.includes(key)) {
      return `https://www.google.com/s2/favicons?domain=${domainEntries[i][1]}&sz=64`;
    }
  }

  return null;
};

export const resolveLogo = (entityName: string): { url: string; source: "simple-icons" | "favicon" | "none" } | null => {
  const logo = getEntityLogo(entityName);
  if (logo) return { url: logo, source: "simple-icons" };

  const favicon = getEntityFavicon(entityName);
  if (favicon) return { url: favicon, source: "favicon" };

  return null;
};

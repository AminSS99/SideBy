const knownLogos: Record<string, string> = {
  supabase: "https://cdn.simpleicons.org/supabase/white",
  firebase: "https://cdn.simpleicons.org/firebase/FFCA28",
  cursor: "https://cursor.com/favicon.ico",
  windsurf: "https://windsurf.com/favicon.ico",
  vercel: "https://cdn.simpleicons.org/vercel/white",
  render: "https://cdn.simpleicons.org/render/white",
  paddle: "https://cdn.simpleicons.org/paddle/white",
  revenuecat: "https://cdn.simpleicons.org/revenuecat/white",
  chatgpt: "https://cdn.simpleicons.org/openai/white",
  openai: "https://cdn.simpleicons.org/openai/white",
  claude: "https://cdn.simpleicons.org/anthropic/white",
  anthropic: "https://cdn.simpleicons.org/anthropic/white",
  linear: "https://cdn.simpleicons.org/linear/5E6AD2",
  notion: "https://cdn.simpleicons.org/notion/white",
  figma: "https://cdn.simpleicons.org/figma/white",
  stripe: "https://cdn.simpleicons.org/stripe/white",
  railway: "https://cdn.simpleicons.org/railway/white",
  cloudflare: "https://cdn.simpleicons.org/cloudflare/white",
  netlify: "https://cdn.simpleicons.org/netlify/white",
  digitalocean: "https://cdn.simpleicons.org/digitalocean/0080FF",
  aws: "https://cdn.simpleicons.org/amazonwebservices/FF9900",
  amazon: "https://cdn.simpleicons.org/amazon/FF9900",
  azure: "https://cdn.simpleicons.org/microsoftazure/0078D4",
  gcp: "https://cdn.simpleicons.org/googlecloud/white",
  "google cloud": "https://cdn.simpleicons.org/googlecloud/white",
  huggingface: "https://cdn.simpleicons.org/huggingface/FFD21E",
  replit: "https://cdn.simpleicons.org/replit/white",
  macbook: "https://cdn.simpleicons.org/apple/white",
  iphone: "https://cdn.simpleicons.org/apple/white",
  apple: "https://cdn.simpleicons.org/apple/white",
  samsung: "https://cdn.simpleicons.org/samsung/white",
  galaxy: "https://cdn.simpleicons.org/samsung/white",
  gemini: "https://cdn.simpleicons.org/googlegemini/white",
  github: "https://cdn.simpleicons.org/github/white",
  gitlab: "https://cdn.simpleicons.org/gitlab/white",
  docker: "https://cdn.simpleicons.org/docker/white",
  kubernetes: "https://cdn.simpleicons.org/kubernetes/white",
  redis: "https://cdn.simpleicons.org/redis/white",
  mongodb: "https://cdn.simpleicons.org/mongodb/white",
  postgresql: "https://cdn.simpleicons.org/postgresql/white",
  mysql: "https://cdn.simpleicons.org/mysql/white",
  prisma: "https://cdn.simpleicons.org/prisma/white",
  nextjs: "https://cdn.simpleicons.org/nextdotjs/white",
  react: "https://cdn.simpleicons.org/react/61DAFB",
  vue: "https://cdn.simpleicons.org/vuedotjs/white",
  tailwindcss: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
  typescript: "https://cdn.simpleicons.org/typescript/3178C6",
  javascript: "https://cdn.simpleicons.org/javascript/F7DF1E",
  python: "https://cdn.simpleicons.org/python/3776AB",
  rust: "https://cdn.simpleicons.org/rust/white",
  go: "https://cdn.simpleicons.org/go/00ADD8",
  nodejs: "https://cdn.simpleicons.org/nodedotjs/white",
  slack: "https://cdn.simpleicons.org/slack/white",
  discord: "https://cdn.simpleicons.org/discord/white",
  zoom: "https://cdn.simpleicons.org/zoom/white",
  spotify: "https://cdn.simpleicons.org/spotify/1ED760",
  netflix: "https://cdn.simpleicons.org/netflix/E50914",
  google: "https://cdn.simpleicons.org/google/white",
  microsoft: "https://cdn.simpleicons.org/microsoft/white",
  meta: "https://cdn.simpleicons.org/meta/white",
  facebook: "https://cdn.simpleicons.org/facebook/0866FF",
  instagram: "https://cdn.simpleicons.org/instagram/white",
  twitter: "https://cdn.simpleicons.org/x/white",
  linkedin: "https://cdn.simpleicons.org/linkedin/0A66C2",
  youtube: "https://cdn.simpleicons.org/youtube/FF0000",
  tiktok: "https://cdn.simpleicons.org/tiktok/white",
  whatsapp: "https://cdn.simpleicons.org/whatsapp/25D366",
  telegram: "https://cdn.simpleicons.org/telegram/26A5E4",
  signal: "https://cdn.simpleicons.org/signal/3A76F0",
  protonmail: "https://cdn.simpleicons.org/protonmail/white",
  brave: "https://cdn.simpleicons.org/brave/FF5500",
  tor: "https://cdn.simpleicons.org/torproject/white",
  linux: "https://cdn.simpleicons.org/linux/white",
  windows: "https://cdn.simpleicons.org/windows/0078D4",
  android: "https://cdn.simpleicons.org/android/34A853",
  ios: "https://cdn.simpleicons.org/apple/white",
  tesla: "https://cdn.simpleicons.org/tesla/CC0000",
  bmw: "https://cdn.simpleicons.org/bmw/0066B1",
  toyota: "https://cdn.simpleicons.org/toyota/EB0A1E",
  ford: "https://cdn.simpleicons.org/ford/white",
  nike: "https://cdn.simpleicons.org/nike/white",
  adidas: "https://cdn.simpleicons.org/adidas/white",
  nvidia: "https://cdn.simpleicons.org/nvidia/76B900",
  amd: "https://cdn.simpleicons.org/amd/ED1C24",
  intel: "https://cdn.simpleicons.org/intel/0071C5",
  unity: "https://cdn.simpleicons.org/unity/white",
  unrealengine: "https://cdn.simpleicons.org/unrealengine/white",
  blender: "https://cdn.simpleicons.org/blender/F5792A",
  photoshop: "https://cdn.simpleicons.org/adobephotoshop/31A8FF",
  figma_design: "https://cdn.simpleicons.org/figma/white",
  canva: "https://cdn.simpleicons.org/canva/white",
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

export const getEntityLogo = (entityName: string): string | null => {
  const key = entityName.toLowerCase().trim();
  if (knownLogos[key]) return knownLogos[key];

  const match = Object.entries(knownLogos).find(([k]) =>
    key.includes(k) || k.includes(key),
  );
  if (match) return match[1];

  return null;
};

export const getEntityFavicon = (entityName: string): string | null => {
  const key = entityName.toLowerCase().trim();
  const domain = knownDomains[key];
  if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const match = Object.entries(knownDomains).find(([k]) =>
    key.includes(k) || k.includes(key),
  );
  if (match) return `https://www.google.com/s2/favicons?domain=${match[1]}&sz=64`;

  return null;
};

export const resolveLogo = (entityName: string): { url: string; source: "simple-icons" | "favicon" | "none" } | null => {
  const logo = getEntityLogo(entityName);
  if (logo) return { url: logo, source: "simple-icons" };

  const favicon = getEntityFavicon(entityName);
  if (favicon) return { url: favicon, source: "favicon" };

  return null;
};

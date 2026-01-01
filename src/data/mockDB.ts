export type ComparisonCategory = "travel" | "sports" | "education" | "tech" | "cars";

export interface ComparisonItem {
  id: string;
  category: ComparisonCategory;
  name: string;
  subtext: string;
  image: string;
  metrics: Record<string, any>;
  highlights: string[];
}

export const mockDB: ComparisonItem[] = [
  // TRAVEL
  {
    id: "hamburg", category: "travel", name: "Hamburg", subtext: "Germany",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    metrics: { safety: 88, budget: 85, culture: 88, transport: 92, climate: 70 },
    highlights: ["Maritime", "Techno", "Seafood"]
  },
  {
    id: "tokyo", category: "travel", name: "Tokyo", subtext: "Japan",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
    metrics: { safety: 98, budget: 60, culture: 95, transport: 99, climate: 80 },
    highlights: ["Cyberpunk", "Sushi", "Anime"]
  },
  {
    id: "barcelona", category: "travel", name: "Barcelona", subtext: "Spain",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
    metrics: { safety: 72, budget: 88, culture: 92, transport: 85, climate: 95 },
    highlights: ["Gothic", "Tapas", "Beach"]
  },
  // SPORTS
  {
    id: "real-madrid", category: "sports", name: "Real Madrid", subtext: "La Liga",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    metrics: { history: 99, squad: 98, fans: 99, form: 85, stadium: 95 },
    highlights: ["14 Champions Leagues", "Galacticos", "Royal"]
  },
  {
    id: "man-city", category: "sports", name: "Manchester City", subtext: "Premier League",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
    metrics: { history: 75, squad: 99, fans: 80, form: 98, stadium: 99 },
    highlights: ["Treble Winners", "Pep Guardiola", "Modern"]
  },
  // TECH
  {
    id: "macbook-m3", category: "tech", name: "MacBook Pro M3", subtext: "Apple",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    metrics: { power: 98, battery: 99, display: 99, value: 65, portability: 92 },
    highlights: ["M3 Max Chip", "Liquid Retina", "Ecosystem"]
  },
  {
    id: "dell-xps", category: "tech", name: "Dell XPS 15", subtext: "Dell",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    metrics: { power: 92, battery: 75, display: 95, value: 85, portability: 88 },
    highlights: ["InfinityEdge", "OLED Option", "Premium Build"]
  },
  // CARS
  {
    id: "porsche-911", category: "cars", name: "Porsche 911", subtext: "Stuttgart",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    metrics: { speed: 96, design: 99, tech: 88, economy: 40, prestige: 98 },
    highlights: ["Iconic Shape", "Rear Engine", "Precision"]
  },
  {
    id: "tesla-model-s", category: "cars", name: "Tesla Model S", subtext: "California",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
    metrics: { speed: 99, design: 85, tech: 99, economy: 95, prestige: 85 },
    highlights: ["Plaid Mode", "Autopilot", "Supercharging"]
  }
];
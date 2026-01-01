export type ComparisonCategory = "travel" | "sports" | "education" | "living" | "tech";

export interface ComparisonItem {
  id: string;
  category: ComparisonCategory;
  name: string;
  subtext: string;
  image: string;
  metrics: Record<string, number>;
  highlights: string[];
  specs: Record<string, string>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    trending: 'up' | 'down' | 'stable';
  };
}

export const mockDB: ComparisonItem[] = [
  // TECH (SMARTPHONES)
  {
    id: "iphone-15-pro", category: "tech", name: "iPhone 15 Pro", subtext: "Apple",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    metrics: { camera: 98, performance: 99, battery: 85, display: 96, value: 60 },
    highlights: ["Titanium", "A17 Pro", "USB-C"],
    specs: { "Processor": "A17 Pro", "Display": "6.1\" OLED", "Camera": "48MP Main", "Weight": "187g" },
    sentiment: { positive: 88, neutral: 10, negative: 2, trending: 'up' }
  },
  {
    id: "s24-ultra", category: "tech", name: "Galaxy S24 Ultra", subtext: "Samsung",
    image: "https://images.unsplash.com/photo-1707248590680-77a8298782a2?auto=format&fit=crop&w=800&q=80",
    metrics: { camera: 99, performance: 97, battery: 92, display: 98, value: 75 },
    highlights: ["Galaxy AI", "200MP Lens", "S-Pen"],
    specs: { "Processor": "SD 8 Gen 3", "Display": "6.8\" AMOLED", "Camera": "200MP Main", "Weight": "232g" },
    sentiment: { positive: 82, neutral: 12, negative: 6, trending: 'stable' }
  },
  // TRAVEL
  {
    id: "hamburg", category: "travel", name: "Hamburg", subtext: "Germany",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    metrics: { budget: 85, accessibility: 92, culture: 88, safety: 90, climate: 70 },
    highlights: ["Maritime", "Techno", "Seafood"],
    specs: { "Currency": "Euro", "Language": "German", "Airport": "HAM", "Walkability": "Excellent" },
    sentiment: { positive: 75, neutral: 20, negative: 5, trending: 'up' }
  },
  {
    id: "tokyo", category: "travel", name: "Tokyo", subtext: "Japan",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
    metrics: { budget: 60, accessibility: 98, culture: 95, safety: 98, climate: 80 },
    highlights: ["Cyberpunk", "Sushi", "Anime"],
    specs: { "Currency": "Yen", "Language": "Japanese", "Airport": "HND/NRT", "Walkability": "Elite" },
    sentiment: { positive: 96, neutral: 3, negative: 1, trending: 'up' }
  },
  // SPORTS
  {
    id: "real-madrid", category: "sports", name: "Real Madrid", subtext: "La Liga",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    metrics: { history: 99, squad: 98, fans: 99, form: 85, stadium: 95 },
    highlights: ["14 UCLs", "Galacticos", "Royal"],
    specs: { "Founded": "1902", "Stadium": "Bernabéu", "Coach": "Ancelotti", "League": "La Liga" },
    sentiment: { positive: 85, neutral: 10, negative: 5, trending: 'stable' }
  },
  {
    id: "man-city", category: "sports", name: "Manchester City", subtext: "Premier League",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
    metrics: { history: 75, squad: 99, fans: 80, form: 98, stadium: 99 },
    highlights: ["Treble", "Pep", "Modern"],
    specs: { "Founded": "1880", "Stadium": "Etihad", "Coach": "Guardiola", "League": "Prem" },
    sentiment: { positive: 65, neutral: 20, negative: 15, trending: 'up' }
  }
];
export type ComparisonCategory = "travel" | "sports" | "education" | "living";

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
  // CITIES (Travel Module)
  {
    id: "hamburg",
    category: "travel",
    name: "Hamburg",
    subtext: "Germany",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    metrics: {
      budget: 85, accessibility: 92, culture: 88, safety: 90, climate: 70, reputation: 82,
      cost: { hotels: 120, food: 45, flights: 300 }
    },
    highlights: ["Maritime", "Techno", "Cidre"]
  },
  {
    id: "tokyo",
    category: "travel",
    name: "Tokyo",
    subtext: "Japan",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
    metrics: {
      budget: 60, accessibility: 98, culture: 95, safety: 98, climate: 80, reputation: 96,
      cost: { hotels: 180, food: 60, flights: 900 }
    },
    highlights: ["Cyberpunk", "Sushi", "Anime"]
  },
  // FOOTBALL TEAMS (Sports Module)
  {
    id: "real-madrid",
    category: "sports",
    name: "Real Madrid",
    subtext: "La Liga • Spain",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    metrics: {
      history: 99, squadValue: 98, fanBase: 99, recentForm: 85, infrastructure: 95, globalImpact: 99,
      stats: { wins: 28, trophies: 35, stadiumCap: 81000 }
    },
    highlights: ["Kings of Europe", "Galacticos", "Bernabéu"]
  },
  {
    id: "man-city",
    category: "sports",
    name: "Manchester City",
    subtext: "Premier League • UK",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
    metrics: {
      history: 75, squadValue: 99, fanBase: 80, recentForm: 98, infrastructure: 99, globalImpact: 88,
      stats: { wins: 30, trophies: 10, stadiumCap: 53000 }
    },
    highlights: ["Tactical Genius", "Oil Wealth", "Treble Winners"]
  },
  // UNIVERSITIES (Education Module)
  {
    id: "harvard",
    category: "education",
    name: "Harvard University",
    subtext: "Cambridge, USA",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
    metrics: {
      research: 99, campusLife: 85, tuition: 20, employability: 98, location: 88, network: 99,
      info: { ranking: 1, acceptance: 4, cost: 75000 }
    },
    highlights: ["Ivy League", "Legacy", "Global Network"]
  },
  {
    id: "eth-zurich",
    category: "education",
    name: "ETH Zurich",
    subtext: "Zurich, Switzerland",
    image: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&w=800&q=80",
    metrics: {
      research: 97, campusLife: 75, tuition: 95, employability: 94, location: 99, network: 90,
      info: { ranking: 7, acceptance: 25, cost: 2000 }
    },
    highlights: ["STEM Leader", "Innovation", "Swiss Quality"]
  }
];
export interface CityData {
  id: string;
  name: string;
  country: string;
  tagline: string;
  image: string;
  metrics: {
    safety: number;
    cost: {
      hotels: number;
      food: number;
      flights: number;
    };
    climate: {
      temp: number[];
      bestMonth: string;
    };
    connectivity: {
      transport: number;
      walkability: number;
      flights: number;
    };
    culture: {
      tags: string[];
      languageScore: number;
    };
    purpose: {
      leisure: number;
      business: number;
      romance: number;
    };
  };
}

export const cities: CityData[] = [
  {
    id: "hamburg",
    name: "Hamburg",
    country: "Germany",
    tagline: "The Gateway to the World",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    metrics: {
      safety: 88,
      cost: { hotels: 120, food: 45, flights: 300 },
      climate: { temp: [2, 4, 8, 12, 16, 19, 21, 20, 17, 12, 7, 3], bestMonth: "June" },
      connectivity: { transport: 95, walkability: 90, flights: 85 },
      culture: { tags: ["Maritime", "Fish Market", "Techno", "Cidre"], languageScore: 92 },
      purpose: { leisure: 80, business: 90, romance: 70 }
    }
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    tagline: "Neon Dreams & Timeless Tradition",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
    metrics: {
      safety: 96,
      cost: { hotels: 180, food: 60, flights: 900 },
      climate: { temp: [6, 7, 10, 15, 19, 22, 26, 28, 24, 18, 13, 8], bestMonth: "April" },
      connectivity: { transport: 99, walkability: 92, flights: 95 },
      culture: { tags: ["Cyberpunk", "Sushi", "Anime", "Shrines"], languageScore: 65 },
      purpose: { leisure: 95, business: 95, romance: 75 }
    }
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    tagline: "Modernist Marvels & Mediterranean Soul",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
    metrics: {
      safety: 72,
      cost: { hotels: 140, food: 40, flights: 250 },
      climate: { temp: [12, 13, 15, 17, 20, 24, 27, 28, 25, 21, 16, 13], bestMonth: "September" },
      connectivity: { transport: 88, walkability: 95, flights: 90 },
      culture: { tags: ["Gothic", "Tapas", "Beach", "Gaudí"], languageScore: 85 },
      purpose: { leisure: 90, business: 70, romance: 95 }
    }
  }
];
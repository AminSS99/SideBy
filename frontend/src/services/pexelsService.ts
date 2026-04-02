/**
 * Pexels API Service
 * Fetches high-quality images for comparison items
 */

import { envConfig } from "@/config/env";

const PEXELS_API_KEY = envConfig.pexelsApiKey;
const PEXELS_BASE_URL = "https://api.pexels.com/v1";

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// Cache to avoid repeated API calls
const imageCache = new Map<string, PexelsPhoto[]>();

/**
 * Search for images on Pexels
 */
export const searchPexelsImages = async (
  query: string,
  perPage: number = 3,
): Promise<PexelsPhoto[]> => {
  if (!PEXELS_API_KEY) {
    return [];
  }

  // Check cache first
  const cacheKey = `${query.toLowerCase()}_${perPage}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsSearchResponse = await response.json();

    // Cache the results
    imageCache.set(cacheKey, data.photos);

    return data.photos;
  } catch (error) {
    console.error("Failed to fetch Pexels images:", error);
    return [];
  }
};

/**
 * Get a single image for an item (first result)
 */
export const getItemImage = async (
  itemName: string,
): Promise<PexelsPhoto | null> => {
  const photos = await searchPexelsImages(itemName, 1);
  return photos.length > 0 ? photos[0] : null;
};

/**
 * Get multiple images for an item (for gallery/carousel)
 */
export const getItemGallery = async (
  itemName: string,
  count: number = 5,
): Promise<PexelsPhoto[]> => {
  return await searchPexelsImages(itemName, count);
};

/**
 * Get curated photos (trending/popular)
 */
export const getCuratedPhotos = async (
  perPage: number = 6,
): Promise<PexelsPhoto[]> => {
  if (!PEXELS_API_KEY) {
    return [];
  }

  const cacheKey = `curated_${perPage}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `${PEXELS_BASE_URL}/curated?per_page=${perPage}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsSearchResponse = await response.json();
    imageCache.set(cacheKey, data.photos);

    return data.photos;
  } catch (error) {
    console.error("Failed to fetch curated photos:", error);
    return [];
  }
};

/**
 * Get smart search query based on item and category
 */
export const getSmartSearchQuery = (
  item: string,
  category?: string,
): string => {
  const itemLower = item.toLowerCase();

  // Common food items - be very specific
  const foodItems = [
    "pizza",
    "burger",
    "sushi",
    "pasta",
    "taco",
    "ramen",
    "steak",
    "salad",
    "sandwich",
    "wings",
    "noodles",
    "curry",
    "kebab",
  ];
  if (foodItems.some((food) => itemLower.includes(food))) {
    return `delicious ${item} food close up`;
  }

  // Sports teams - search for stadium or logo
  if (
    category === "sports" ||
    itemLower.includes("fc") ||
    itemLower.includes("united") ||
    itemLower.includes("munich") ||
    itemLower.includes("psg")
  ) {
    return `${item} football team logo`;
  }

  // Cities - search for landmarks
  if (category === "travel") {
    return `${item} city skyline`;
  }

  // Tech - search for code or laptop
  if (category === "tech") {
    return `${item} programming`;
  }

  // Gaming - search for gaming setup
  if (category === "gaming") {
    return `${item} gaming`;
  }

  // Food category fallback
  if (category === "food") {
    return `delicious ${item} food`;
  }

  // Auto - search for the car
  if (category === "auto") {
    return `${item} car`;
  }

  // Default - just use the item name
  return item;
};

export default {
  searchPexelsImages,
  getItemImage,
  getItemGallery,
  getCuratedPhotos,
  getSmartSearchQuery,
};

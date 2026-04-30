const TAVILY_API_KEY = () => process.env.TAVILY_API_KEY;
const TAVILY_API_URL = process.env.TAVILY_API_URL || "https://api.tavily.com/search";

type SearchResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

type SearchParams = {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
};

const searchTavily = async (params: SearchParams): Promise<SearchResult[]> => {
  const apiKey = TAVILY_API_KEY();
  if (!apiKey) { console.error("Tavily: no API key configured"); return []; }

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: params.query,
      search_depth: params.searchDepth || "basic",
      max_results: params.maxResults || 4,
      include_answer: false,
      include_raw_content: true,
      include_images: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`Tavily search error ${response.status} for "${params.query}": ${text.slice(0, 200)}`);
    return [];
  }

  const data = (await response.json()) as {
    results?: Array<{ title: string; url: string; content: string; score: number }>;
  };

  console.error(`Tavily found ${(data.results || []).length} results for "${params.query}"`);
  return (data.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content.slice(0, 600),
    score: r.score,
  }));
};

const searchGoogle = async (params: SearchParams): Promise<SearchResult[]> => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return [];

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", params.query);
  url.searchParams.set("num", String(params.maxResults || 4));

  const response = await fetch(url.toString());
  if (!response.ok) return [];

  const data = (await response.json()) as {
    items?: Array<{ title: string; link: string; snippet: string }>;
  };

  return (data.items || []).map((item) => ({
    title: item.title,
    url: item.link,
    content: item.snippet,
    score: 0.7,
  }));
};

export const searchWeb = async (
  query: string,
  maxResults = 4,
): Promise<SearchResult[]> => {
  const params: SearchParams = { query, maxResults, searchDepth: "basic" };

  const tavily = await searchTavily(params);
  if (tavily.length > 0) return tavily;

  const google = await searchGoogle(params);
  if (google.length > 0) return google;

  return [];
};

export const searchEntitySources = async (
  entityName: string,
): Promise<SearchResult[]> => {
  const queries = [
    `${entityName} pricing plans official`,
    `${entityName} features capabilities documentation`,
    `${entityName} review comparison pros cons`,
    `${entityName} integrations ecosystem`,
  ];

  const results: SearchResult[] = [];
  for (const q of queries) {
    const batch = await searchWeb(q, 2);
    for (const r of batch) {
      if (!results.find((existing) => existing.url === r.url)) {
        results.push(r);
      }
    }
  }

  return results.slice(0, 6);
};

export type { SearchResult, SearchParams };

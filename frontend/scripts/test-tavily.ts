import "dotenv/config";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = "https://api.tavily.com/search";

async function main() {
  console.log("Testing Tavily Search...");
  console.log("API Key exists:", !!TAVILY_API_KEY);
  try {
    const payload = {
      query: "React vs Vue",
      search_depth: "basic",
      max_results: 3,
      include_raw_content: true,
    };

    console.log("Sending request with Authorization Bearer header to:", TAVILY_API_URL);
    const start = Date.now();
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response body preview:", text.slice(0, 500));
    console.log("Time taken (ms):", Date.now() - start);
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

main().catch(console.error);

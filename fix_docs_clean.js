const fs = require('fs');

const filePath = 'frontend/src/pages/Docs.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const searchCacheBlock = `  const searchCache = useMemo(() => {
    const cache = new Map<string, string>();
    for (const article of articles) {
      cache.set(
        article.id,
        [article.title, article.summary, article.category, ...article.steps]
          .join(" ")
          .toLowerCase()
      );
    }
    return cache;
  }, []);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatches = category === "All" || article.category === category;
      let queryMatches = true;
      if (normalizedQuery.length > 0) {
        const searchString = searchCache.get(article.id) || "";
        queryMatches = searchString.includes(normalizedQuery);
      }
      return categoryMatches && queryMatches;
    });
  }, [category, query, searchCache]);`;

content = content.replace(
  /  const filteredArticles = useMemo\(\(\) => \{\n    const normalizedQuery = query\.trim\(\)\.toLowerCase\(\);\n    return articles\.filter\(\(article\) => \{\n      const categoryMatches = category === "All" \|\| article\.category === category;\n      const queryMatches =\n        normalizedQuery\.length === 0 \|\|\n        \[article\.title, article\.summary, article\.category, \.\.\.article\.steps\]\n          \.join\(" "\)\n          \.toLowerCase\(\)\n          \.includes\(normalizedQuery\);\n      return categoryMatches && queryMatches;\n    \}\);\n  \}, \[category, query\]\);/,
  searchCacheBlock
);

fs.writeFileSync(filePath, content);

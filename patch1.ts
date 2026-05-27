import fs from 'fs';

let content = fs.readFileSync('frontend/api/_lib/job-engine.ts', 'utf8');

const replacement1 = `    // Store facts in the production schema with optional pgvector embeddings.
    const entityByName = new Map(entityRows.map(e => [e.normalizedName, e]));
    const dimensionByName = new Map(dimensionRows.map(d => [d.name, d]));
    const sourceByUrl = new Map(sourceRows.map(s => [s.url, s]));

    for (const [index, fact] of uniqueFacts.entries()) {
      const entityName = fact.entity;
      const dimensionName = fact.dimension || "General";
      const citation = fact.citation || "";
      const entityRow =
        entityByName.get(entityName) ||
        entityRows[0];
      if (!entityRow) continue;
      const dimensionRow = dimensionByName.get(dimensionName);
      const sourceRow =
        sourceByUrl.get(citation) ||
        (citation ? sourceRows.find((source) => source.url.includes(citation) || citation.includes(source.url)) : undefined) ||
        sourceRows[0];`;

content = content.replace(
`    // Store facts in the production schema with optional pgvector embeddings.
    for (const [index, fact] of uniqueFacts.entries()) {
      const entityName = fact.entity;
      const dimensionName = fact.dimension || "General";
      const citation = fact.citation || "";
      const entityRow =
        entityRows.find((entity) => entity.normalizedName === entityName) ||
        entityRows[0];
      if (!entityRow) continue;
      const dimensionRow = dimensionRows.find((dimension) => dimension.name === dimensionName);
      const sourceRow =
        sourceRows.find((source) => source.url === citation) ||
        sourceRows.find((source) => citation && citation.includes(source.url)) ||
        sourceRows[0];`,
replacement1
);

fs.writeFileSync('frontend/api/_lib/job-engine.ts', content);

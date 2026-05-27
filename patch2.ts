import fs from 'fs';

let content = fs.readFileSync('frontend/api/_lib/job-engine.ts', 'utf8');

const replacement = `    // Store scores
    const entityByName = new Map(entityRows.map(e => [e.normalizedName, e]));
    const dimensionByName = new Map(dimensionRows.map(d => [d.name, d]));
    for (const score of result.data) {
      const entityRow =
        entityByName.get(score.entity) ||
        entityRows[0];
      const dimensionRow =
        dimensionByName.get(score.dimension) ||
        dimensionRows[0];`;

content = content.replace(
`    // Store scores
    for (const score of result.data) {
      const entityRow =
        entityRows.find((entity) => entity.normalizedName === score.entity) ||
        entityRows[0];
      const dimensionRow =
        dimensionRows.find((dimension) => dimension.name === score.dimension) ||
        dimensionRows[0];`,
replacement
);

fs.writeFileSync('frontend/api/_lib/job-engine.ts', content);

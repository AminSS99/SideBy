import fs from 'fs';

let content = fs.readFileSync('frontend/api/_lib/job-engine.ts', 'utf8');

const replacement = `    // Group facts by dimension for categories
    const factsByDim = new Map<string, typeof facts>();
    for (const f of facts) {
      const dimName = f.category || "General";
      if (!factsByDim.has(dimName)) factsByDim.set(dimName, []);
      factsByDim.get(dimName)!.push(f);
    }

    const dimById = new Map(dims.map((d) => [d.id, d]));
    const scoreByDimNameAndEntityId = new Map(scores.map(s => {
      const dim = dimById.get(s.dimensionId);
      return [\`\${dim?.name}|\${s.entityId}\`, s.score];
    }));

    const categories = Array.from(factsByDim.entries()).map(([name, dimFacts]) => {
      const aScore = scoreByDimNameAndEntityId.get(\`\${name}|\${entityA.id}\`) ?? 50;
      const bScore = scoreByDimNameAndEntityId.get(\`\${name}|\${entityB.id}\`) ?? 50;
      return {`;

content = content.replace(
`    // Group facts by dimension for categories
    const factsByDim = new Map<string, typeof facts>();
    for (const f of facts) {
      const dimName = f.category || "General";
      if (!factsByDim.has(dimName)) factsByDim.set(dimName, []);
      factsByDim.get(dimName)!.push(f);
    }

    const categories = Array.from(factsByDim.entries()).map(([name, dimFacts]) => {
      const dimScores = scores.filter((s) => {
        const dim = dims.find((d) => d.id === s.dimensionId);
        return dim?.name === name;
      });
      const aScore = dimScores.find((s) => s.entityId === entityA.id)?.score ?? 50;
      const bScore = dimScores.find((s) => s.entityId === entityB.id)?.score ?? 50;
      return {`,
replacement
);

fs.writeFileSync('frontend/api/_lib/job-engine.ts', content);

import fs from 'fs';

let content = fs.readFileSync('frontend/api/_lib/job-engine.ts', 'utf8');

const replacement = `    verdict: {
      ...verdictSlots,
      summary: getVerdictText(verdict),
    },
    categories: (() => {
      const scoreByDimAndEntity = new Map(scores.map(s => [\`\${s.dimension}|\${s.entity}\`, s.score]));

      return dimensions.map((dim) => {
        const aScore = scoreByDimAndEntity.get(\`\${dim.name}|\${entityA?.name}\`) ?? 0;
        const bScore = scoreByDimAndEntity.get(\`\${dim.name}|\${entityB?.name}\`) ?? 0;

        return {
          name: dim.name,
          winner: aScore > bScore ? "a" : bScore > aScore ? "b" : "tie",
          verdict: \`\${dim.name} comparison based on source-backed facts.\`,
          facts: facts
            .filter((f) => f.dimension === dim.name)
            .map((f) => {
              const matchedSource = findSource(f.citation);
              return {
                entity: f.entity === entityA?.name ? "a" : "b",
                label: f.dimension,
                value: f.value,
                source: matchedSource?.title || f.citation || "Web sources",
                sourceUrl: f.citation || matchedSource?.url || "#",
                sourceTitle: matchedSource?.title || (f.citation ? "Cited source" : "Source"),
                confidence: f.confidence,
                freshness: taxonomySummary.safetyLevel === "informational" ? "Monitor" as const : "Fresh" as const,
                changed: false,
              };
            }),
        };
      });
    })(),
    dimensions: (() => {
      const scoreByDimAndEntity = new Map(scores.map(s => [\`\${s.dimension}|\${s.entity}\`, s.score]));

      return dimensions.map((dim) => {
        return {
          subject: dim.name,
          a: scoreByDimAndEntity.get(\`\${dim.name}|\${entityA?.name}\`) ?? 50,
          b: scoreByDimAndEntity.get(\`\${dim.name}|\${entityB?.name}\`) ?? 50,
          fullMark: 100,
        };
      });
    })(),
    consensus:`;

content = content.replace(
`    verdict: {
      ...verdictSlots,
      summary: getVerdictText(verdict),
    },
    categories: dimensions.map((dim) => {
      const dimScores = scores.filter((s) => s.dimension === dim.name);
      const aScore = dimScores.find((s) => s.entity === entityA?.name)?.score ?? 0;
      const bScore = dimScores.find((s) => s.entity === entityB?.name)?.score ?? 0;

      return {
        name: dim.name,
        winner: aScore > bScore ? "a" : bScore > aScore ? "b" : "tie",
        verdict: \`\${dim.name} comparison based on source-backed facts.\`,
        facts: facts
          .filter((f) => f.dimension === dim.name)
          .map((f) => {
            const matchedSource = findSource(f.citation);
            return {
              entity: f.entity === entityA?.name ? "a" : "b",
              label: f.dimension,
              value: f.value,
              source: matchedSource?.title || f.citation || "Web sources",
              sourceUrl: f.citation || matchedSource?.url || "#",
              sourceTitle: matchedSource?.title || (f.citation ? "Cited source" : "Source"),
              confidence: f.confidence,
              freshness: taxonomySummary.safetyLevel === "informational" ? "Monitor" as const : "Fresh" as const,
              changed: false,
            };
          }),
      };
    }),
    dimensions: dimensions.map((dim) => {
      const dimScores = scores.filter((s) => s.dimension === dim.name);
      return {
        subject: dim.name,
        a: dimScores.find((s) => s.entity === entityA?.name)?.score ?? 50,
        b: dimScores.find((s) => s.entity === entityB?.name)?.score ?? 50,
        fullMark: 100,
      };
    }),
    consensus:`,
replacement
);

fs.writeFileSync('frontend/api/_lib/job-engine.ts', content);

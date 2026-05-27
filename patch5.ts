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
    })(),`;

const optimizedReplacement = `    verdict: {
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
    })(),`;

const finalReplacement = `    verdict: {
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
    })(),`;

content = content.replace(replacement, `    verdict: {
      ...verdictSlots,
      summary: getVerdictText(verdict),
    },
    ...(() => {
      const scoreByDimAndEntity = new Map(scores.map(s => [\`\${s.dimension}|\${s.entity}\`, s.score]));
      return {
        categories: dimensions.map((dim) => {
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
        }),
        dimensions: dimensions.map((dim) => {
          return {
            subject: dim.name,
            a: scoreByDimAndEntity.get(\`\${dim.name}|\${entityA?.name}\`) ?? 50,
            b: scoreByDimAndEntity.get(\`\${dim.name}|\${entityB?.name}\`) ?? 50,
            fullMark: 100,
          };
        })
      };
    })(),`);

fs.writeFileSync('frontend/api/_lib/job-engine.ts', content);

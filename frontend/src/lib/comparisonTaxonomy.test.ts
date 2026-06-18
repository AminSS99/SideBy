import { describe, it, expect } from 'vitest';
import { extractComparisonEntities } from './comparisonTaxonomy';

describe('extractComparisonEntities', () => {
  it.each([
    // Happy paths
    { query: 'React vs Vue', expected: { entityA: 'React', entityB: 'Vue' } },
    { query: 'Supabase vs Firebase', expected: { entityA: 'Supabase', entityB: 'Firebase' } },

    // With periods and varying spaces
    { query: 'React vs. Vue', expected: { entityA: 'React', entityB: 'Vue' } },
    { query: 'React   vs    Vue', expected: { entityA: 'React', entityB: 'Vue' } },
    { query: 'React vs.   Vue', expected: { entityA: 'React', entityB: 'Vue' } },

    // Case insensitivity
    { query: 'react VS vue', expected: { entityA: 'react', entityB: 'vue' } },
    { query: 'react vS. vue', expected: { entityA: 'react', entityB: 'vue' } },

    // Missing vs
    { query: 'React and Vue', expected: { entityA: '', entityB: '' } },
    { query: 'Just React', expected: { entityA: '', entityB: '' } },
    { query: '', expected: { entityA: '', entityB: '' } },

    // With context (for)
    { query: 'React vs Vue for a startup', expected: { entityA: 'React', entityB: 'Vue' } },
    { query: 'React vs Vue For building apps', expected: { entityA: 'React', entityB: 'Vue' } },
    { query: 'Supabase vs Firebase for SaaS', expected: { entityA: 'Supabase', entityB: 'Firebase' } },

    // Multiple vs (it splits on first vs, joins rest with vs)
    // "React vs Vue vs Angular" -> parts = ["React", "Vue", "Angular"]
    // parts[0] -> "React"
    // parts.slice(1).join(" vs ") -> "Vue vs Angular"
    // split for -> ["Vue vs Angular"]
    { query: 'React vs Vue vs Angular', expected: { entityA: 'React', entityB: 'Vue vs Angular' } },

    // Edge cases with other context keywords inside the entity cleaning
    // Clean entity removes everything after 'for', 'with', 'inside', 'on', 'because', 'when', 'as', 'to'
    { query: 'React vs Vue with TypeScript', expected: { entityA: 'React', entityB: 'Vue' } },
    { query: 'Next.js vs Remix.run', expected: { entityA: 'Next.js', entityB: 'Remix.run' } },
    { query: 'C# vs C++', expected: { entityA: 'C', entityB: 'C++' } },
  ])('extracts $expected from "$query"', ({ query, expected }) => {
    const result = extractComparisonEntities(query);
    expect(result).toEqual(expected);
  });
});

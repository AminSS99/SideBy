import { describe, it, expect } from 'vitest';
import { extractComparisonEntities, hasExplicitContext } from '../comparisonTaxonomy';

describe('extractComparisonEntities', () => {
  const testCases = [
    { query: 'React vs Angular', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs. Angular', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React VS Angular', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Vue vs Angular', expected: { entityA: 'React', entityB: 'Vue vs Angular' } },
    { query: 'React! vs Angular?', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React and Angular', expected: { entityA: '', entityB: '' } },
    { query: 'React vs Angular for web development', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Angular with TypeScript', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Angular inside monorepos', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Angular on mobile', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Angular because of speed', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Angular when building apps', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Angular as a framework', expected: { entityA: 'React', entityB: 'Angular' } },
    { query: 'React vs Angular to learn', expected: { entityA: 'React', entityB: 'Angular' } }
  ];

  it.each(testCases)('should correctly parse: "$query"', ({ query, expected }) => {
    expect(extractComparisonEntities(query)).toEqual(expected);
  });
});

describe('hasExplicitContext', () => {
  const contextTestCases = [
    { query: 'React vs Angular for beginners', expected: true },
    { query: 'Next.js vs Remix as a fullstack framework', expected: true },
    { query: 'Python vs JavaScript when building apis', expected: true },
    { query: 'Docker vs Kubernetes inside production', expected: true },
    { query: 'Typescript vs Javascript with React', expected: true },
    { query: 'React vs Angular', expected: false },
    { query: 'What is React?', expected: false },
    { query: 'React vs Angular for', expected: false },
  ];

  it.each(contextTestCases)('should evaluate: "$query" as $expected', ({ query, expected }) => {
    expect(hasExplicitContext(query)).toBe(expected);
  });
});

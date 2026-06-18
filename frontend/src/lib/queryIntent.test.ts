import { describe, it, expect, vi } from 'vitest';
import { analyzeQueryIntent } from './queryIntent';
import * as comparisonTaxonomy from './comparisonTaxonomy';

describe('analyzeQueryIntent', () => {
  it('should map the result from analyzeComparisonQuery to QueryIntent format correctly', () => {
    // We mock the underlying function to test just the mapping logic of analyzeQueryIntent
    vi.spyOn(comparisonTaxonomy, 'analyzeComparisonQuery').mockReturnValue({
      status: 'ready',
      canStart: true,
      confidence: 0.95,
      entityA: 'React',
      entityB: 'Vue',
      category: 'software',
      label: 'Software Framework',
      safetyLevel: 'standard',
      message: 'Comparing React and Vue.',
      suggestion: 'React vs Vue for small projects',
      disclaimer: 'This is just a test',
      policyNote: 'None',
      sourceRequirements: [],
      signals: []
    });

    const result = analyzeQueryIntent('React vs Vue');

    expect(result).toEqual({
      status: 'ready',
      canStart: true,
      confidence: 0.95,
      entityA: 'React',
      entityB: 'Vue',
      category: 'software',
      categoryLabel: 'Software Framework',
      safetyLevel: 'standard',
      message: 'Comparing React and Vue.',
      suggestion: 'React vs Vue for small projects',
      disclaimer: 'This is just a test',
      policyNote: 'None',
    });

    expect(comparisonTaxonomy.analyzeComparisonQuery).toHaveBeenCalledWith('React vs Vue');
  });

  it('should handle missing optional fields in analyzeComparisonQuery response', () => {
    vi.spyOn(comparisonTaxonomy, 'analyzeComparisonQuery').mockReturnValue({
      status: 'needs_entities',
      canStart: false,
      confidence: 0.1,
      entityA: null,
      entityB: null,
      category: 'unsupported',
      label: 'Unsupported',
      safetyLevel: 'blocked',
      message: 'Invalid query.',
      sourceRequirements: [],
      signals: []
    });

    const result = analyzeQueryIntent('just random text');

    expect(result).toEqual({
      status: 'needs_entities',
      canStart: false,
      confidence: 0.1,
      entityA: null,
      entityB: null,
      category: 'unsupported',
      categoryLabel: 'Unsupported',
      safetyLevel: 'blocked',
      message: 'Invalid query.',
      suggestion: undefined,
      disclaimer: undefined,
      policyNote: undefined,
    });
  });
});

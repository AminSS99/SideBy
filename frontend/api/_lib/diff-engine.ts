/**
 * Structural JSON diffing engine for SideBy comparison results.
 */

export interface DiffDimension {
  subject: string;
  a: number;
  b: number;
  fullMark: number;
}

export interface DiffFact {
  entity: string;
  label?: string;
  dimension?: string;
  value: string;
  source: string;
  sourceUrl: string;
}

export interface DiffCategory {
  name: string;
  facts: DiffFact[];
}

export interface DiffResult {
  dimensions?: DiffDimension[];
  categories?: DiffCategory[];
}

export interface ScoreDiff {
  dimension: string;
  oldA: number;
  newA: number;
  deltaA: number;
  oldB: number;
  newB: number;
  deltaB: number;
}

export interface FactDiffItem {
  entity: string;
  dimension: string;
  value: string;
  source: string;
  sourceUrl: string;
}

export interface DiffOutput {
  diff: {
    scores: ScoreDiff[];
    facts: {
      added: FactDiffItem[];
      removed: FactDiffItem[];
    };
  };
  thresholdBreached: boolean;
  alertThreshold: number;
}

export function computeResultDiff(
  oldResult: DiffResult | null | undefined,
  newResult: DiffResult | null | undefined,
  alertThreshold = 0.1,
): DiffOutput {
  const scoreDiffs: ScoreDiff[] = [];
  let thresholdBreached = false;

  const oldDimensions = oldResult?.dimensions || [];
  const newDimensions = newResult?.dimensions || [];

  const allSubjects = Array.from(
    new Set([
      ...oldDimensions.map((d) => d.subject),
      ...newDimensions.map((d) => d.subject),
    ]),
  );

  for (const subject of allSubjects) {
    const oldDim = oldDimensions.find((d) => d.subject === subject);
    const newDim = newDimensions.find((d) => d.subject === subject);

    const oldA = oldDim ? oldDim.a : 50;
    const oldB = oldDim ? oldDim.b : 50;
    const newA = newDim ? newDim.a : 50;
    const newB = newDim ? newDim.b : 50;

    const deltaA = newA - oldA;
    const deltaB = newB - oldB;

    if (deltaA !== 0 || deltaB !== 0) {
      scoreDiffs.push({
        dimension: subject,
        oldA,
        newA,
        deltaA,
        oldB,
        newB,
        deltaB,
      });

      if (Math.abs(deltaA) >= alertThreshold * 100 || Math.abs(deltaB) >= alertThreshold * 100) {
        thresholdBreached = true;
      }
    }
  }

  const oldFacts = (oldResult?.categories || []).flatMap((c) => c.facts || []);
  const newFacts = (newResult?.categories || []).flatMap((c) => c.facts || []);

  const oldFactSet = new Set(oldFacts.map((f) => f.value));
  const newFactSet = new Set(newFacts.map((f) => f.value));

  const addedFacts = newFacts
    .filter((f) => !oldFactSet.has(f.value))
    .map((f) => ({
      entity: f.entity,
      dimension: f.label || f.dimension || "",
      value: f.value,
      source: f.source,
      sourceUrl: f.sourceUrl,
    }));

  const removedFacts = oldFacts
    .filter((f) => !newFactSet.has(f.value))
    .map((f) => ({
      entity: f.entity,
      dimension: f.label || f.dimension || "",
      value: f.value,
      source: f.source,
      sourceUrl: f.sourceUrl,
    }));

  return {
    diff: {
      scores: scoreDiffs,
      facts: {
        added: addedFacts,
        removed: removedFacts,
      },
    },
    thresholdBreached,
    alertThreshold,
  };
}

import { useState, useEffect, useMemo, useRef } from "react";
import { analyzeQueryIntent, type QueryIntent } from "@/lib/queryIntent";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

export interface UseComparisonValidationProps {
  initialEntityA?: string;
  initialEntityB?: string;
  initialContext?: string;
}

export function useComparisonValidation({
  initialEntityA = "",
  initialEntityB = "",
  initialContext = "",
}: UseComparisonValidationProps = {}) {
  const [entityA, setEntityA] = useState(initialEntityA);
  const [entityB, setEntityB] = useState(initialEntityB);
  const [context, setContext] = useState(initialContext);

  const [isValidating, setIsValidating] = useState(false);
  const [validatedQuery, setValidatedQuery] = useState("");
  const [validatedIntent, setValidatedIntent] = useState<QueryIntent | null>(null);

  const validationSequence = useRef(0);

  // Derive canonical query representation
  const serializedQuery = useMemo(() => {
    const a = entityA.trim();
    const b = entityB.trim();
    const c = context.trim();

    if (!a && !b) return "";
    let base = "";
    if (a && b) {
      base = `${a} vs ${b}`;
    } else {
      base = a || b;
    }

    if (c) {
      return `${base} for ${c}`;
    }
    return base;
  }, [entityA, entityB, context]);

  // Compute local query intent instantly for fast visual feedback
  const localIntent = useMemo(() => {
    return analyzeQueryIntent(serializedQuery);
  }, [serializedQuery]);
  const hasBothEntities = Boolean(entityA.trim() && entityB.trim());

  // If the serializedQuery matches the one that was validated, use the API's intent.
  // Otherwise, fallback to the local static parser intent.
  const queryIntent = useMemo(() => {
    if (validatedQuery === serializedQuery.trim() && validatedIntent) {
      return validatedIntent;
    }
    return localIntent;
  }, [serializedQuery, validatedQuery, validatedIntent, localIntent]);

  const validateQuery = async (queryToValidate: string) => {
    const clean = queryToValidate.trim();
    const staticIntent = analyzeQueryIntent(clean);

    // If static analysis says we absolutely cannot start (e.g. no entities or block-listed terms),
    // don't waste API quota.
    if (!staticIntent.canStart) {
      setValidatedQuery(clean);
      setValidatedIntent(staticIntent);
      return;
    }

    const sequence = ++validationSequence.current;
    setIsValidating(true);

    try {
      const response = await apiFetch(buildApiUrl("/api/comparisons/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean }),
      }, { retries: 0 });

      if (!response.ok) {
        throw new Error("Validation endpoint returned error");
      }

      const data = (await response.json()) as { intent: QueryIntent & { label?: string } };

      // Prevent race conditions: ignore response if a newer keystroke has started validation
      if (sequence === validationSequence.current) {
        setValidatedQuery(clean);
        setValidatedIntent({
          ...data.intent,
          categoryLabel: data.intent.categoryLabel || data.intent.label,
        });
      }
    } catch {
      // Fallback to local static check on network/API failure
      if (sequence === validationSequence.current) {
        setValidatedQuery(clean);
        setValidatedIntent(staticIntent);
      }
    } finally {
      if (sequence === validationSequence.current) {
        setIsValidating(false);
      }
    }
  };

  // Debounced API validation hook
  useEffect(() => {
    const clean = serializedQuery.trim();
    setValidatedIntent(null);
    setValidatedQuery("");

    if (!clean || !hasBothEntities || !localIntent.canStart) {
      validationSequence.current += 1;
      setIsValidating(false);
      return;
    }

    // Debounce validation requests to the backend
    const timeout = setTimeout(() => {
      void validateQuery(clean);
    }, 450);

    return () => clearTimeout(timeout);
  }, [serializedQuery, localIntent.canStart, hasBothEntities]);

  // Set individual inputs from a full query string (e.g., when clicking suggestions)
  const setFromFullQuery = (fullQuery: string) => {
    const intent = analyzeQueryIntent(fullQuery);
    setEntityA(intent.entityA || "");
    setEntityB(intent.entityB || "");

    // Extract context: look for "for " pattern
    const match = fullQuery.match(/\s+for\s+(.+)$/i);
    setContext(match ? match[1].trim() : "");
  };

  const isBlocked = queryIntent.canStart === false && serializedQuery.trim().length > 0;
  const isIncomplete = serializedQuery.trim().length > 0 && !hasBothEntities;

  return {
    entityA,
    setEntityA,
    entityB,
    setEntityB,
    context,
    setContext,
    serializedQuery,
    queryIntent,
    isValidating,
    isBlocked: isBlocked && !isIncomplete,
    isIncomplete,
    setFromFullQuery,
  };
}

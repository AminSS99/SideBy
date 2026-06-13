1. **Analyze Bottlenecks:** Locate `O(n^2)` or `O(N*M)` nested loop lookups using `.find()` inside arrays across the application layers.
2. **Refactor `frontend/api/_lib/diff-engine.ts`:** Convert `oldDimensions.find()` and `newDimensions.find()` inside the `for (const subject of allSubjects)` loop to use `Map` lookups.
3. **Refactor `frontend/src/pages/app/ChatPage.tsx`:** Convert `current.find()` inside `indexedDocuments.map()` to use a pre-computed `Map`.
4. **Refactor `frontend/api/_lib/job-engine.ts`:**
    - In `executeExtractPhase`, convert `sources.find((s) => s.url === url)` inside the `for (const url of topUrls)` loop to use a `Map`.
5. **Run tests/builds:** Ensure the app still builds and works as expected.
6. **Submit PR:** Follow PR title instructions `⚡ Bolt: Performance Strike - [Subsystem Optimized]`.

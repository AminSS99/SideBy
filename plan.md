1. **Optimize `runFactsStep`**: The `uniqueFacts` loop calls `entityRows.find`, `dimensionRows.find`, and `sourceRows.find` for each fact. Convert `entityRows`, `dimensionRows`, and `sourceRows` into Maps before the loop.
   - `entityMap`: keys are `normalizedName`, values are `entityRow`.
   - `dimensionMap`: keys are `name`, values are `dimensionRow`.
   - `sourceMap`: keys are `url`, values are `sourceRow`. We can handle the `includes` fallback by checking if the URL string has a matched key in `sourceMap`.

2. **Optimize `runScoresStep`**: The `result.data` loop calls `entityRows.find` and `dimensionRows.find` for each score. Convert `entityRows` and `dimensionRows` into Maps.

3. **Optimize `legacyGenerateResult`**: The `dimensions.map` calls `dimScores.find` for each entity inside a nested `.map`. Convert `scores` into a nested Map or Map of `[dimensionName, entityName] -> score`.

4. **Optimize `getPartialResult`**:
   - `dims.find` in `categories` generation: Create a Map of `dimsById`.
   - `dimScores.find`: Create a Map of `dimScoresByEntityId`.

5. *Complete pre commit steps*
   - Run verification, build, and tests for the frontend to ensure these changes do not break the API/UI.

6. *Submit PR*: Submit changes with title "⚡ Bolt: Performance Strike - Job Engine Data Pipeline".

# Next execution: WEB-P0-01 release truth and mobile recovery

Goal: establish one reliable, current SideBy release baseline before new visual or feature expansion. Current remote truth on 2026-10-27: PR #165 is CLOSED without merge (mergedAt null); its head remains 62885b9, while remote main is 7b68aee. Current production deployment status is unknown in this program.

## Scope and ownership

SideBy web/PWA only. Preserve unrelated working-tree changes, Core authority and sibling iOS work. Do not merge/deploy production without the user's release instruction. Use the closed PR #165 as historical reference. Do not reopen it blindly or assume its checks apply to current main. Determine the intended repair/release branch against current remote main and preserve unrelated work.

## Steps

1. Record current remote main, PR head/status, preview and production build SHA, branch/working-tree status and artifact provenance. Do not assume the October 19 preview is still current on October 27.
2. Remote main source still has the cached-user loop pattern and unstable session identity. Local d63d881 has the cache-loop breaker and now a session memoization increment with 4 passing regression tests. Prepare both halves together against current remote main; inspect deployed production independently and verify the actual candidate.
3. Validate the isolated proposed merge: types, lint, unit, relevant browser suites and normal production build with test bypass disabled. Existing mocked specs and real worker lifecycle checks must remain separate.
4. Run the new static artifact checker and save its report for the selected production artifact. Add CI integration only after confirming correct build path/order and keeping current real-worker browser tests.
5. Verify Core environment/tenant mappings and migration 019 in the intended test/production environments with read-only metadata checks; do not apply migrations blindly or print credentials.
6. Complete preview signup/sign-in/sign-out with a human where CAPTCHA/verification requires it, preserve comparison intent and test two-minute stability, refresh and foreground return. Report blocked boundaries honestly.
7. Physical iPhone owner runs the same context that crashed; record model, OS, browser/installed mode, SHA, before/after and outcome. A successful auth run closes only that incident reproduction, not the entire hardware checklist.
8. Investigate the known cookie/update collision and absent marketing navigation on the actual candidate. If present, implement one shared overlay arrangement and an accessible mobile menu using existing primitives; verify viewport/keyboard/focus and desktop regressions.
9. Create a release decision record with open gates, rollback, measured risks and next admitted batch. No generic “greatest/100% ready” conclusion.

## Acceptance

- Exact build identities and one authoritative release status recorded.
- Auth loop absent in candidate under regression tests and real signed-in journey; device evidence or explicit pending gate.
- No test-auth bypass in deployable artifact.
- Required schema/constraint evidence tied to environment; no secret in reports.
- Static artifact checks and existing release gates pass or specific failures block promotion.
- Mobile controls remain visible and accessible if the layout batch is executed.
- Core paid authority unchanged; no unrelated work included.

## Then: WEB-P1-02 containment and decision trust

Inventory route/panel boundaries and simulate one optional chart/provider/Core failure. Keep shell/history and other authorized functions usable. Reconcile existing security findings with actual code. Specify F01/F02/F06 only after reviewing current decision/version/matrix capabilities with representative tasks. Do not build thirty speculative features at once.

## Handoff prompt

> Execute WEB-P0-01 in docs/product-program/12_NEXT_EXECUTION.md using applicable AGENTS.md instructions. Preserve unrelated edits and native work. Reconcile current remote/preview/production state, validate the exact merge artifact, run the static artifact checker, verify auth/migration boundaries, and repair observed mobile overlay/navigation defects in a coherent reviewed batch. Keep hardware and human-auth blockers explicit. Return actual changes, evidence, unresolved risks and the next batch. Do not deploy production solely on the basis of this document.

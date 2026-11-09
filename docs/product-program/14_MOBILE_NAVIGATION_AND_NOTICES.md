# WEB-UI-001 — Mobile navigation and coordinated notices

Date: 2026-10-27.
State: implemented locally; validation deferred by explicit user instruction to continue development without testing for now.

## User-visible changes

- Marketing header gains an Explore SideBy menu on viewports below 768px, with Home, Features, Pricing, Docs, About and Open workbench.
- Existing desktop tubelight navigation remains. The mobile floating marketing strip is replaced by the header menu to reduce fixed controls around the composer.
- Menu uses Radix Dialog with a bottom-sheet treatment, current-route labels, route-change closure, desktop-resize closure, close button, reduced-motion variants and safe-area padding.
- Update prompt and cookie choices now participate in one fixed notice stack, with update above consent and scrolling when combined content exceeds available height.
- Stack reserves the existing workbench navigation clearance on narrow screens. Its measured height and offset are published through one CSS variable so Sonner toasts are positioned above it.
- Cookie settings use a portal-backed dialog with title/description, focus handling, dismissal and bounded viewport height. Reopening settings restores actual saved consent rather than stale unsaved toggle edits.
- Update prompt close and primary controls have larger touch targets. Existing save/discard update behavior is retained.

## Files

New: `frontend/src/components/brand/MobileMarketingMenu.tsx`, `frontend/src/components/layout/BottomNoticeStack.tsx`, `frontend/src/components/layout/bottom-notices.css`.

Edited: `frontend/src/components/brand/MarketingNav.tsx`, `frontend/src/App.tsx`, `frontend/src/components/privacy/CookieConsent.tsx`, `frontend/src/components/pwa/UpdatePrompt.tsx`, `frontend/src/components/ui/sonner.tsx`.

Existing unrelated edits in shared files were preserved. This batch is separate from PR #174; it has not been committed, pushed, merged or deployed.

## Deferred checks — not passed

1. Typecheck, lint, unit/browser regression and production build.
2. Menu focus containment, Escape, close, current-page link, resize and focus restoration.
3. Consent accept/reject, GPC, cancel/reopen and opening settings from footer.
4. Update prompt plus consent banner plus toast at 320/390/430px, landscape and large text.
5. Workbench bottom controls and notice reachability with keyboard open.
6. Notice-height observer cleanup across navigation and viewport changes.
7. Reduced-motion and physical-iPhone behavior.
8. Reconfirm save/discard update actions and cookie state after an actual production two-build update.

No screenshots, test results or visual-compliance claims are attached. Prior passing checks in this program predate this UI batch and do not validate these changes.

## Next development batch

Continue mobile interaction polish and optional-panel failure containment in a separately scoped change. Keep physical auth recovery and production merge decisions pending until separately addressed; deferred testing is not a successful gate.

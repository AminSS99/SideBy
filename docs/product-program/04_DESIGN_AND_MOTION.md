# Design and motion specification

Goal: a beautiful, legible, responsive decision tool with memorable brand moments. Preserve SideBy's warm dark surfaces, orange/copper accents, typography hierarchy and evidence-focused results. This specification is not a screenshot audit; no new visual compliance is claimed.

## Library policy

Reuse the installed shadcn/Radix primitives for controls and accessible dialogs. Use existing GSAP for scoped presentation sequences and existing Motion/Framer patterns for interactive layout where justified. Each animated element has one owner; do not stack independent transform writers.

Magic UI, 21st.dev and React Bits are sources for selectively adapted components. Inspect source, license, dependencies, accessibility, CSP compatibility, telemetry and bundle impact before adoption. They are not a requirement to install every library or run remote registry code without inspection. The term “ShotCM” is unresolved; it may refer to shadcn/ui, but do not silently install an unrelated package under that assumption.

Official source notes: [shadcn/ui](https://ui.shadcn.com/docs) distributes editable component code; [Magic UI](https://magicui.design/docs) emphasizes reusable marketing components; [GSAP React](https://gsap.com/resources/React/) documents scoped cleanup. See research log for dated discovery. A registry listing is not a quality certificate.

## Screen hierarchy

Mobile: useful question entry → clear progress → verdict with uncertainty → entity comparison → evidence → save/share. Put the next useful action within comfortable reach; use progressive disclosure for advanced criteria. Never sacrifice citations to fit decorative cards.

Desktop: spacious split workspace with comparison/evidence context, keyboard navigation and contextual panels. Prefer a predictable two-pane evidence drawer over unrelated floating windows. Side-by-side comparisons retain labels and score context during scrolling.

## Motion tokens (provisional)

| Motion | Range | Acceptance |
| --- | --- | --- |
| Tap/press feedback | 80–140ms | Immediate response; submitting cannot duplicate work |
| Toggle/selection | 140–200ms | State remains obvious without motion |
| Sheet/menu | 200–280ms | Focus, scroll lock and interruption cleanup correct |
| Route/content transition | 180–300ms | No delay before user can act; no replay on polling |
| Hero entry | 350–700ms | Primary content/control available without waiting |
| Progress | State-driven | No fabricated completion percentage or endless flourish |

Use opacity/transform where practical, reserve blur and full-screen canvas effects for measured cases, suspend offscreen/hidden decorative animation, and render a static reduced-motion alternative. No global scroll hijacking. No animated background should compete with a result table or input.

Performance acceptance: inspect long tasks/frame traces on representative hardware. “Smooth” is an observed result over a documented interaction/device, not a conclusion from one headless scroll. Keep LCP/INP/CLS budgets from launch contract; track initial animation JS and route transfer separately from worker precache.

## iPhone/PWA requirements

- Verify real keyboard/visualViewport behavior, notch/home-indicator clearance, orientation and browser chrome.
- Keep readable ≥16px mobile input text where required for focus behavior; keep user zoom enabled.
- Safe-area ownership lives at the shell edge; avoid double padding.
- Coordinate cookie banner, update prompt, toast, mobile menu, sticky action and keyboard. One overlay token model; no independently hardcoded bottom surfaces.
- Provide mobile access to Features/Pricing/Docs/About and the workbench; an omitted menu is not a polished state.
- Dialogs need initial focus, focus containment, Escape/close, opener focus restoration, correct naming and background scroll cleanup.
- Icon set: actual 192/512 any/maskable and 180 Apple assets; verify crop at real home-screen scale, dark/light contexts and accessibility sizes.
- Installation help is capability/browser-specific. Push is opt-in; permission denial never blocks comparison use.
- Update prompt must preserve supported dirty forms and explicitly report preservation failure. Browser reload recovery stays bounded even with storage blocked.

## Six visual acceptance journeys

1. Cold mobile landing: headline and composer visible with consent banner, no collision.
2. Filled composer: two long entities, contextual constraints, validation, keyboard and submit visible.
3. Running job: truthful step state, background return, failure recovery, no motion reset storm.
4. Result: verdict, score detail, source open/return, long URLs and missing evidence.
5. Ecosystem/billing: active workspace and permission boundary unmistakable; central checkout return.
6. Update: two actual builds, dirty form, waiting worker, explicit update, one reload, restored input.

Capture before/after at 320, 390, 430, 768 and desktop widths plus physical iPhone. Record build SHA, motion setting and seeded data. Include empty/error/loading states, not just the best screenshot.

## Initial design backlog

D01 fix fixed-surface collision; D02 restore marketing mobile navigation; D03 standardize press feedback; D04 eliminate shell re-entry on data refresh; D05 readable source drawer; D06 consistent skeleton geometry; D07 keyboard-safe composer; D08 desktop evidence split view; D09 quieter reduced-motion experience; D10 icon crop audit. These are design improvements, not ten invented new product features.

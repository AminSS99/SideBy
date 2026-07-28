# SideBy iOS prototype — design QA

## Evidence

- Source visual truth: `/Users/aminsobor/Dev/SideBy/design/ios-mockups-v2/03-black-titanium.png`
- Browser-rendered implementation: `/Users/aminsobor/Dev/SideBy/prototypes/sideby-ios-black-titanium/implementation-final.jpg`
- Full-view comparison: `/Users/aminsobor/Dev/SideBy/prototypes/sideby-ios-black-titanium/qa-comparison-full.jpg`
- Focused comparison: `/Users/aminsobor/Dev/SideBy/prototypes/sideby-ios-black-titanium/qa-comparison-focus.jpg`
- Browser viewport: 1400 x 1200 CSS px
- Phone screen: 393 x 852 CSS px at scale 1
- Source pixels: 853 x 1844, normalized to 393 x 852 with a centered cover resize
- Implementation pixels: 393 x 852
- Density normalization: source downsampled to the implementation's 1x screenshot density
- State: iPhone, Compare tab, React vs Vue, SaaS dashboard / small product team, keyboard closed, 5 of 8 continuation state

## Full-view comparison evidence

The implementation preserves the target's black-titanium hierarchy: restrained top bar, large split A/B field, central dividing rule, compact brief, low-profile research control, continuation state, and three-item bottom dock. The major regions appear in the same order and occupy comparable proportions. Template-owned iPhone status chrome is present in the implementation and intentionally absent from the source mock.

## Focused comparison evidence

The focused top-region comparison confirms that the option labels, serif option names, central swap affordance, hairline divider, brief copy, and copper/cyan identifiers remain optically aligned and legible. The generated titanium texture is sharp, evenly integrated, and dark enough to preserve text contrast.

## Required fidelity surfaces

- **Fonts and typography:** Georgia is a close available match for the source's book serif wordmark and option names. System sans-serif weights, sizes, line heights, and tracking reproduce the restrained native hierarchy without wrapping or truncation at the reference state.
- **Spacing and layout rhythm:** The split field, brief strip, research action, continuation row, and bottom dock preserve the target's vertical sequence and central alignment. The app content is slightly more compact to accommodate protected iOS status chrome without obscuring persistent controls.
- **Colors and tokens:** Near-black, ivory, muted copper, muted cyan, graphite rules, and low-contrast raised surfaces match the source intent. The implementation retains copper for entity A and cyan for entity B as a deliberate SideBy semantic improvement.
- **Image quality and asset fidelity:** The black-titanium texture is a dedicated generated raster asset, not CSS art. It renders without stretching, halos, obvious seams, or contrast hot spots. Standard controls use Radix icons rather than handmade SVGs.
- **Copy and content:** All primary target copy is present. The continuation row adds a concise active-step subtitle so the visible progress state is actionable.
- **Accessibility and behavior:** Controls are semantic buttons, option editors use keyboard-aware runtime inputs, sheets have titles/descriptions, tap targets are at least 40–44 px, reduced-motion behavior is respected, and A/B identity is communicated with letters as well as color.

## Findings

No actionable P0, P1, or P2 differences remain.

- **P3 — Template chrome changes the top crop.** The protected live iOS status area adds vertical space above the app-owned header. This is expected mobile-runtime behavior and does not change the task hierarchy.
- **P3 — Decorative hardware was intentionally reduced.** The source includes visible screws on the research bar and bottom dock. The implementation removes those ornamental details to keep controls premium and usable, while retaining the titanium material and copper edge.
- **P3 — Continuation state is more explicit.** The implementation adds “Extracting comparable facts” beneath the active comparison; this improves clarity with minor visual-density drift.

## Primary interactions tested

- Open option A editor, type a replacement value, save it, and restore `React`
- Open and dismiss the decision-brief sheet
- Start sourced research and observe progress from step 1 through completion
- Open History and Sources from the bottom navigation and return to Compare
- Confirm the selected navigation state and persistent dock remain visible
- Browser console warnings/errors checked: none

## Comparison history

- **Pass 1:** No P0/P1/P2 findings. No visual fixes were required after the first normalized side-by-side comparison.

## Follow-up polish

- Consider a licensed editorial serif with slightly narrower capitals if the product later adopts a custom type system.
- Add subtle haptic feedback in a native implementation for swap, research start, and tab selection.

final result: passed

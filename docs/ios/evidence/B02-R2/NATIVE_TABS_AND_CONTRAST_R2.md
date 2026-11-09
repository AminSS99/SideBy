# B02-R2 — Native-tab route, material, contrast, acceptance matrix

Revision 4 follow-up · 2026-10-12 · Designer role: no production code changed.

## 1. Tab implementation: what is actually installed and active

Three-destination structure is kept: Compare (`app/(tabs)/index.tsx`),
History (`app/(tabs)/history.tsx`), Sources (`app/(tabs)/sources.tsx`).

| Surface | Package / import | What it is | Status in this app |
| --- | --- | --- | --- |
| Active tab bar | `expo-glass-tabs@0.1.1` (`GlassTabBar`, `GlassTabButton`, `TabBarMinimizeProvider`, `renderFadingTabScreen`, `useMinimizeOnScroll`) composed with `expo-router/ui` (`Tabs`, `TabList`, `TabSlot`, `TabTrigger`) in `app/(tabs)/_layout.tsx` | Third-party custom JS tab bar with glass styling | ACTIVE — renders in the shipped shell |
| Installed native-tabs export | `expo-router/unstable-native-tabs` (SDK 57.0.26): `NativeTabs`, `NativeTabTrigger`, backed by `build/native-tabs/NativeTabsView.ios` (real native view) | Expo Router native tabs | INSTALLED, NOT ADOPTED — no import in `app/` or `src/` |
| `@react-navigation/bottom-tabs` custom surface | `src/components/common/CustomTabBar.tsx` (`BottomTabBarProps`) | Custom bar built on React Navigation primitives | INACTIVE — zero imports in `app/` or `src/` (verified by search) |

Conclusion: the active bar is a **custom bar** and must be labeled as such;
it is not Expo Router native tabs. The SDK 57 native-tabs export exists and
is the B04 spike candidate. Side-by-side runtime comparison on one built app
(iOS 26 behavior vs pre-26 fallback) is NOT RUN — it needs the B04 device
spike build, which is out of scope for this spec ticket.

## 2. Contrast measurements (replaces the asserted AAA claim)

Method: WCAG 2.1 relative-luminance ratios computed from `src/theme/colors.ts`
opaque tokens against the app background `#050711` (node one-liner; formula
`(L1+0.05)/(L2+0.05)`). Dark theme only — the app forces dark mode
(`app.json` `userInterfaceStyle: "dark"`).

| Foreground | Ratio on `#050711` | Rating (normal text) |
| --- | --- | --- |
| ivory `#F7F8FC` | 18.94:1 | AAA |
| cyan `#6ED9E6` | 12.18:1 | AAA |
| copper `#FF9B73` | 9.75:1 | AAA |
| muted `#A9B0C0` | 9.24:1 | AAA |
| success `#34C759` | 9.05:1 | AAA |
| violet `#A88CFF` | 7.52:1 | AAA |
| warning `#FFD60A` | 14.24:1 | AAA |
| error `#FF3B30` | 5.67:1 | AA (not AAA) |
| CTA text `#090A0F` on `#FFFFFF` → `#F3D6C8` gradient | 19.78 → 14.37:1 | AAA |

Explicit limits of these numbers:

- They cover opaque tokens on a flat background only. Translucent surfaces
  (`titanium`, `raisedTitanium`, `surfaceOverlay`, glass tints) composite
  over live content, so their effective ratios are backdrop-dependent and
  UNMEASURED.
- There is no light theme, no semantic default/high-contrast token set, and
  no `IncreaseContrast` branch in code. Light/default/high-contrast states
  are PROPOSED, not measured.
- `error #FF3B30` meets AA, not AAA, for normal-size text.
- Prior `SCREEN_SPEC.md` language asserting AAA compliance is superseded by
  this table.

## 3. Reduce Transparency and largest text: implemented vs proposed

- `AccessibilityInfo.isReduceTransparencyEnabled` (or the `reduceTransparency`
  prop path): zero references in `app/` or `src/`. When Reduce Transparency
  is on, the app still renders blur/glass layers — behavior change: NONE
  (implemented). An explicit legible-material fallback is PROPOSED.
- Dynamic Type / `maxFontSizeMultiplier` / `allowFontScaling`: zero
  references in `app/` or `src/`. Largest accessibility sizes will scale text
  with default behavior and may overflow fixed-height cards and the 120pt
  bottom paddings — UNVERIFIED on device. A multiline-safe layout pass is
  PROPOSED (B05).

## 4. Acceptance matrix

| Criterion | Proposed | Implemented | Evidence / gate |
| --- | --- | --- | --- |
| Three-tab / two-input structure | yes | yes | `app/(tabs)/_layout.tsx`, composer screen, R2 launch screenshot |
| Native-tab route decision | spike in B04 | no — custom `expo-glass-tabs` bar active | §1; runtime comparison NOT RUN |
| Glass hierarchy (nav glass, quiet reading surfaces) | yes | partially (glass present + dark fills/gradients remain) | Code read; device scroll-under-glass video NOT RUN |
| Safe-area / keyboard behavior | one inset owner, keyboard-clearing actions | not verified | Device matrix NOT RUN (B06) |
| Unknown-evidence labeling | neutral labels | yes — CITED EVIDENCE / COMPLETED BRIEF / CITATIONS | B01-R2 code + tests |
| Source trust labels | neutral, claim-linked | neutral labels only; no claim-to-citation rule | B01-R2; validation rule PROPOSED |
| Contrast AAA | asserted | measured per-token (§2) with stated limits; error=AA; translucency unmeasured | This doc; device sampling NOT RUN |
| Reduce Transparency / largest text | fallback + reflow | none in code | §3; B05 work PROPOSED |
| iOS 26 + pre-26 fallback | verified both | neither verified at runtime | B04/B06 device matrix NOT RUN |

## 5. Staging / device gates NOT RUN

Native-tabs A/B on one built app; glass scroll video; safe-area/keyboard
matrix; VoiceOver order; light/high-contrast themes; Reduce Transparency and
largest-text layouts; pre-26 OS fallback. All belong to B04/B06 device work.

## Next action

B04: spike `expo-router/unstable-native-tabs` (`NativeTabs`/`NativeTabTrigger`)
against the active `expo-glass-tabs` bar on one built app (iOS 26 + pre-26),
then keep one implementation. B05: Reduced-transparency fallback and
largest-text reflow using the §2 token table.

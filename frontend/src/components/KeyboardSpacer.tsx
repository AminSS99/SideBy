import { useKeyboardInset } from "@/hooks/useKeyboardInset";

/**
 * Shared form-layout abstraction for keyboard-aware screens: renders a
 * bottom spacer for the estimated viewport occlusion (typically the
 * on-screen keyboard) so submit actions are never stranded behind it.
 *
 * Use once at the end of a form's scroll container; don't add keyboard
 * padding to content that already resizes itself correctly.
 */
export function KeyboardSpacer({ enabled = true }: { enabled?: boolean }) {
  const occlusion = useKeyboardInset(enabled);
  if (occlusion <= 0) return null;
  return <div aria-hidden="true" style={{ height: occlusion }} />;
}

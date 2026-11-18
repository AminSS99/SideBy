/**
 * Script-aware text helpers shared by the browser and the API.
 *
 * SideBy's keys, cache identities and slugs used to be built with `[^a-z0-9]`,
 * which erased every Cyrillic letter and the Azerbaijani letters ə ğ ı ö ü ş ç.
 * Two different Russian comparisons then collapsed to the same key. Keep
 * letters and digits of every script for *identity* keys, and transliterate to
 * ASCII only for URL slugs.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // Ukrainian / Belarusian / Azerbaijani-Cyrillic leftovers seen in the wild
  є: "ye", і: "i", ї: "yi", ґ: "g", ў: "u", ә: "e", ғ: "g", қ: "q", ң: "n", ө: "o", ү: "u", һ: "h",
};

const LATIN_SPECIAL: Record<string, string> = {
  ə: "e", ğ: "g", ı: "i", ö: "o", ü: "u", ş: "s", ç: "c", ß: "ss", ø: "o", æ: "ae", œ: "oe", ł: "l", đ: "d",
};

/** Lower-case and drop the stray combining dot that "İ".toLowerCase() leaves behind. */
export const lowerKey = (value: string): string => value.toLowerCase().replace(/̇/g, "");

/** Turn any script into plain a-z0-9 words. Unknown scripts are dropped. */
export const transliterate = (value: string): string => {
  let out = "";
  for (const char of lowerKey(value).normalize("NFC")) {
    out += CYRILLIC_TO_LATIN[char] ?? LATIN_SPECIAL[char] ?? char;
  }
  return out.normalize("NFKD").replace(/\p{M}+/gu, "");
};

/** URL-safe slug. Falls back to `fallback` when nothing usable remains. */
export const asciiSlug = (value: string, fallback = ""): string =>
  transliterate(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || fallback;

/** Identity-key slug that keeps every script (so Russian pairs never collide). */
export const unicodeSlug = (value: string): string =>
  lowerKey(value)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");

import { describe, expect, it } from "vitest";
import { en } from "../locales/en";
import { az } from "../locales/az";
import { ru } from "../locales/ru";

const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe.each([
  ["az", az],
  ["ru", ru],
] as const)("%s locale", (_name, dictionary) => {
  const keys = Object.keys(en) as (keyof typeof en)[];

  it("translates every English key that has no deliberate English fallback", () => {
    const missing = keys.filter((key) => !(key in dictionary));
    expect(missing).toEqual([]);
  });

  it("has no keys that English does not define", () => {
    const extra = Object.keys(dictionary).filter((key) => !(key in en));
    expect(extra).toEqual([]);
  });

  it("keeps the same {placeholders} as English", () => {
    const mismatched = keys.filter((key) => {
      const translated = dictionary[key];
      return translated !== undefined && placeholders(translated).join() !== placeholders(en[key]).join();
    });
    expect(mismatched).toEqual([]);
  });

  it("never leaves a value empty", () => {
    const empty = Object.entries(dictionary).filter(([, value]) => !value?.trim());
    expect(empty).toEqual([]);
  });
});

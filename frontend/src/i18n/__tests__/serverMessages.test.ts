import { describe, expect, it } from "vitest";
import { localizeServerMessage } from "../serverMessages";
import { en } from "../locales/en";
import { az } from "../locales/az";
import { ru } from "../locales/ru";
import type { Lang, TFunction } from "../index";

const makeT = (lang: Lang): TFunction => {
  const dict = lang === "az" ? az : lang === "ru" ? ru : en;
  return (key, vars) => {
    const template = dict[key] ?? en[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  };
};

describe("localizeServerMessage", () => {
  it("translates organization workspace requirement in en, az, and ru", () => {
    const raw = "Team management requires an organization workspace.";
    expect(localizeServerMessage(makeT("en"), raw)).toBe(raw);
    expect(localizeServerMessage(makeT("az"), raw)).toBe(
      "Komanda idarəetməsi üçün təşkilat iş sahəsi tələb olunur.",
    );
    expect(localizeServerMessage(makeT("ru"), raw)).toBe(
      "Для управления командой требуется рабочая область организации.",
    );
  });

  it("translates auth, workspace, and validation notices", () => {
    const tAz = makeT("az");
    const tRu = makeT("ru");

    expect(localizeServerMessage(tAz, "Admin access required.")).toBe("Admin icazəsi tələb olunur.");
    expect(localizeServerMessage(tRu, "Workspace not found.")).toBe("Рабочая область не найдена.");
    expect(localizeServerMessage(tAz, "Too many validation requests. Please wait a moment.")).toBe(
      "Çox sayda yoxlama sorğusu göndərildi. Bir az gözləyin.",
    );
  });

  it("translates parameterized rate-limit messages", () => {
    const tAz = makeT("az");
    const tRu = makeT("ru");

    expect(localizeServerMessage(tAz, "Too many requests. Try again in 15 seconds.")).toBe(
      "Çox sayda sorğu. 15 san sonra yenidən cəhd edin.",
    );
    expect(
      localizeServerMessage(tRu, "Monthly limit reached (100/100). Resets in 4 days."),
    ).toBe("Месячный лимит исчерпан (100/100). Сброс через 4 дн.");
    expect(
      localizeServerMessage(tAz, "Daily limit reached (5/5). Resets in 3h (12:00:00 AM)."),
    ).toBe("Gündəlik limit doldu (5/5). 3 saat sonra yenilənir (12:00:00 AM).");
  });

  it("translates Clerk team failure prefixes without leaking raw API status", () => {
    const tRu = makeT("ru");
    expect(localizeServerMessage(tRu, "Clerk invitation failed: 422 Unprocessable")).toBe(
      "Не удалось отправить приглашение. Попробуйте ещё раз.",
    );
    expect(localizeServerMessage(makeT("az"), "Clerk role update failed: 403 Forbidden")).toBe(
      "Üzvün rolu yenilənə bilmədi. Yenidən cəhd edin.",
    );
  });

  it("falls back safely for unknown or empty messages", () => {
    const tAz = makeT("az");
    expect(localizeServerMessage(tAz, null)).toBe("");
    expect(localizeServerMessage(tAz, undefined)).toBe("");
    expect(localizeServerMessage(tAz, "   ")).toBe("");
    expect(localizeServerMessage(tAz, "Custom unexpected server message")).toBe(
      "Custom unexpected server message",
    );
  });
});

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

  it("translates upload, billing, research, project, and workspace errors in az and ru", () => {
    const tAz = makeT("az");
    const tRu = makeT("ru");

    // Uploads: file size exceeded, unsupported file type, upload failed, document not found
    expect(
      localizeServerMessage(tAz, "File is too large. Maximum upload size is 25 MB."),
    ).toBe("Fayl həcmi çox böyükdür. Maksimum yükləmə ölçüsü 25 MB-dır.");
    expect(
      localizeServerMessage(tRu, "File is too large. Maximum upload size is 25 MB."),
    ).toBe("Файл слишком большой. Максимальный размер загрузки — 25 MB.");

    expect(
      localizeServerMessage(tAz, "Unsupported file type. Upload PDF, TXT, or CSV files only."),
    ).toBe("Dəstəklənməyən fayl növü. Yalnız PDF, TXT və ya CSV faylları yükləyin.");
    expect(
      localizeServerMessage(tRu, "Unsupported file type. Upload PDF, TXT, or CSV files only."),
    ).toBe("Неподдерживаемый тип файла. Загружайте только файлы PDF, TXT или CSV.");

    expect(localizeServerMessage(tAz, "Upload failed.")).toBe("Yükləmə uğursuz oldu.");
    expect(localizeServerMessage(tRu, "Upload failed.")).toBe("Не удалось загрузить файл.");

    expect(localizeServerMessage(tAz, "Document not found.")).toBe("Sənəd tapılmadı.");
    expect(localizeServerMessage(tRu, "Document not found.")).toBe("Документ не найден.");

    // Billing
    expect(
      localizeServerMessage(tAz, "Unable to create billing portal session."),
    ).toBe("Abunəlik portalı sessiyası yaradıla bilmədi.");
    expect(
      localizeServerMessage(tRu, "Unable to create billing portal session."),
    ).toBe("Не удалось открыть портал управления подпиской.");
    expect(localizeServerMessage(tAz, "Unable to load usage.")).toBe(
      "İstifadə məlumatı yüklənə bilmədi.",
    );
    expect(localizeServerMessage(tRu, "Unable to load usage.")).toBe(
      "Не удалось загрузить данные об использовании.",
    );

    // Research: web search quota & provider unavailable
    expect(localizeServerMessage(tAz, "Web search quota exceeded.")).toBe(
      "Bu gün üçün veb axtarış kvotası bitib.",
    );
    expect(localizeServerMessage(tRu, "Web search quota exceeded.")).toBe(
      "Дневной лимит веб-поиска исчерпан.",
    );
    expect(
      localizeServerMessage(tAz, "Search is temporarily unavailable. Please try again shortly."),
    ).toBe("Axtarış müvəqqəti olaraq əlçatan deyil. Bir az sonra yenidən cəhd edin.");
    expect(
      localizeServerMessage(tRu, "Search is temporarily unavailable. Please try again shortly."),
    ).toBe("Поиск временно недоступен. Попробуйте чуть позже.");
    expect(localizeServerMessage(tAz, "All search providers failed.")).toBe(
      "Axtarış provayderi müvəqqəti olaraq əlçatan deyil. Bir az sonra yenidən cəhd edin.",
    );
    expect(localizeServerMessage(tRu, "All search providers failed.")).toBe(
      "Поисковый провайдер временно недоступен. Попробуйте чуть позже.",
    );

    // Projects & Workspaces
    expect(localizeServerMessage(tAz, "Failed to load projects.")).toBe(
      "Layihələr yüklənə bilmədi.",
    );
    expect(localizeServerMessage(tRu, "Failed to load projects.")).toBe(
      "Не удалось загрузить проекты.",
    );
    expect(localizeServerMessage(tAz, "Failed to load workspaces.")).toBe(
      "İş sahələri yüklənə bilmədi.",
    );
    expect(localizeServerMessage(tRu, "Failed to load workspaces.")).toBe(
      "Не удалось загрузить рабочие области.",
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

/**
 * Strings for scope "share". Keep every key inside this scope's prefix (see the brief).
 * `az` and `ru` must define exactly the keys of `en` (enforced by the type below).
 */
export const en = {
  "share.button": "Share",
  "share.title": "Share comparison",
  "share.description":
    "Publishing shows exactly the record previewed below. Private notes, uploads and your saved decisions stay private.",
  "share.closeAria": "Close share dialog",
  "share.tie": "Tie",

  "share.status.publicLabel": "Public.",
  "share.status.publicDesc": "Anyone with the link can view the record below.",
  "share.status.privateLabel": "Private.",
  "share.status.privateDesc": "Only you can see this record. Nothing is published until you choose Publish.",

  "share.preview.heading": "What the public sees",
  "share.preview.rejected":
    "This record can't be published in its current form — the public projection rejected it. Keep it private or re-run research.",
  "share.preview.recommendation": "Recommendation: {name}.",
  "share.preview.fallbackTagline": "SideBy · Source-backed comparison engine",
  "share.preview.sourcesOne":
    "{count} source with titles, links and retrieval dates. Question, verdict, category outcomes and sources only — your decision context and saved decisions are never part of the public record.",
  "share.preview.sourcesMany":
    "{count} sources with titles, links and retrieval dates. Question, verdict, category outcomes and sources only — your decision context and saved decisions are never part of the public record.",

  "share.publicUrl.heading": "Public URL",
  "share.publicUrl.copyAria": "Copy public link",
  "share.publicUrl.copied": "Copied to clipboard",

  "share.cacheNotice":
    "Public reads are never cached. Unpublishing later stops new visits on the very next request; anything someone already downloaded or re-shared outside SideBy can't be recalled.",

  "share.eligibility.heading": "Can't publish yet",

  "share.snapshot.heading": "Public snapshot",
  "share.snapshot.description":
    "A snapshot re-runs fresh research using only the two recorded option names — no written brief, priorities or uploads travel with it. The snapshot is its own record; publish it once the run completes. Research runs take a few minutes.",
  "share.snapshot.optionNamesLabel": "Option names to be researched and published:",
  "share.snapshot.privacyWarning":
    "Option names extracted from private input are not automatically public. Verify that neither option name exposes private project codes, client names, or confidential context.",
  "share.snapshot.confirmCheckbox":
    "I confirm these exact option names are safe to publish and contain no private context.",
  "share.snapshot.saveFirstTitle": "Save the comparison first",
  "share.snapshot.approveFirstTitle": "Review and approve the option names first",
  "share.snapshot.generating": "Generating…",
  "share.snapshot.generateButton": "Generate public snapshot",
  "share.snapshot.planNotice": "Runs a real research job, so it counts as one comparison on your plan.",
  "share.snapshot.saveFirst": "Save the comparison before generating a snapshot.",
  "share.snapshot.generateError": "Unable to generate a public snapshot.",
  "share.snapshot.incompleteResponse": "The snapshot response was incomplete. Please try again.",
  "share.snapshot.failed": "Snapshot generation failed. Please try again.",

  "share.visibility.cannotChange": "This comparison can't change visibility yet.",
  "share.visibility.publishError": "Unable to publish this comparison.",
  "share.visibility.unpublishError": "Unable to make this comparison private.",
  "share.visibility.failed": "Visibility change failed. Please try again.",

  "share.clipboardBlocked": "Clipboard permission is blocked. Select and copy the URL manually.",
  "share.popupBlocked": "The popup was blocked. Copy the link and open it manually.",

  "share.actions.working": "Working…",
  "share.actions.makePrivate": "Make private",
  "share.actions.saveBeforePublishTitle": "Save the comparison before publishing",
  "share.actions.cannotPublishSafelyTitle": "This record can't be published safely",
  "share.actions.publishing": "Publishing…",
  "share.actions.publish": "Publish",
  "share.actions.publishFirstTitle": "Publish first — opening never publishes on its own",
  "share.actions.openPage": "Open page",
} as const;

type Keys = keyof typeof en;

export const az: Record<Keys, string> = {
  "share.button": "Paylaş",
  "share.title": "Müqayisəni paylaş",
  "share.description":
    "Dərc etdikdə aşağıda göstərilən qeyd olduğu kimi paylaşılır. Şəxsi qeydlər, yükləmələr və yadda saxladığınız qərarlar şəxsi qalır.",
  "share.closeAria": "Paylaşım pəncərəsini bağla",
  "share.tie": "Bərabər",

  "share.status.publicLabel": "Açıq.",
  "share.status.publicDesc": "Linki olan hər kəs aşağıdakı qeydə baxa bilər.",
  "share.status.privateLabel": "Şəxsi.",
  "share.status.privateDesc": "Bu qeydi yalnız siz görə bilərsiniz. «Dərc et» seçilmədikcə heç nə dərc olunmur.",

  "share.preview.heading": "İctimaiyyətin gördükləri",
  "share.preview.rejected":
    "Bu qeyd hazırkı formasında dərc edilə bilməz — açıq proyeksiya onu rədd etdi. Şəxsi saxlayın və ya araşdırmanı yenidən başladın.",
  "share.preview.recommendation": "Tövsiyə: {name}.",
  "share.preview.fallbackTagline": "SideBy · Mənbəyə əsaslanan müqayisə sistemi",
  "share.preview.sourcesOne":
    "{count} mənbə — başlıqlar, linklər və əldə edilmə tarixləri ilə. Yalnız sual, yekun rəy, kateqoriya nəticələri və mənbələr; qərar kontekstiniz və yadda saxladığınız qərarlar heç vaxt açıq qeydə daxil edilmir.",
  "share.preview.sourcesMany":
    "{count} mənbə — başlıqlar, linklər və əldə edilmə tarixləri ilə. Yalnız sual, yekun rəy, kateqoriya nəticələri və mənbələr; qərar kontekstiniz və yadda saxladığınız qərarlar heç vaxt açıq qeydə daxil edilmir.",

  "share.publicUrl.heading": "Açıq URL",
  "share.publicUrl.copyAria": "Açıq linki kopyala",
  "share.publicUrl.copied": "Buferə kopyalandı",

  "share.cacheNotice":
    "Açıq oxunuşlar heç vaxt keşlənmir. Daha sonra dərcdən çıxarmaq növbəti sorğudan etibarən yeni baxışları dayandırır; kiminsə artıq endirdiyi və ya SideBy xaricində paylaşdığı nüsxələr geri alına bilməz.",

  "share.eligibility.heading": "Hələ dərc etmək olmaz",

  "share.snapshot.heading": "Açıq snapshot",
  "share.snapshot.description":
    "Snapshot yalnız qeyd olunmuş iki seçim adı əsasında yeni araşdırma başladır — yazılı brif, prioritetlər və ya yükləmələr onunla ötürülmür. Snapshot ayrı qeyddir; icra bitdikdən sonra onu dərc edin. Araşdırma bir neçə dəqiqə çəkir.",
  "share.snapshot.optionNamesLabel": "Araşdırılacaq və dərc ediləcək seçim adları:",
  "share.snapshot.privacyWarning":
    "Şəxsi daxiletmədən çıxarılan seçim adları avtomatik olaraq açıq sayılmır. Heç bir seçim adının şəxsi layihə kodlarını, müştəri adlarını və ya məxfi konteksti ifşa etmədiyini yoxlayın.",
  "share.snapshot.confirmCheckbox":
    "Təsdiq edirəm ki, bu dəqiq seçim adlarını dərc etmək təhlükəsizdir və onlarda heç bir şəxsi kontekst yoxdur.",
  "share.snapshot.saveFirstTitle": "Əvvəlcə müqayisəni yadda saxlayın",
  "share.snapshot.approveFirstTitle": "Əvvəlcə seçim adlarını yoxlayın və təsdiqləyin",
  "share.snapshot.generating": "Yaradılır…",
  "share.snapshot.generateButton": "Açıq snapshot yarat",
  "share.snapshot.planNotice": "Real araşdırma tapşırığı icra edir, buna görə planınızda bir müqayisə kimi sayılır.",
  "share.snapshot.saveFirst": "Snapshot yaratmazdan əvvəl müqayisəni yadda saxlayın.",
  "share.snapshot.generateError": "Açıq snapshot yaratmaq mümkün olmadı.",
  "share.snapshot.incompleteResponse": "Snapshot cavabı natamam oldu. Zəhmət olmasa yenidən cəhd edin.",
  "share.snapshot.failed": "Snapshot yaradılması alınmadı. Zəhmət olmasa yenidən cəhd edin.",

  "share.visibility.cannotChange": "Bu müqayisənin görünürlüyünü hələ dəyişmək olmaz.",
  "share.visibility.publishError": "Bu müqayisəni dərc etmək mümkün olmadı.",
  "share.visibility.unpublishError": "Bu müqayisəni şəxsi etmək mümkün olmadı.",
  "share.visibility.failed": "Görünürlük dəyişikliyi alınmadı. Zəhmət olmasa yenidən cəhd edin.",

  "share.clipboardBlocked": "Mübadilə buferi icazəsi bloklanıb. URL-i əl ilə seçib kopyalayın.",
  "share.popupBlocked": "Açılan pəncərə bloklandı. Linki kopyalayıb əl ilə açın.",

  "share.actions.working": "İcra olunur…",
  "share.actions.makePrivate": "Şəxsi et",
  "share.actions.saveBeforePublishTitle": "Dərc etməzdən əvvəl müqayisəni yadda saxlayın",
  "share.actions.cannotPublishSafelyTitle": "Bu qeyd təhlükəsiz şəkildə dərc edilə bilməz",
  "share.actions.publishing": "Dərc edilir…",
  "share.actions.publish": "Dərc et",
  "share.actions.publishFirstTitle": "Əvvəlcə dərc edin — açmaq özü dərc etmir",
  "share.actions.openPage": "Səhifəni aç",
};

export const ru: Record<Keys, string> = {
  "share.button": "Поделиться",
  "share.title": "Поделиться сравнением",
  "share.description":
    "При публикации будет показано именно то, что отображается в предпросмотре ниже. Приватные заметки, загрузки и ваши сохранённые решения останутся приватными.",
  "share.closeAria": "Закрыть окно публикации",
  "share.tie": "Ничья",

  "share.status.publicLabel": "Публичное.",
  "share.status.publicDesc": "Любой, у кого есть ссылка, сможет просмотреть запись ниже.",
  "share.status.privateLabel": "Приватное.",
  "share.status.privateDesc":
    "Эту запись видите только вы. Ничего не будет опубликовано, пока вы не нажмёте «Опубликовать».",

  "share.preview.heading": "Что увидят все",
  "share.preview.rejected":
    "Эту запись нельзя опубликовать в текущем виде — публичная проекция отклонила её. Оставьте её приватной или перезапустите исследование.",
  "share.preview.recommendation": "Рекомендация: {name}.",
  "share.preview.fallbackTagline": "SideBy · Система сравнений на основе источников",
  "share.preview.sourcesOne":
    "Источников: {count} (с заголовками, ссылками и датами получения). Только вопрос, вердикт, итоги по категориям и источники — контекст вашего решения и сохранённые решения никогда не попадают в публичную запись.",
  "share.preview.sourcesMany":
    "Источников: {count} (с заголовками, ссылками и датами получения). Только вопрос, вердикт, итоги по категориям и источники — контекст вашего решения и сохранённые решения никогда не попадают в публичную запись.",

  "share.publicUrl.heading": "Публичный URL",
  "share.publicUrl.copyAria": "Скопировать публичную ссылку",
  "share.publicUrl.copied": "Скопировано в буфер обмена",

  "share.cacheNotice":
    "Публичные чтения никогда не кэшируются. Отмена публикации остановит новые визиты со следующего же запроса; всё, что кто-то уже скачал или переслал вне SideBy, отозвать невозможно.",

  "share.eligibility.heading": "Пока нельзя опубликовать",

  "share.snapshot.heading": "Публичный снимок",
  "share.snapshot.description":
    "Снимок запускает новое исследование только по двум сохранённым названиям вариантов — текстовый бриф, приоритеты и загрузки не передаются. Снимок — это отдельная запись; опубликуйте её после завершения. Исследование занимает несколько минут.",
  "share.snapshot.optionNamesLabel": "Названия вариантов для исследования и публикации:",
  "share.snapshot.privacyWarning":
    "Названия вариантов, извлечённые из приватного ввода, не становятся публичными автоматически. Убедитесь, что ни одно из названий не раскрывает внутренние коды проектов, имена клиентов или конфиденциальный контекст.",
  "share.snapshot.confirmCheckbox":
    "Я подтверждаю, что эти точные названия вариантов безопасны для публикации и не содержат приватного контекста.",
  "share.snapshot.saveFirstTitle": "Сначала сохраните сравнение",
  "share.snapshot.approveFirstTitle": "Сначала проверьте и подтвердите названия вариантов",
  "share.snapshot.generating": "Создание…",
  "share.snapshot.generateButton": "Создать публичный снимок",
  "share.snapshot.planNotice":
    "Запускает реальное исследование и засчитывается как одно сравнение по вашему тарифу.",
  "share.snapshot.saveFirst": "Сохраните сравнение перед созданием снимка.",
  "share.snapshot.generateError": "Не удалось создать публичный снимок.",
  "share.snapshot.incompleteResponse": "Ответ по снимку неполный. Пожалуйста, попробуйте ещё раз.",
  "share.snapshot.failed": "Не удалось создать снимок. Пожалуйста, попробуйте ещё раз.",

  "share.visibility.cannotChange": "Видимость этого сравнения пока нельзя изменить.",
  "share.visibility.publishError": "Не удалось опубликовать это сравнение.",
  "share.visibility.unpublishError": "Не удалось сделать это сравнение приватным.",
  "share.visibility.failed": "Не удалось изменить видимость. Пожалуйста, попробуйте ещё раз.",

  "share.clipboardBlocked": "Доступ к буферу обмена заблокирован. Выделите и скопируйте URL вручную.",
  "share.popupBlocked": "Всплывающее окно заблокировано. Скопируйте ссылку и откройте её вручную.",

  "share.actions.working": "Обработка…",
  "share.actions.makePrivate": "Сделать приватным",
  "share.actions.saveBeforePublishTitle": "Сохраните сравнение перед публикацией",
  "share.actions.cannotPublishSafelyTitle": "Эту запись нельзя безопасно опубликовать",
  "share.actions.publishing": "Публикация…",
  "share.actions.publish": "Опубликовать",
  "share.actions.publishFirstTitle": "Сначала опубликуйте — открытие страницы не публикует её само по себе",
  "share.actions.openPage": "Открыть страницу",
};

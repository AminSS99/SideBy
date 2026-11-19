import React, { useEffect, useRef, useState } from "react";
import { KeyboardSpacer } from "@/components/KeyboardSpacer";

import { useSearchParams } from "react-router-dom";
import { 
  Settings2, 
  Key, 
  Bot, 
  Cpu, 
  Trash2, 
  Save, 
  Copy, 
  Check, 
  Plus,
  AlertTriangle,
  Bell,
  ShieldCheck,
  SlidersHorizontal,
  Webhook
} from "@/components/icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { WorkspaceRecord } from "@/contexts/WorkspaceContext";
import { GlowCard } from "@/components/GlowCard";
import { copyText } from "@/lib/clipboard";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { formatDate, formatDateTime, useI18n, useT, type MessageKey } from "@/i18n";

type Tab = "general" | "preferences" | "providers" | "api-keys" | "webhooks" | "notifications";

const SETTINGS_TABS: Array<{
  id: Tab;
  labelKey: MessageKey;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "general", labelKey: "settings.tabs.general", icon: Settings2 },
  { id: "preferences", labelKey: "settings.tabs.preferences", icon: SlidersHorizontal },
  { id: "notifications", labelKey: "settings.tabs.notifications", icon: Bell },
  { id: "providers", labelKey: "settings.tabs.providers", icon: Bot },
  { id: "api-keys", labelKey: "settings.tabs.apiKeys", icon: Key },
  { id: "webhooks", labelKey: "settings.tabs.webhooks", icon: Webhook },
];

const isSettingsTab = (value: string | null): value is Tab =>
  !!value && SETTINGS_TABS.some((tab) => tab.id === value);
type PreferencesState = {
  emailDigest: boolean;
  jobAlerts: boolean;
  publicLinkWarnings: boolean;
  compactMode: boolean;
  defaultVisibility: "private" | "team" | "public";
};

type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  scopes: unknown;
  workspaceId: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

const providerStyles = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
} as const;

const SettingsPage = () => {
  const t = useT();
  const { activeWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: Tab = isSettingsTab(tabParam) ? tabParam : "general";
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the URL shareable when navigating directly to a tab (e.g. from a
  // notification deep-link to /app/settings?tab=notifications).
  useEffect(() => {
    if (searchParams.get("tab") !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline({ defaults: { clearProps: "transform,opacity" } });
    tl.from(".set-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".set-nav", { x: -20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".set-content", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-8 max-w-6xl">
      <div className="set-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          {t("settings.header.kicker")}
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          {t("settings.header.title")}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          {t("settings.header.subtitle")}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Settings Sidebar Nav */}
        <aside className="set-nav w-full lg:w-64 shrink-0 space-y-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest rounded-sm transition-all ${
                activeTab === tab.id
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "text-[#fdfbf7]/50 hover:bg-[#111] hover:text-[#fdfbf7] border border-transparent"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </button>
          ))}
        </aside>

        {/* Settings Content Area */}
        <div className="set-content flex-1 w-full min-w-0">
          {activeTab === "general" && <GeneralSettings workspace={activeWorkspace} />}
          {activeTab === "preferences" && <PreferenceSettings workspaceId={activeWorkspace?.id} />}
          {activeTab === "notifications" && <NotificationsSettings />}
          {activeTab === "providers" && <ProviderSettings />}
          {activeTab === "api-keys" && <ApiKeysSettings workspaceId={activeWorkspace?.id} />}
          {activeTab === "webhooks" && <WebhooksSettings workspaceId={activeWorkspace?.id} />}
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-[#1f1f1f] text-center text-xs text-[#fdfbf7]/30">
        <a href="https://sideby.ink" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
          {t("settings.footer.madeBy")}
        </a>
      </div>
    </div>
  );
};

const GeneralSettings = ({ workspace }: { workspace: WorkspaceRecord | null }) => {
  const t = useT();
  const { refresh } = useWorkspace();
  const [name, setName] = useState(workspace?.name || "");
  const [slug, setSlug] = useState(workspace?.slug || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(workspace?.name || "");
    setSlug(workspace?.slug || "");
  }, [workspace?.name, workspace?.slug]);

  const save = async () => {
    if (!workspace?.id || isSaving) return;
    try {
      setIsSaving(true);
      await apiFetch(buildApiUrl("/api/workspaces"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, name, slug }),
      });
      await refresh();
      toast.success(t("settings.general.saved"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8">
        <div className="mb-5">
          <h2 className="font-serif text-2xl text-[#fdfbf7]">{t("settings.language.title")}</h2>
          <p className="mt-1 text-sm text-[#fdfbf7]/50">{t("settings.language.description")}</p>
        </div>
        <LanguageSwitcher variant="list" />
      </GlowCard>

      <GlowCard className="p-8">
        <h2 className="font-serif text-2xl text-[#fdfbf7] border-b border-[#2a2a2a] pb-4 mb-6">
          {t("settings.general.profileTitle")}
        </h2>
        <div className="space-y-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">{t("settings.general.workspaceName")}</label>
            <input 
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">{t("settings.general.urlSlug")}</label>
            <div className="flex rounded-sm border border-[#333] bg-[#0c0b0a] overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
              <span className="flex items-center px-4 bg-[#111] border-r border-[#333] text-sm text-[#fdfbf7]/40">
                sideby.ink/
              </span>
              <input 
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="w-full bg-transparent px-4 py-3 text-sm text-[#fdfbf7] outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void save().catch((error) => toast.error(t("settings.general.saveError"), { description: error instanceof Error ? error.message : t("settings.common.tryAgain") }))}
            className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {t("settings.general.saveChanges")}
          </button>
        </div>
      </GlowCard>

      <div className="rounded-sm border border-red-500/30 bg-red-500/5 p-8">
        <h2 className="font-serif text-2xl text-red-400 border-b border-red-500/20 pb-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          {t("settings.general.dangerTitle")}
        </h2>
        <p className="text-sm text-red-400/70 mb-6 leading-relaxed max-w-2xl">
          {t("settings.general.dangerDesc")}
        </p>
        <button
          onClick={() => toast.warning(t("settings.general.deleteLocked"), {
            description: t("settings.general.deleteLockedDesc"),
          })}
          className="flex items-center gap-2 rounded-sm border border-red-500/40 bg-red-500/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("settings.general.deleteWorkspace")}
        </button>
      </div>
    </div>
  );
};

const defaultPreferences: PreferencesState = {
  emailDigest: true,
  jobAlerts: true,
  publicLinkWarnings: true,
  compactMode: false,
  defaultVisibility: "private",
};

const PreferenceSettings = ({ workspaceId }: { workspaceId?: string }) => {
  const t = useT();
  const [preferences, setPreferences] = useState<PreferencesState>(defaultPreferences);

  useEffect(() => {
    const load = async () => {
      const query = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const response = await apiFetch(buildApiUrl(`/api/settings${query}`));
      const data = (await response.json()) as {
        userSettings?: { preferences?: Partial<PreferencesState> } | null;
        workspaceSettings?: { defaultVisibility?: PreferencesState["defaultVisibility"] } | null;
      };
      setPreferences({
        ...defaultPreferences,
        ...(data.userSettings?.preferences || {}),
        defaultVisibility: data.workspaceSettings?.defaultVisibility || defaultPreferences.defaultVisibility,
      });
    };
    void load().catch((error) => {
      toast.error(t("settings.preferences.loadError"), {
        description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
      });
    });
  }, [workspaceId, t]);

  const update = (next: PreferencesState) => {
    setPreferences(next);
    apiFetch(buildApiUrl("/api/settings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        preferences: next,
        notificationPrefs: {
          emailDigest: next.emailDigest,
          jobAlerts: next.jobAlerts,
        },
        defaultVisibility: next.defaultVisibility,
      }),
    }).catch((error) => {
      toast.error(t("settings.preferences.syncError"), {
        description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
      });
    });
  };

  const toggle = (key: keyof Omit<PreferencesState, "defaultVisibility">) => {
    const next = { ...preferences, [key]: !preferences[key] };
    update(next);
    toast.success(t("settings.preferences.updated"));
  };

  const preferenceItems: Array<{
    key: keyof Omit<PreferencesState, "defaultVisibility">;
    title: string;
    desc: string;
  }> = [
    {
      key: "emailDigest",
      title: t("settings.preferences.emailDigest.title"),
      desc: t("settings.preferences.emailDigest.desc"),
    },
    {
      key: "jobAlerts",
      title: t("settings.preferences.jobAlerts.title"),
      desc: t("settings.preferences.jobAlerts.desc"),
    },
    {
      key: "publicLinkWarnings",
      title: t("settings.preferences.publicLinkWarnings.title"),
      desc: t("settings.preferences.publicLinkWarnings.desc"),
    },
    {
      key: "compactMode",
      title: t("settings.preferences.compactMode.title"),
      desc: t("settings.preferences.compactMode.desc"),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-5">
          <Bell className="h-5 w-5 text-orange-400" />
          <h2 className="font-serif text-2xl text-[#fdfbf7]">{t("settings.preferences.title")}</h2>
        </div>
        <div className="space-y-4">
          {preferenceItems.map(({ key, title, desc }) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={preferences[key]}
              onClick={() => toggle(key)}
              className="flex w-full items-center justify-between gap-4 rounded-sm border border-[#333] bg-[#0c0b0a] p-5 text-left transition-colors hover:border-[#555]"
            >
              <span>
                <span className="block text-sm font-bold text-[#fdfbf7]">{title}</span>
                <span className="mt-1 block text-xs text-[#fdfbf7]/45">{desc}</span>
              </span>
              <span className={`relative h-6 w-11 rounded-full border transition-colors ${preferences[key] ? "border-emerald-500/40 bg-emerald-500/20" : "border-[#444] bg-[#111]"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-[#fdfbf7] transition-transform ${preferences[key] ? "translate-x-5" : "translate-x-1"}`} />
              </span>
            </button>
          ))}
        </div>
      </GlowCard>

      <GlowCard className="p-8" glowColor="rgba(16, 185, 129, 0.12)">
        <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-5">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="font-serif text-2xl text-[#fdfbf7]">{t("settings.preferences.defaultsTitle")}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["private", "public"] as const).map((visibility) => (
            <button
              key={visibility}
              type="button"
              onClick={() => {
                update({ ...preferences, defaultVisibility: visibility });
                toast.success(t(visibility === "private" ? "settings.preferences.privateSelected" : "settings.preferences.publicSelected"));
              }}
              className={`rounded-sm border p-5 text-left transition-colors ${
                preferences.defaultVisibility === visibility
                  ? "border-orange-500/50 bg-orange-500/10"
                  : "border-[#333] bg-[#0c0b0a] hover:border-[#555]"
              }`}
            >
              <p className="text-sm font-bold capitalize text-[#fdfbf7]">
                {t(visibility === "private" ? "settings.preferences.visibility.private.title" : "settings.preferences.visibility.public.title")}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#fdfbf7]/45">
                {t(visibility === "private" ? "settings.preferences.visibility.private.desc" : "settings.preferences.visibility.public.desc")}
              </p>
            </button>
          ))}
        </div>
      </GlowCard>
    </div>
  );
};

const ProviderSettings = () => {
  const t = useT();

  const providers: Array<{
    name: string;
    model: string;
    envVar: string;
    descKey: MessageKey;
    connected: boolean;
    color: keyof typeof providerStyles;
  }> = [
    { name: "DeepSeek", model: "deepseek-v4-pro", envVar: "DEEPSEEK_API_KEY", descKey: "settings.providers.deepseek.desc", connected: true, color: "blue" },
    { name: "Gemini", model: "gemini-3.1-pro", envVar: "GEMINI_API_KEY", descKey: "settings.providers.gemini.desc", connected: true, color: "purple" },
    { name: "OpenAI", model: "gpt-4o-mini", envVar: "OPENAI_API_KEY", descKey: "settings.providers.openai.desc", connected: false, color: "emerald" },
    { name: "Anthropic", model: "claude-3-5-haiku", envVar: "ANTHROPIC_API_KEY", descKey: "settings.providers.anthropic.desc", connected: false, color: "orange" },
    { name: "MiniMax", model: "abab6.5s-chat", envVar: "MINIMAX_API_KEY", descKey: "settings.providers.minimax.desc", connected: false, color: "cyan" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <h2 className="font-serif text-2xl text-[#fdfbf7] mb-2">
          {t("settings.providers.title")}
        </h2>
        <p className="text-sm text-[#fdfbf7]/50 mb-4 max-w-2xl leading-relaxed">
          {t("settings.providers.subtitle")}
        </p>
        <div role="note" className="mb-8 flex items-start gap-3 rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-4 text-xs leading-relaxed text-[#fdfbf7]/55">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <p>{t("settings.providers.sessionNote")}</p>
        </div>

        <div className="space-y-4">
          {providers.map((p) => (
            <div key={p.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-[#333] bg-[#0c0b0a] p-5 hover:border-[#444] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${providerStyles[p.color]}`}>
                  <Cpu className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg text-[#fdfbf7]">{p.name}</h3>
                    <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-mono text-[#fdfbf7]/40 border border-[#333]">
                      {p.model}
                    </span>
                  </div>
                  <p className="text-xs text-[#fdfbf7]/40 mt-1">{t(p.descKey)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {p.connected ? (
                  <span className="flex items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                    <Check className="h-3 w-3" aria-hidden="true" /> {t("settings.providers.connected")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#333] bg-[#161616] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/50">
                    {t("dash.stat.missing")} · <code className="font-mono normal-case text-[#fdfbf7]/70">{p.envVar}</code>
                  </span>
                )}
                <button
                  type="button"
                  aria-label={t("settings.providers.routingToastTitle", { provider: p.name })}
                  onClick={() => toast.info(t("settings.providers.routingToastTitle", { provider: p.name }), { description: t("settings.providers.routingToastDesc", { model: p.model }) })}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-[#fdfbf7]/30 hover:text-[#fdfbf7] transition-colors rounded-sm border border-transparent hover:border-[#333] hover:bg-[#1a1a1a]"
                >
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ApiKeysSettings = ({ workspaceId }: { workspaceId?: string }) => {
  const { t, lang } = useI18n();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadKeys = async () => {
      const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
      const response = await apiFetch(buildApiUrl(`/api/api-keys${query}`), {
        signal: controller.signal,
      });
      const data = (await response.json()) as { keys: ApiKeyRecord[] };
      if (controller.signal.aborted) return;
      setKeys(data.keys);
      setNewSecret(null);
    };

    void loadKeys().catch((error) => {
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        return;
      }
      toast.error(t("settings.apiKeys.loadError"), {
        description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
      });
    });

    return () => controller.abort();
  }, [workspaceId, t]);

  const createKey = async () => {
    if (isCreatingKey) return;
    try {
      setIsCreatingKey(true);
      const response = await apiFetch(buildApiUrl("/api/api-keys"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Workspace key ${keys.length + 1}`,
          workspaceId,
        }),
      });
      const data = (await response.json()) as { key: ApiKeyRecord; secret: string };
      setKeys((current) => [data.key, ...current]);
      setNewSecret(data.secret);
      toast.success(t("settings.apiKeys.created"), {
        description: t("settings.apiKeys.createdDesc"),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.common.tryAgain"));
    } finally {
      setIsCreatingKey(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8" glowColor="rgba(8, 145, 178, 0.15)">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6 mb-6">
          <div>
            <h2 className="font-serif text-2xl text-[#fdfbf7] mb-1">{t("settings.apiKeys.title")}</h2>
            <p className="text-sm text-[#fdfbf7]/50">{t("settings.apiKeys.subtitle")}</p>
          </div>
          <button
            type="button"
            disabled={isCreatingKey}
            onClick={() => void createKey()}
            className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("settings.apiKeys.createKey")}
          </button>
        </div>

        {newSecret && (
          <div className="mb-4 rounded-sm border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              {t("settings.apiKeys.newSecret")}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-sm border border-emerald-500/20 bg-black/30 px-3 py-2 text-xs text-emerald-100">
                {newSecret}
              </code>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(newSecret);
                  toast[ok ? "success" : "error"](ok ? t("settings.common.secretCopied") : t("settings.common.clipboardBlocked"));
                }}
                className="rounded-sm border border-emerald-500/25 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300"
              >
                {t("settings.common.copy")}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {keys.map(key => (
            <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-[#333] bg-[#0c0b0a] p-5">
              <div>
                <h3 className="text-sm font-bold text-[#fdfbf7] mb-1">{key.name}</h3>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {key.prefix}
                  </code>
                  <span className="text-[10px] text-[#fdfbf7]/30 uppercase tracking-widest">
                    {t("settings.common.createdAt", { date: formatDate(key.createdAt, lang) })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-0.5">{t("settings.apiKeys.lastUsed")}</p>
                  <p className="text-xs text-[#fdfbf7]/60">{key.lastUsedAt ? formatDateTime(key.lastUsedAt, lang) : t("settings.apiKeys.never")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label={`${t("settings.common.copy")} ${key.name}`}
                    onClick={async () => {
                      const ok = await copyText(key.prefix);
                      toast[ok ? "success" : "error"](ok ? t("settings.apiKeys.prefixCopied") : t("settings.common.clipboardBlocked"));
                    }}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-[#fdfbf7]/40 hover:text-cyan-400 transition-colors rounded-sm hover:bg-cyan-500/10"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${t("dw.watch.remove")} ${key.name}`}
                    onClick={() => {
                      apiFetch(buildApiUrl(`/api/api-keys/${key.id}`), {
                        method: "DELETE",
                      })
                        .then(() => {
                          setKeys((current) => current.filter((item) => item.id !== key.id));
                          toast.success(t("settings.apiKeys.revoked"));
                        })
                        .catch((error) => {
                          toast.error(t("settings.apiKeys.revokeError"), {
                            description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
                          });
                        });
                    }}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-[#fdfbf7]/40 hover:text-red-400 transition-colors rounded-sm hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
};

type WebhookRecord = {
  id: string;
  url: string;
  eventTypes: string[];
  active: boolean;
  workspaceId: string | null;
  secret: string | null;
  createdAt: string;
  updatedAt: string;
};

const WebhooksSettings = ({ workspaceId }: { workspaceId?: string }) => {
  const { t, lang } = useI18n();
  const [subs, setSubs] = useState<WebhookRecord[]>([]);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["comparison.completed", "comparison.failed"]);
  const [isCreating, setIsCreating] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (value: string): string | null => {
    if (!value.trim()) return t("settings.webhooks.urlRequired");
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return t("settings.webhooks.urlProtocol");
      }
    } catch {
      return t("settings.webhooks.urlInvalid");
    }
    return null;
  };

  const openCreateForm = () => {
    const next = !isCreating;
    setIsCreating(next);
    if (next) {
      setUrlError(null);
      window.setTimeout(() => urlInputRef.current?.focus(), 0);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadSubs = async () => {
      const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
      const response = await apiFetch(buildApiUrl(`/api/webhooks/subscriptions${query}`), {
        signal: controller.signal,
      });
      const data = (await response.json()) as { subscriptions: WebhookRecord[] };
      if (controller.signal.aborted) return;
      setSubs(data.subscriptions);
    };

    void loadSubs().catch((error) => {
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        return;
      }
      toast.error(t("settings.webhooks.loadError"), {
        description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
      });
    });

    return () => controller.abort();
  }, [workspaceId, t]);

  const createSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) {
      setUrlError(validationError);
      urlInputRef.current?.focus();
      return;
    }
    try {
      const response = await apiFetch(buildApiUrl("/api/webhooks/subscriptions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          workspaceId,
          eventTypes: selectedEvents,
        }),
      });
      const data = (await response.json()) as { subscription: WebhookRecord; error?: string };
      if (data.error) {
        throw new Error(data.error);
      }
      setSubs((current) => [data.subscription, ...current]);
      setUrl("");
      setUrlError(null);
      setIsCreating(false);
      toast.success(t("settings.webhooks.created"));
    } catch (error) {
      toast.error(t("settings.webhooks.createError"), {
        description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
      });
    }
  };

  const toggleActive = async (sub: WebhookRecord) => {
    try {
      const nextActive = !sub.active;
      const response = await apiFetch(buildApiUrl(`/api/webhooks/subscriptions/${sub.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = (await response.json()) as { subscription: WebhookRecord; error?: string };
      if (data.error) throw new Error(data.error);
      setSubs((current) =>
        current.map((item) => (item.id === sub.id ? data.subscription : item))
      );
      toast.success(t(nextActive ? "settings.webhooks.activated" : "settings.webhooks.deactivated"));
    } catch (error) {
      toast.error(t("settings.webhooks.statusError"), {
        description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
      });
    }
  };

  const deleteSub = async (id: string) => {
    try {
      await apiFetch(buildApiUrl(`/api/webhooks/subscriptions/${id}`), {
        method: "DELETE",
      });
      setSubs((current) => current.filter((item) => item.id !== id));
      toast.success(t("settings.webhooks.deleted"));
    } catch (error) {
      toast.error(t("settings.webhooks.deleteError"), {
        description: error instanceof Error ? error.message : t("settings.common.tryAgain"),
      });
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8" glowColor="rgba(249, 115, 22, 0.15)">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6 mb-6">
          <div>
            <h2 className="font-serif text-2xl text-[#fdfbf7] mb-1">{t("settings.webhooks.title")}</h2>
            <p className="text-sm text-[#fdfbf7]/50">{t("settings.webhooks.subtitle")}</p>
          </div>
          <button
            onClick={openCreateForm}
            aria-expanded={isCreating}
            className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] shrink-0"
          >
            {isCreating ? t("settings.common.cancel") : <><Plus className="h-3.5 w-3.5" /> {t("settings.webhooks.addEndpoint")}</>}
          </button>
        </div>

        {isCreating && (
          <form onSubmit={createSub} noValidate className="mb-8 rounded-sm border border-[#333] bg-[#0c0b0a] p-6 space-y-4 animate-in fade-in duration-300">
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">{t("settings.webhooks.newTitle")}</h3>

            <div className="space-y-2">
              <label htmlFor="webhook-endpoint-url" className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">{t("settings.webhooks.endpointUrl")}</label>
              <input
                id="webhook-endpoint-url"
                ref={urlInputRef}
                type="url"
                required
                placeholder="https://yourdomain.com/webhooks/sideby"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError(validateUrl(e.target.value));
                }}
                aria-invalid={!!urlError}
                aria-describedby={urlError ? "webhook-endpoint-url-error" : undefined}
                className={`w-full rounded-sm border bg-black px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:ring-1 ${urlError ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : "border-[#333] focus:border-orange-500 focus:ring-orange-500/50"}`}
              />
              {urlError && (
                <p id="webhook-endpoint-url-error" role="alert" className="text-xs text-red-400">
                  {urlError}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 block">{t("settings.webhooks.eventSubscriptions")}</label>
              <div className="flex flex-col sm:flex-row gap-6">
                <label className="flex items-center gap-3 cursor-pointer text-sm text-[#fdfbf7]/70 hover:text-[#fdfbf7] transition-colors">
                  <input 
                    type="checkbox"
                    checked={selectedEvents.includes("comparison.completed")}
                    onChange={() => toggleEvent("comparison.completed")}
                    className="rounded border-[#333] bg-black text-orange-500 focus:ring-orange-500/50"
                  />
                  <span>comparison.completed</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm text-[#fdfbf7]/70 hover:text-[#fdfbf7] transition-colors">
                  <input 
                    type="checkbox"
                    checked={selectedEvents.includes("comparison.failed")}
                    onChange={() => toggleEvent("comparison.failed")}
                    className="rounded border-[#333] bg-black text-orange-500 focus:ring-orange-500/50"
                  />
                  <span>comparison.failed</span>
                </label>
              </div>
            </div>

            <button type="submit" className="flex items-center gap-2 rounded-sm bg-orange-600 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-700">
              <Save className="h-3.5 w-3.5" />
              {t("settings.webhooks.saveEndpoint")}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {subs.length === 0 ? (
            <p className="text-sm text-[#fdfbf7]/30 text-center py-6">{t("settings.webhooks.empty")}</p>
          ) : (
            subs.map((sub) => (
              <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-sm border border-[#333] bg-[#0c0b0a] p-5">
                <div className="space-y-2 max-w-xl min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-[#fdfbf7] truncate max-w-md block">{sub.url}</span>
                    <button 
                      onClick={() => toggleActive(sub)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                        sub.active 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400 hover:bg-zinc-500/20"
                      }`}
                    >
                      {sub.active ? t("settings.webhooks.active") : t("settings.webhooks.inactive")}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {sub.eventTypes.map((et) => (
                      <span key={et} className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        {et}
                      </span>
                    ))}
                    <span className="text-[10px] text-[#fdfbf7]/30 uppercase tracking-widest">
                      {t("settings.common.createdAt", { date: formatDate(sub.createdAt, lang) })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-[#fdfbf7]/40 uppercase tracking-widest">{t("settings.webhooks.secretLabel")}</span>
                    {sub.secret ? (
                      <>
                        <code className="text-xs font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded">
                          {sub.secret}
                        </code>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await copyText(sub.secret || "");
                            toast[ok ? "success" : "error"](ok ? t("settings.common.secretCopied") : t("settings.common.clipboardBlocked"));
                          }}
                          aria-label={t("settings.webhooks.copySecretTitle")}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center text-[#fdfbf7]/40 hover:text-cyan-400 transition-colors p-1"
                          title={t("settings.webhooks.copySecretTitle")}
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[#fdfbf7]/30">
                        {t("settings.webhooks.hiddenAfterCreation")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    type="button"
                    aria-label={`${t("dw.watch.remove")} ${sub.url}`}
                    onClick={() => deleteSub(sub.id)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-[#fdfbf7]/40 hover:text-red-400 transition-colors rounded-sm hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </GlowCard>
      <KeyboardSpacer />
    </div>
  );
};

export default SettingsPage;

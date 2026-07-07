import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { WorkspaceRecord } from "@/contexts/WorkspaceContext";
import { GlowCard } from "@/components/GlowCard";
import { copyText } from "@/lib/clipboard";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

type Tab = "general" | "preferences" | "providers" | "api-keys" | "webhooks";
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
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".set-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".set-nav", { x: -20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".set-content", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-8 max-w-6xl">
      <div className="set-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Configuration
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Workspace Settings
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          Manage your workspace preferences, configure custom AI provider credentials, and generate API keys for orchestration access.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Settings Sidebar Nav */}
        <aside className="set-nav w-full lg:w-64 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest rounded-sm transition-all ${
              activeTab === "general" 
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
                : "text-[#fdfbf7]/50 hover:bg-[#111] hover:text-[#fdfbf7] border border-transparent"
            }`}
          >
            <Settings2 className="h-4 w-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest rounded-sm transition-all ${
              activeTab === "preferences" 
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
                : "text-[#fdfbf7]/50 hover:bg-[#111] hover:text-[#fdfbf7] border border-transparent"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest rounded-sm transition-all ${
              activeTab === "providers" 
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
                : "text-[#fdfbf7]/50 hover:bg-[#111] hover:text-[#fdfbf7] border border-transparent"
            }`}
          >
            <Bot className="h-4 w-4" />
            AI Providers
          </button>
          <button
            onClick={() => setActiveTab("api-keys")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest rounded-sm transition-all ${
              activeTab === "api-keys" 
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
                : "text-[#fdfbf7]/50 hover:bg-[#111] hover:text-[#fdfbf7] border border-transparent"
            }`}
          >
            <Key className="h-4 w-4" />
            Developer API
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest rounded-sm transition-all ${
              activeTab === "webhooks" 
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
                : "text-[#fdfbf7]/50 hover:bg-[#111] hover:text-[#fdfbf7] border border-transparent"
            }`}
          >
            <Webhook className="h-4 w-4" />
            Webhooks
          </button>
        </aside>

        {/* Settings Content Area */}
        <div className="set-content flex-1 w-full min-w-0">
          {activeTab === "general" && <GeneralSettings workspace={activeWorkspace} />}
          {activeTab === "preferences" && <PreferenceSettings workspaceId={activeWorkspace?.id} />}
          {activeTab === "providers" && <ProviderSettings />}
          {activeTab === "api-keys" && <ApiKeysSettings workspaceId={activeWorkspace?.id} />}
          {activeTab === "webhooks" && <WebhooksSettings workspaceId={activeWorkspace?.id} />}
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-[#1f1f1f] text-center text-xs text-[#fdfbf7]/30">
        <a href="https://snapsolve.ink" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
          Made by SnapSolve Ink
        </a>
      </div>
    </div>
  );
};

const GeneralSettings = ({ workspace }: { workspace: WorkspaceRecord | null }) => {
  const [name, setName] = useState(workspace?.name || "");
  const [slug, setSlug] = useState(workspace?.slug || "");

  useEffect(() => {
    setName(workspace?.name || "");
    setSlug(workspace?.slug || "");
  }, [workspace?.name, workspace?.slug]);

  const save = async () => {
    if (!workspace?.id) return;
    await apiFetch(buildApiUrl("/api/workspaces"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id, name, slug }),
    });
    toast.success("Workspace profile saved.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8">
        <h2 className="font-serif text-2xl text-[#fdfbf7] border-b border-[#2a2a2a] pb-4 mb-6">
          Workspace Profile
        </h2>
        <div className="space-y-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">Workspace Name</label>
            <input 
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">URL Slug</label>
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
          <button onClick={() => void save().catch((error) => toast.error("Unable to save workspace", { description: error instanceof Error ? error.message : "Try again shortly." }))} className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]">
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </button>
        </div>
      </GlowCard>

      <div className="rounded-sm border border-red-500/30 bg-red-500/5 p-8">
        <h2 className="font-serif text-2xl text-red-400 border-b border-red-500/20 pb-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-red-400/70 mb-6 leading-relaxed max-w-2xl">
          Permanently delete this workspace, all of its projects, comparison data, uploaded knowledge base documents, and API keys. This action cannot be undone.
        </p>
        <button
          onClick={() => toast.warning("Workspace deletion is locked.", {
            description: "Contact the workspace owner before permanently deleting production data.",
          })}
          className="flex items-center gap-2 rounded-sm border border-red-500/40 bg-red-500/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Workspace
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
      toast.error("Unable to load preferences", {
        description: error instanceof Error ? error.message : "Try again shortly.",
      });
    });
  }, [workspaceId]);

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
      toast.error("Preference sync failed", {
        description: error instanceof Error ? error.message : "Try again shortly.",
      });
    });
  };

  const toggle = (key: keyof Omit<PreferencesState, "defaultVisibility">) => {
    const next = { ...preferences, [key]: !preferences[key] };
    update(next);
    toast.success("Preference updated.");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-5">
          <Bell className="h-5 w-5 text-orange-400" />
          <h2 className="font-serif text-2xl text-[#fdfbf7]">Product Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            ["emailDigest", "Daily research digest", "Send a summary of completed comparisons and changed facts."],
            ["jobAlerts", "Job completion alerts", "Notify when long-running research finishes or fails."],
            ["publicLinkWarnings", "Public link warnings", "Ask before publishing private research to a public URL."],
            ["compactMode", "Compact dashboard mode", "Use denser dashboard rows for repeated daily work."],
          ].map(([key, title, desc]) => (
            <button
              key={key}
              type="button"
            onClick={() => toggle(key as keyof Omit<PreferencesState, "defaultVisibility">)}
              className="flex w-full items-center justify-between gap-4 rounded-sm border border-[#333] bg-[#0c0b0a] p-5 text-left transition-colors hover:border-[#555]"
            >
              <span>
                <span className="block text-sm font-bold text-[#fdfbf7]">{title}</span>
                <span className="mt-1 block text-xs text-[#fdfbf7]/45">{desc}</span>
              </span>
              <span className={`relative h-6 w-11 rounded-full border transition-colors ${preferences[key as keyof Omit<PreferencesState, "defaultVisibility">] ? "border-emerald-500/40 bg-emerald-500/20" : "border-[#444] bg-[#111]"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-[#fdfbf7] transition-transform ${preferences[key as keyof Omit<PreferencesState, "defaultVisibility">] ? "translate-x-5" : "translate-x-1"}`} />
              </span>
            </button>
          ))}
        </div>
      </GlowCard>

      <GlowCard className="p-8" glowColor="rgba(16, 185, 129, 0.12)">
        <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-5">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="font-serif text-2xl text-[#fdfbf7]">Workspace Defaults</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["private", "public"] as const).map((visibility) => (
            <button
              key={visibility}
              type="button"
              onClick={() => {
                update({ ...preferences, defaultVisibility: visibility });
                toast.success(`${visibility === "private" ? "Private" : "Public"} default selected.`);
              }}
              className={`rounded-sm border p-5 text-left transition-colors ${
                preferences.defaultVisibility === visibility
                  ? "border-orange-500/50 bg-orange-500/10"
                  : "border-[#333] bg-[#0c0b0a] hover:border-[#555]"
              }`}
            >
              <p className="text-sm font-bold capitalize text-[#fdfbf7]">{visibility} by default</p>
              <p className="mt-2 text-xs leading-relaxed text-[#fdfbf7]/45">
                {visibility === "private"
                  ? "New comparisons stay inside the workspace until published."
                  : "Completed comparisons are prepared for share links faster."}
              </p>
            </button>
          ))}
        </div>
      </GlowCard>
    </div>
  );
};

const ProviderSettings = () => {
  const [customProvider, setCustomProvider] = useState<string | null>(() => localStorage.getItem("sideby.customProvider"));
  const providers = [
    { name: "DeepSeek", model: "deepseek-v4-pro", desc: "Used for high-speed logic, extraction, and source normalization.", connected: true, color: "blue" },
    { name: "Gemini", model: "gemini-3.1-pro", desc: "Used for synthesis, tradeoff reasoning, and executive verdicts.", connected: true, color: "purple" },
    { name: "OpenAI", model: "gpt-4o-mini", desc: "Fallback general reasoning.", connected: false, color: "emerald" },
    { name: "Anthropic", model: "claude-3-5-haiku", desc: "Nuanced prose generation.", connected: false, color: "orange" },
    { name: "MiniMax", model: "abab6.5s-chat", desc: "Latency-optimized alternate route.", connected: false, color: "cyan" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <h2 className="font-serif text-2xl text-[#fdfbf7] mb-2">
          Model Registry & Routing
        </h2>
        <p className="text-sm text-[#fdfbf7]/50 mb-8 max-w-2xl leading-relaxed">
          SideBy dynamically routes comparison tasks to the most optimal model. If you provide your own API keys, we will use your quota instead of the platform allowance.
        </p>

        <div className="space-y-4">
          {providers.map((p) => (
            <div key={p.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-[#333] bg-[#0c0b0a] p-5 hover:border-[#444] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${providerStyles[p.color as keyof typeof providerStyles]}`}>
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg text-[#fdfbf7]">{p.name}</h3>
                    <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-mono text-[#fdfbf7]/40 border border-[#333]">
                      {p.model}
                    </span>
                  </div>
                  <p className="text-xs text-[#fdfbf7]/40 mt-1">{p.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {p.connected ? (
                  <span className="flex items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setCustomProvider(p.name);
                      localStorage.setItem("sideby.customProvider", p.name);
                      toast.success(`${p.name} route saved.`, {
                        description: "Add the provider secret in Vercel before production traffic uses this route.",
                      });
                    }}
                    className="rounded-sm border border-[#333] bg-[#111] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 hover:text-[#fdfbf7] hover:border-[#555] transition-colors"
                  >
                    {customProvider === p.name ? "Saved" : "Add Key"}
                  </button>
                )}
                <button
                  onClick={() => toast.info(`${p.name} routing`, { description: `${p.model} is visible in the model registry.` })}
                  className="p-2 text-[#fdfbf7]/30 hover:text-[#fdfbf7] transition-colors rounded-sm border border-transparent hover:border-[#333] hover:bg-[#1a1a1a]"
                >
                  <Settings2 className="h-4 w-4" />
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
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const loadKeys = async () => {
    const response = await apiFetch(buildApiUrl("/api/api-keys"));
    const data = (await response.json()) as { keys: ApiKeyRecord[] };
    setKeys(data.keys);
  };

  useEffect(() => {
    void loadKeys().catch((error) => {
      toast.error("Unable to load API keys", {
        description: error instanceof Error ? error.message : "Try again shortly.",
      });
    });
  }, []);

  const createKey = async () => {
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
    toast.success("API key created.", {
      description: "Copy the full secret now. It will not be shown again.",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8" glowColor="rgba(8, 145, 178, 0.15)">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6 mb-6">
          <div>
            <h2 className="font-serif text-2xl text-[#fdfbf7] mb-1">Developer API Keys</h2>
            <p className="text-sm text-[#fdfbf7]/50">Use these keys to access the SideBy Orchestration API programmatically.</p>
          </div>
          <button onClick={createKey} className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Create Key
          </button>
        </div>

        {newSecret && (
          <div className="mb-4 rounded-sm border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              New key secret
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-sm border border-emerald-500/20 bg-black/30 px-3 py-2 text-xs text-emerald-100">
                {newSecret}
              </code>
              <button
                onClick={async () => {
                  const ok = await copyText(newSecret);
                  toast[ok ? "success" : "error"](ok ? "Secret copied." : "Clipboard permission is blocked.");
                }}
                className="rounded-sm border border-emerald-500/25 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300"
              >
                Copy
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
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-0.5">Last Used</p>
                  <p className="text-xs text-[#fdfbf7]/60">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const ok = await copyText(key.prefix);
                      toast[ok ? "success" : "error"](ok ? "Key prefix copied." : "Clipboard permission is blocked.");
                    }}
                    className="p-2 text-[#fdfbf7]/40 hover:text-cyan-400 transition-colors rounded-sm hover:bg-cyan-500/10"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      apiFetch(buildApiUrl(`/api/api-keys/${key.id}`), {
                        method: "DELETE",
                      })
                        .then(() => {
                          setKeys((current) => current.filter((item) => item.id !== key.id));
                          toast.success("API key revoked.");
                        })
                        .catch((error) => {
                          toast.error("Unable to revoke API key", {
                            description: error instanceof Error ? error.message : "Try again shortly.",
                          });
                        });
                    }}
                    className="p-2 text-[#fdfbf7]/40 hover:text-red-400 transition-colors rounded-sm hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
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
  secret: string;
  createdAt: string;
  updatedAt: string;
};

const WebhooksSettings = ({ workspaceId }: { workspaceId?: string }) => {
  const [subs, setSubs] = useState<WebhookRecord[]>([]);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["comparison.completed", "comparison.failed"]);
  const [isCreating, setIsCreating] = useState(false);

  const loadSubs = async () => {
    const response = await apiFetch(buildApiUrl("/api/webhooks/subscriptions"));
    const data = (await response.json()) as { subscriptions: WebhookRecord[] };
    setSubs(data.subscriptions);
  };

  useEffect(() => {
    void loadSubs().catch((error) => {
      toast.error("Unable to load webhooks", {
        description: error instanceof Error ? error.message : "Try again shortly.",
      });
    });
  }, []);

  const createSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please provide a webhook endpoint URL.");
      return;
    }
    try {
      const response = await apiFetch(buildApiUrl("/api/webhooks/subscriptions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
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
      setIsCreating(false);
      toast.success("Webhook subscription created successfully.");
    } catch (error) {
      toast.error("Unable to create webhook subscription", {
        description: error instanceof Error ? error.message : "Try again shortly.",
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
      toast.success(nextActive ? "Webhook activated." : "Webhook deactivated.");
    } catch (error) {
      toast.error("Failed to update status", {
        description: error instanceof Error ? error.message : "Try again shortly.",
      });
    }
  };

  const deleteSub = async (id: string) => {
    try {
      await apiFetch(buildApiUrl(`/api/webhooks/subscriptions/${id}`), {
        method: "DELETE",
      });
      setSubs((current) => current.filter((item) => item.id !== id));
      toast.success("Webhook subscription deleted.");
    } catch (error) {
      toast.error("Unable to delete webhook subscription", {
        description: error instanceof Error ? error.message : "Try again shortly.",
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
            <h2 className="font-serif text-2xl text-[#fdfbf7] mb-1">Webhook Subscriptions</h2>
            <p className="text-sm text-[#fdfbf7]/50">Receive real-time notifications on comparison jobs directly in your server.</p>
          </div>
          <button 
            onClick={() => setIsCreating(!isCreating)} 
            className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] shrink-0"
          >
            {isCreating ? "Cancel" : <><Plus className="h-3.5 w-3.5" /> Add Endpoint</>}
          </button>
        </div>

        {isCreating && (
          <form onSubmit={createSub} className="mb-8 rounded-sm border border-[#333] bg-[#0c0b0a] p-6 space-y-4 animate-in fade-in duration-300">
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">New Webhook Subscription</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">Endpoint URL</label>
              <input 
                type="url"
                required
                placeholder="https://yourdomain.com/webhooks/sideby"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-sm border border-[#333] bg-black px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 block">Event Subscriptions</label>
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
              Save Endpoint
            </button>
          </form>
        )}

        <div className="space-y-4">
          {subs.length === 0 ? (
            <p className="text-sm text-[#fdfbf7]/30 text-center py-6">No active webhook subscriptions configured.</p>
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
                      {sub.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {sub.eventTypes.map((et) => (
                      <span key={et} className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        {et}
                      </span>
                    ))}
                    <span className="text-[10px] text-[#fdfbf7]/30 uppercase tracking-widest">
                      Created {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Signing Secret */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-[#fdfbf7]/40 uppercase tracking-widest">Secret:</span>
                    <code className="text-xs font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded">
                      {sub.secret}
                    </code>
                    <button
                      onClick={async () => {
                        const ok = await copyText(sub.secret);
                        toast[ok ? "success" : "error"](ok ? "Secret copied." : "Clipboard permission is blocked.");
                      }}
                      className="text-[#fdfbf7]/40 hover:text-cyan-400 transition-colors p-1"
                      title="Copy signing secret"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => deleteSub(sub.id)}
                    className="p-2 text-[#fdfbf7]/40 hover:text-red-400 transition-colors rounded-sm hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </GlowCard>
    </div>
  );
};

export default SettingsPage;

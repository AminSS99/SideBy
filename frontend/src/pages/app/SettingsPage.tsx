import React, { useRef, useState } from "react";
import { 
  Settings2, 
  Key, 
  Bot, 
  Cpu, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus,
  AlertTriangle
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { envConfig } from "@/config/env";
import { GlowCard } from "@/components/GlowCard";

type Tab = "general" | "providers" | "api-keys";

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
        </aside>

        {/* Settings Content Area */}
        <div className="set-content flex-1 w-full min-w-0">
          {activeTab === "general" && <GeneralSettings workspace={activeWorkspace} />}
          {activeTab === "providers" && <ProviderSettings />}
          {activeTab === "api-keys" && <ApiKeysSettings />}
        </div>
      </div>
    </div>
  );
};

const GeneralSettings = ({ workspace }: { workspace: any }) => {
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
              defaultValue={workspace?.name || ""}
              className="w-full rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-3 text-sm text-[#fdfbf7] outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">URL Slug</label>
            <div className="flex rounded-sm border border-[#333] bg-[#0c0b0a] overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
              <span className="flex items-center px-4 bg-[#111] border-r border-[#333] text-sm text-[#fdfbf7]/40">
                snapsolve.ink/
              </span>
              <input 
                defaultValue={workspace?.slug || ""}
                className="w-full bg-transparent px-4 py-3 text-sm text-[#fdfbf7] outline-none"
              />
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]">
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
        <button className="flex items-center gap-2 rounded-sm border border-red-500/40 bg-red-500/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/20">
          <Trash2 className="h-3.5 w-3.5" />
          Delete Workspace
        </button>
      </div>
    </div>
  );
};

const ProviderSettings = () => {
  const providers = [
    { name: "DeepSeek", model: "deepseek-chat", desc: "Used for high-speed extraction.", connected: true, color: "blue" },
    { name: "Gemini", model: "gemini-2.0-flash", desc: "Used for synthesis and context.", connected: true, color: "purple" },
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
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-${p.color}-500/10 border border-${p.color}-500/20 text-${p.color}-400`}>
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
                  <button className="rounded-sm border border-[#333] bg-[#111] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/50 hover:text-[#fdfbf7] hover:border-[#555] transition-colors">
                    Add Key
                  </button>
                )}
                <button className="p-2 text-[#fdfbf7]/30 hover:text-[#fdfbf7] transition-colors rounded-sm border border-transparent hover:border-[#333] hover:bg-[#1a1a1a]">
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

const ApiKeysSettings = () => {
  const [keys] = useState([
    { id: "1", name: "Production CI/CD", prefix: "sb_prod_...", created: "2024-03-01", lastUsed: "2 hours ago" },
    { id: "2", name: "Local Development", prefix: "sb_dev_...", created: "2024-03-05", lastUsed: "Never" }
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8" glowColor="rgba(8, 145, 178, 0.15)">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6 mb-6">
          <div>
            <h2 className="font-serif text-2xl text-[#fdfbf7] mb-1">Developer API Keys</h2>
            <p className="text-sm text-[#fdfbf7]/50">Use these keys to access the SideBy Orchestration API programmatically.</p>
          </div>
          <button className="flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Create Key
          </button>
        </div>

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
                    Created {key.created}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/40 mb-0.5">Last Used</p>
                  <p className="text-xs text-[#fdfbf7]/60">{key.lastUsed}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-[#fdfbf7]/40 hover:text-red-400 transition-colors rounded-sm hover:bg-red-500/10">
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

export default SettingsPage;
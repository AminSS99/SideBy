import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { Send, Bot, User, LoaderCircle, Sparkles, Database, FolderKanban, Check, ToggleRight, ToggleLeft, X } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { KeyboardSpacer } from "@/components/KeyboardSpacer";
import { useT } from "@/i18n";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
}

interface SelectableModelOption {
  id: string;
  label: string;
  provider?: string;
  badge?: string;
}

const DEFAULT_MODEL_OPTIONS: SelectableModelOption[] = [
  { id: "auto", label: "Auto (Best Available)" },
];

interface KnowledgeDocument {
  id: string;
  filename: string;
  status: "indexing" | "indexed" | "error" | "deleted";
  chunkCount: number;
}

interface ActiveKnowledgeFile {
  id: string;
  filename: string;
  chunkCount: number;
  active: boolean;
}

const ChatPage = () => {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProjects();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "1",
      role: "assistant",
      content: t("ins.chat.welcome"),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("auto");
  const [modelOptions, setModelOptions] = useState<SelectableModelOption[]>(DEFAULT_MODEL_OPTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeFiles, setActiveFiles] = useState<ActiveKnowledgeFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const welcomeTextRef = useRef(t("ins.chat.welcome"));
  welcomeTextRef.current = t("ins.chat.welcome");
  const isFirstScopeRenderRef = useRef(true);

  const { activeContextCount, availableChunksCount } = useMemo(() => {
    let activeContextCount = 0;
    let availableChunksCount = 0;
    for (const file of activeFiles) {
      if (file.active) {
        activeContextCount++;
        availableChunksCount += file.chunkCount;
      }
    }
    return { activeContextCount, availableChunksCount };
  }, [activeFiles]);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline({ defaults: { clearProps: "transform,opacity" } });
    tl.from(".chat-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".chat-layout > *", { y: 40, opacity: 0, stagger: 0.15, duration: 1, ease: "expo.out" }, "-=0.6");
  }, { scope: containerRef });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadKnowledgeFiles = useCallback(async () => {
    if (!activeWorkspace) {
      setActiveFiles([]);
      setIsLoadingFiles(false);
      setFilesError(null);
      return;
    }

    try {
      setIsLoadingFiles(true);
      setFilesError(null);
      const params = new URLSearchParams({ workspaceId: activeWorkspace.id });
      if (activeProject) params.set("projectId", activeProject.id);

      const res = await apiFetch(buildApiUrl(`/api/knowledge/documents?${params.toString()}`));
      const data = (await res.json()) as { documents: KnowledgeDocument[] };
      const indexedDocuments = data.documents.filter((document) => document.status === "indexed");

      setActiveFiles((current) => {
        const currentMap = new Map(current.map(f => [f.id, f]));
        return indexedDocuments.map((document) => {
          const existing = currentMap.get(document.id);
          return {
            id: document.id,
            filename: document.filename,
            chunkCount: document.chunkCount,
            active: existing?.active ?? true,
          };
        });
      });
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : t("ins.chat.loadFilesError"));
      setActiveFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [activeProject, activeWorkspace, t]);

  useEffect(() => {
    void loadKnowledgeFiles();
  }, [loadKnowledgeFiles]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await apiFetch(buildApiUrl("/api/chat?models=1"));
        if (!res.ok || !active) return;
        const data = (await res.json()) as { models?: SelectableModelOption[] };
        if (active && Array.isArray(data.models) && data.models.length > 0) {
          setModelOptions(data.models);
        }
      } catch {
        // Keep default Auto option when model catalog is unavailable.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Abort any active stream and reset conversation when workspace or project changes.
  useEffect(() => {
    if (isFirstScopeRenderRef.current) {
      isFirstScopeRenderRef.current = false;
    } else {
      streamAbortRef.current?.abort();
      streamAbortRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: welcomeTextRef.current,
        },
      ]);
    }

    return () => {
      streamAbortRef.current?.abort();
      streamAbortRef.current = null;
    };
  }, [activeWorkspace?.id, activeProject?.id]);

  // Prefill composer input when navigated via /app/chat?prompt=... (e.g. from PromptsPage).
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      setInput(promptParam);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("prompt");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const toggleFile = (id: string) => {
    setActiveFiles(files => 
      files.map(f => f.id === id ? { ...f, active: !f.active } : f)
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isStreaming) return;

    const controller = new AbortController();
    streamAbortRef.current?.abort();
    streamAbortRef.current = controller;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    const assistantId = (Date.now() + 1).toString();
    setMessages([
      ...newMessages,
      {
        id: assistantId,
        role: "assistant",
        content: "",
      },
    ]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const selectedDocumentIds = activeFiles.reduce((acc, file) => {
        if (file.active) acc.push(file.id);
        return acc;
      }, [] as string[]);

      const res = await apiFetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: apiMessages,
          workspaceId: activeWorkspace?.id,
          projectId: activeProject?.id ?? null,
          documentIds: selectedDocumentIds,
          stream: true,
          ...(selectedModelId && selectedModelId !== "auto" ? { modelId: selectedModelId } : {}),
        }),
      });

      if (controller.signal.aborted) return;

      if (!res.body) {
        const data = await res.json();
        if (controller.signal.aborted) return;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: data.answer || t("ins.chat.noResponseError") }
              : message,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";

      const applyAssistantContent = (content: string, append = false) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: append ? message.content + content : content }
              : message,
          ),
        );
      };

      const handleSseBlock = (block: string) => {
        if (controller.signal.aborted) return;
        const event = block
          .split("\n")
          .find((line) => line.startsWith("event:"))
          ?.slice("event:".length)
          .trim();
        const dataLine = block
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!event || !dataLine) return;

        const payload = JSON.parse(dataLine.slice("data:".length).trim()) as {
          token?: string;
          answer?: string;
          model?: string;
        };

        if (event === "token" && payload.token) {
          streamedContent += payload.token;
          applyAssistantContent(payload.token, true);
          setIsLoading(false);
        }
        if (event === "final") {
          if (payload.answer && streamedContent.trim().length === 0) {
            applyAssistantContent(payload.answer);
          }
          if (typeof payload.model === "string" && payload.model.trim()) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId ? { ...message, model: payload.model } : message,
              ),
            );
          }
        }
      };

      while (true) {
        if (controller.signal.aborted) {
          await reader.cancel().catch(() => undefined);
          break;
        }
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          try {
            handleSseBlock(block);
          } catch {
            // Ignore malformed stream chunks and keep reading.
          }
        }
      }

      if (!controller.signal.aborted && buffer.trim()) {
        try {
          handleSseBlock(buffer);
        } catch {
          // Ignore trailing malformed stream chunks.
        }
      }
    } catch (err) {
      if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
        return;
      }
      console.error(err);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: t("ins.chat.orchestratorError"),
              }
            : message,
        ),
      );
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
        setIsLoading(false);
        setIsStreaming(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col space-y-6">
      <div className="chat-header border-b border-white/5 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
              {t("ins.chat.kicker")}
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#fdfbf7] tracking-tight">
              {t("app.nav.chat")}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              disabled={isLoading || isStreaming}
              aria-label="AI Model"
              className="min-h-10 max-w-full rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] px-3 py-1.5 text-xs text-[#fdfbf7] focus:border-orange-500 focus:outline-none sm:w-56"
            >
              {modelOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-all shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] active:scale-[0.98]"
            >
              <Database className="h-4 w-4" />
              <span>{t("ins.chat.contextButton", { count: activeContextCount })}</span>
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#fdfbf7]/55 leading-relaxed max-w-3xl">
          {t("ins.chat.subtitle")}
        </p>
      </div>

      <div className="chat-layout grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_350px] flex-1 min-h-[500px] h-[calc(100vh-16rem)]">
        
        {/* Main Chat Window */}
        <div className="flex min-h-0 flex-1 flex-col rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden shadow-2xl h-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`animate-in fade-in slide-in-from-bottom-3 duration-500 flex gap-3 sm:gap-4 ${
                  msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-sm border ${
                    msg.role === "assistant"
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      : "bg-[#222] text-[#fdfbf7]/80 border-[#444]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-sm p-4 sm:p-5 border whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "bg-[#0c0b0a] border-[#333] text-[#fdfbf7]/90"
                      : "bg-[#1a1a1a] border-[#444] text-[#fdfbf7]"
                  }`}
                >
                  <p className="text-sm leading-relaxed font-serif">{msg.content}</p>
                  {msg.role === "assistant" && msg.model && (
                    <div className="mt-3 flex justify-end">
                      <span className="rounded-sm border border-[#2a2a2a] bg-[#161513] px-1.5 py-0.5 font-mono text-[9px] text-[#fdfbf7]/45">
                        {msg.model}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="dark flex items-center rounded-sm bg-[#0c0b0a] border border-[#333] px-5 py-3 text-sm text-[#fdfbf7]/70">
                  <AITextLoading
                    texts={[t("chat.load1"), t("chat.load2"), t("chat.load3"), t("chat.load4")]}
                    label={t("chat.working")}
                    className="justify-start text-sm font-medium text-[#fdfbf7]/80 dark:text-[#fdfbf7]/80"
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#2a2a2a] bg-[#0c0b0a] p-4 sm:p-5">
            <form
              onSubmit={handleSend}
              className="relative mx-auto w-full flex items-end gap-3 rounded-sm border border-[#333] bg-[#111] p-2 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && !isStreaming) {
                      void handleSend();
                    }
                  }
                }}
                placeholder={t("ins.chat.inputPlaceholder")}
                className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-[#fdfbf7] placeholder:text-[#fdfbf7]/30 outline-none"
                rows={1}
              />
              <button
                type="submit"
                aria-label={t("fu.sendAria")}
                disabled={!input.trim() || isLoading || isStreaming}
                className="flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm bg-[#fdfbf7] text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 disabled:hover:bg-white"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            <div className="mt-3 text-center hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                {t("ins.chat.disclaimer")}
              </p>
            </div>
            <KeyboardSpacer />
          </div>
        </div>

        {/* Right Sidebar - RAG Context Panel */}
        <aside className="hidden lg:flex flex-col space-y-4 h-full overflow-y-auto no-scrollbar">
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
            <h3 className="flex items-center gap-2 font-serif text-lg text-[#fdfbf7] border-b border-[#2a2a2a] pb-3 mb-4">
              <FolderKanban className="h-4 w-4 text-emerald-400" />
              {t("ins.chat.activeProject")}
            </h3>
            <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-sm text-[#fdfbf7]/70">
              {activeProject ? activeProject.name : t("ins.chat.globalWorkspace")}
            </div>
            <p className="mt-2 text-[9px] uppercase tracking-widest font-bold text-[#fdfbf7]/40 leading-relaxed">
              {t("ins.chat.activeProjectNote")}
            </p>
          </div>

          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3 mb-4">
              <h3 className="flex items-center gap-2 font-serif text-lg text-[#fdfbf7]">
                <Database className="h-4 w-4 text-orange-400" />
                {t("ins.chat.knowledgeBase")}
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-[#1a1a1a] border border-[#333] px-2 py-0.5 rounded-sm">
                {activeFiles.some((file) => file.active) ? t("ins.chat.modeRag") : t("ins.chat.modeGeneral")}
              </span>
            </div>
            
            <p className="text-[10px] text-[#fdfbf7]/50 uppercase tracking-widest font-bold mb-4">
              {t("ins.chat.groundPrompt")}
            </p>

            <div className="space-y-2 flex-1">
              {isLoadingFiles && (
                <div className="flex items-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-xs text-[#fdfbf7]/45">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-orange-400" />
                  {t("ins.chat.loadingDocs")}
                </div>
              )}

              {!isLoadingFiles && filesError && (
                <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-xs leading-relaxed text-red-200/80">
                  {filesError}
                </div>
              )}

              {!isLoadingFiles && !filesError && activeFiles.length === 0 && (
                <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-xs leading-relaxed text-[#fdfbf7]/45">
                  {t("ins.chat.noDocsScope")}
                </div>
              )}

              {!isLoadingFiles && activeFiles.map(file => (
                <button
                  key={file.id}
                  onClick={() => toggleFile(file.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-sm border transition-colors ${
                    file.active 
                      ? "bg-orange-500/10 border-orange-500/30" 
                      : "bg-[#0c0b0a] border-[#333] hover:border-[#444]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 flex h-6 w-6 rounded-sm items-center justify-center border ${
                      file.active ? "bg-orange-500 border-orange-500 text-white" : "bg-[#1a1a1a] border-[#444] text-transparent"
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className={`text-xs truncate text-left ${file.active ? "text-[#fdfbf7]" : "text-[#fdfbf7]/50"}`}>
                      {file.filename}
                    </span>
                  </div>
                  {file.active ? (
                    <ToggleRight className="h-4 w-4 shrink-0 text-orange-400" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 shrink-0 text-[#fdfbf7]/30" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
              <p className="text-[9px] text-[#fdfbf7]/40 leading-relaxed">
                {t("ins.chat.activeContextLabel")} <strong className="text-[#fdfbf7]/70">{t("ins.chat.docsCount", { count: activeContextCount })}</strong>
                <br />
                {t("ins.chat.availableChunksLabel")} <strong className="text-[#fdfbf7]/70">{availableChunksCount}</strong>
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Grounding Context Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-black/80 lg:hidden"
            />
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 right-0 z-[70] w-[300px] max-w-[85vw] bg-[#0c0b0a] border-l border-[#2a2a2a] shadow-2xl p-6 flex flex-col space-y-4 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
                <h3 className="flex items-center gap-2 font-serif text-lg text-white">
                  <Database className="h-4 w-4 text-orange-400" />
                  {t("ins.chat.mobileDrawerTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label={`${t("dm.drawer.close")} ${t("ins.chat.mobileDrawerTitle")}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center p-1 text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* RAG Context Content */}
              <div className="space-y-4 overflow-y-auto flex-1 no-scrollbar pr-1">
                <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/70 border-b border-[#2a2a2a] pb-2 mb-3">
                    <FolderKanban className="h-3.5 w-3.5 text-emerald-400" />
                    {t("ins.chat.activeProject")}
                  </h4>
                  <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-2.5 text-xs text-[#fdfbf7]/70">
                    {activeProject ? activeProject.name : t("ins.chat.globalWorkspace")}
                  </div>
                </div>

                <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/70">
                      {t("ins.chat.knowledgeBase")}
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-[#1a1a1a] border border-[#333] px-2 py-0.5 rounded-sm">
                      {activeFiles.some((file) => file.active) ? t("ins.chat.modeRag") : t("ins.chat.modeGeneral")}
                    </span>
                  </div>

                  <p className="text-[9px] text-[#fdfbf7]/50 uppercase tracking-widest font-bold mb-3">
                    {t("ins.chat.groundPrompt")}
                  </p>

                  <div className="space-y-2">
                    {isLoadingFiles && (
                      <div className="flex items-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-xs text-[#fdfbf7]/45">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-orange-400" />
                        {t("ins.chat.loadingShort")}
                      </div>
                    )}

                    {!isLoadingFiles && filesError && (
                      <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-[10px] leading-relaxed text-red-200/80">
                        {filesError}
                      </div>
                    )}

                    {!isLoadingFiles && !filesError && activeFiles.length === 0 && (
                      <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-[11px] leading-relaxed text-[#fdfbf7]/45">
                        {t("ins.chat.noDocsShort")}
                      </div>
                    )}

                    {!isLoadingFiles && activeFiles.map(file => (
                      <button
                        key={file.id}
                        onClick={() => toggleFile(file.id)}
                        className={`w-full flex items-center justify-between gap-3 p-3 rounded-sm border transition-colors ${
                          file.active
                            ? "bg-orange-500/10 border-orange-500/30"
                            : "bg-[#0c0b0a] border-[#333]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`shrink-0 flex h-5 w-5 rounded-sm items-center justify-center border ${
                            file.active ? "bg-orange-500 border-orange-500 text-white" : "bg-[#1a1a1a] border-[#444] text-transparent"
                          }`}>
                            <Check className="h-3 w-3" />
                          </div>
                          <span className={`text-[11px] truncate text-left ${file.active ? "text-[#fdfbf7]" : "text-[#fdfbf7]/50"}`}>
                            {file.filename}
                          </span>
                        </div>
                        {file.active ? (
                          <ToggleRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                        ) : (
                          <ToggleLeft className="h-3.5 w-3.5 shrink-0 text-[#fdfbf7]/30" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2a2a]">
                    <p className="text-[9px] text-[#fdfbf7]/40 leading-relaxed">
                      {t("ins.chat.activeContextLabel")} <strong className="text-[#fdfbf7]/70">{t("ins.chat.docsShort", { count: activeContextCount })}</strong>
                      <br />
                      {t("ins.chat.chunksLabel")} <strong className="text-[#fdfbf7]/70">{availableChunksCount}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;

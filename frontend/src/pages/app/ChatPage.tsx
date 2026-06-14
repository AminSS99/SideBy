import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, LoaderCircle, Sparkles, Database, FolderKanban, Check, ToggleRight, ToggleLeft } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProjects();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm the SideBy Research Engine. I'm connected and ready to help you analyze products, architectures, or development tools.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeFiles, setActiveFiles] = useState<ActiveKnowledgeFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
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
      setFilesError(error instanceof Error ? error.message : "Unable to load knowledge files.");
      setActiveFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [activeProject, activeWorkspace]);

  useEffect(() => {
    void loadKnowledgeFiles();
  }, [loadKnowledgeFiles]);

  const toggleFile = (id: string) => {
    setActiveFiles(files => 
      files.map(f => f.id === id ? { ...f, active: !f.active } : f)
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

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

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const selectedDocumentIds = activeFiles
        .filter((file) => file.active)
        .map((file) => file.id);

      const res = await apiFetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          messages: apiMessages,
          workspaceId: activeWorkspace?.id,
          projectId: activeProject?.id ?? null,
          documentIds: selectedDocumentIds,
          stream: true,
        }),
      });

      if (!res.body) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: data.answer || "Sorry, I couldn't generate a response." }
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
        };

        if (event === "token" && payload.token) {
          streamedContent += payload.token;
          applyAssistantContent(payload.token, true);
          setIsLoading(false);
        }
        if (event === "final" && payload.answer && streamedContent.trim().length === 0) {
          applyAssistantContent(payload.answer);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
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

      if (buffer.trim()) {
        try {
          handleSseBlock(buffer);
        } catch {
          // Ignore trailing malformed stream chunks.
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  "I encountered an error connecting to the orchestrator. Please check your API keys or try again later.",
              }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col space-y-6">
      <div className="chat-header">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
          Research Assistant
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          AI Chat
        </h1>
        <p className="mt-3 text-sm text-[#fdfbf7]/55 leading-relaxed max-w-3xl">
          Ask questions, synthesize findings, or deep dive into specific product details. You can ground the AI by selecting files from your knowledge base.
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
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="flex items-center rounded-sm bg-[#0c0b0a] border border-[#333] px-5 py-3">
                  <LoaderCircle className="h-4 w-4 animate-spin text-orange-400" />
                  <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Synthesizing context...</span>
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
                    handleSend();
                  }
                }}
                placeholder="Ask anything..."
                className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-[#fdfbf7] placeholder:text-[#fdfbf7]/30 outline-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-[#fdfbf7] text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 disabled:hover:bg-white"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-3 text-center hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                AI responses can be inaccurate. Verify important facts.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - RAG Context Panel */}
        <aside className="hidden lg:flex flex-col space-y-4 h-full overflow-y-auto no-scrollbar">
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5">
            <h3 className="flex items-center gap-2 font-serif text-lg text-[#fdfbf7] border-b border-[#2a2a2a] pb-3 mb-4">
              <FolderKanban className="h-4 w-4 text-emerald-400" />
              Active Project
            </h3>
            <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-sm text-[#fdfbf7]/70">
              {activeProject ? activeProject.name : "Global Workspace (No Project)"}
            </div>
            <p className="mt-2 text-[9px] uppercase tracking-widest font-bold text-[#fdfbf7]/40 leading-relaxed">
              Conversations are saved to the active project automatically.
            </p>
          </div>

          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3 mb-4">
              <h3 className="flex items-center gap-2 font-serif text-lg text-[#fdfbf7]">
                <Database className="h-4 w-4 text-orange-400" />
                Knowledge Base
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-[#1a1a1a] border border-[#333] px-2 py-0.5 rounded-sm">
                {activeFiles.some((file) => file.active) ? "RAG Active" : "General"}
              </span>
            </div>
            
            <p className="text-[10px] text-[#fdfbf7]/50 uppercase tracking-widest font-bold mb-4">
              Ground AI in indexed files:
            </p>

            <div className="space-y-2 flex-1">
              {isLoadingFiles && (
                <div className="flex items-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-xs text-[#fdfbf7]/45">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-orange-400" />
                  Loading documents...
                </div>
              )}

              {!isLoadingFiles && filesError && (
                <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-xs leading-relaxed text-red-200/80">
                  {filesError}
                </div>
              )}

              {!isLoadingFiles && !filesError && activeFiles.length === 0 && (
                <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-3 text-xs leading-relaxed text-[#fdfbf7]/45">
                  No indexed documents in this scope.
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
                Active context: <strong className="text-[#fdfbf7]/70">{activeFiles.filter((file) => file.active).length} documents</strong>
                <br />
                Available chunks: <strong className="text-[#fdfbf7]/70">{activeFiles.reduce((sum, file) => sum + (file.active ? file.chunkCount : 0), 0)}</strong>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ChatPage;

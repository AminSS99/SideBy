import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch, ApiError } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { toast } from "sonner";
import type { FollowUpEvidence } from "./types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  confidence?: number;
  type?: "grounded" | "inference" | "insufficient";
  evidence?: FollowUpEvidence[];
}

const suggestedQuestions = [
  "Which option is more cost-effective for an early-stage startup?",
  "How do their security and compliance features compare?",
  "What are the main differences in developer experience (DX)?",
];

interface FollowUpPanelProps {
  comparisonId: string;
}

export const FollowUpPanel = ({ comparisonId }: FollowUpPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".fu-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".fu-suggestion", { y: 20, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }, "-=0.6")
      .from(".fu-input", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleAsk = async (question: string) => {
    if (!question.trim() || isTyping) return;
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/actions`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "follow-up", question }),
      });

      const data = await res.json() as {
        answer: string;
        citations?: string[];
        confidence?: number;
        type?: "grounded" | "inference" | "insufficient";
        evidence?: FollowUpEvidence[];
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        confidence: data.confidence,
        type: data.type,
        evidence: data.evidence,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Unable to get an answer. Please try again.";
      setError(msg);
      toast.error("Follow-up failed", { description: msg });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleAsk(input);
  };

  return (
    <div ref={containerRef} className="mt-12 rounded-sm border border-[#2a2a2a] bg-[#111] p-6 sm:p-8">
      <div className="fu-header mb-8 flex items-center justify-between border-b border-[#2a2a2a] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
              AI Deep Dive
            </p>
          </div>
          <h3 className="mt-2 font-serif text-2xl text-[#fdfbf7]">
            Ask a follow-up question
          </h3>
          <p className="mt-2 text-sm text-[#fdfbf7]/50">
            Need more context? Ask the orchestration engine to analyze specific aspects of this comparison.
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="mb-8 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            Suggested Queries
          </p>
          <div className="flex flex-wrap gap-3">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => void handleAsk(q)}
                className="fu-suggestion flex items-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-2 text-sm text-[#fdfbf7]/70 transition-all hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400"
              >
                {q}
                <ArrowRight className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 max-h-[400px] space-y-6 overflow-y-auto pr-2 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border ${
                  msg.role === "assistant"
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    : "bg-[#222] text-[#fdfbf7]/80 border-[#444]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-sm p-4 border ${
                  msg.role === "assistant"
                    ? "bg-[#0c0b0a] border-[#333] text-[#fdfbf7]/90"
                    : "bg-[#1a1a1a] border-[#444] text-[#fdfbf7]"
                }`}
              >
                <p className="text-sm leading-relaxed font-serif">{msg.content}</p>
                {msg.role === "assistant" && msg.type && (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        msg.type === "grounded"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : msg.type === "inference"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-red-500/20 bg-red-500/10 text-red-400"
                      }`}>
                        {msg.type === "grounded" ? "Source-backed" : msg.type === "inference" ? "Inference" : "Insufficient data"}
                      </span>
                      {typeof msg.confidence === "number" && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                          {Math.round(msg.confidence * 100)}% confidence
                        </span>
                      )}
                      {msg.citations && msg.citations.length > 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                          Citations: {msg.citations.join(", ")}
                        </span>
                      )}
                    </div>

                    {msg.evidence && msg.evidence.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-[#2a2a2a] pt-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400/70">
                          Highlighted evidence
                        </p>
                        {msg.evidence.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-sm border border-orange-500/20 bg-orange-500/10 p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-orange-300">
                                {item.label}
                              </p>
                              <span className="shrink-0 font-mono text-[10px] text-[#fdfbf7]/40">
                                {Math.round(item.confidence * 100)}%
                              </span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-[#fdfbf7]/70">
                              {item.value}
                            </p>
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex text-[10px] uppercase tracking-widest text-orange-300/70 hover:text-orange-300"
                              >
                                {item.sourceTitle || item.sourceUrl}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Sparkles className="h-3 w-3 animate-pulse" />
              </div>
              <div className="flex items-center rounded-sm bg-[#0c0b0a] border border-[#333] px-4 py-3">
                <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Synthesizing...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] rounded-sm p-4 border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
                {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="fu-input relative">
        <div className="flex items-end gap-3 rounded-sm border border-[#333] bg-[#0c0b0a] p-2 transition-colors focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleAsk(input);
              }
            }}
            placeholder="Ask about this comparison..."
            className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-[#fdfbf7] placeholder:text-[#fdfbf7]/30 outline-none font-serif"
            rows={1}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-[#fdfbf7] text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 disabled:hover:bg-white"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
          AI responses are grounded in comparison facts. Cross-reference with official documentation.
        </p>
      </form>
    </div>
  );
};

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, LoaderCircle, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm the SideBy Research Engine. I'm connected and ready to help you analyze products, architectures, or development tools.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".chat-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".chat-window", { y: 40, opacity: 0, duration: 1, ease: "expo.out" }, "-=0.6");
  }, { scope: containerRef });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Map out previous messages to send to API for context
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiFetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "Sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I encountered an error connecting to the orchestrator. Please check your API keys or try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-12rem)] flex-col space-y-6">
      <div className="chat-header">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
          Research Assistant
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          AI Chat
        </h1>
        <p className="mt-3 text-sm text-[#fdfbf7]/55 leading-relaxed">
          Ask questions, synthesize findings, or deep dive into specific product details with the orchestration engine.
        </p>
      </div>

      <div className="chat-window flex min-h-0 flex-1 flex-col rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden shadow-2xl">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border ${
                  msg.role === "assistant"
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    : "bg-[#222] text-[#fdfbf7]/80 border-[#444]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              
              <div
                className={`max-w-[80%] rounded-sm p-5 border whitespace-pre-wrap ${
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
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="flex items-center rounded-sm bg-[#0c0b0a] border border-[#333] px-5 py-3">
                <LoaderCircle className="h-4 w-4 animate-spin text-orange-400" />
                <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#2a2a2a] bg-[#0c0b0a] p-5">
          <form
            onSubmit={handleSend}
            className="relative mx-auto max-w-4xl flex items-end gap-3 rounded-sm border border-[#333] bg-[#111] p-2 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all"
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
              placeholder="Ask anything about the products you're researching..."
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
          <div className="mt-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
              AI responses can be inaccurate. Verify important facts using the comparison sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, LoaderCircle, Sparkles } from "lucide-react";

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
      content: "Hello! I'm the SideBy Research Engine. How can I help you analyze or compare products today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm a simulated response for now. In the full implementation, I'll connect to the orchestrator to answer your questions about "${userMessage.content}".`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
          Research Assistant
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          AI Chat
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Ask questions, synthesize findings, or deep dive into specific product details.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/10 bg-black/30 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  msg.role === "assistant"
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              
              <div
                className={`max-w-[80%] rounded-2xl p-5 ${
                  msg.role === "assistant"
                    ? "bg-white/[0.03] border border-white/5 text-white/80"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-50"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="flex items-center rounded-2xl bg-white/[0.03] border border-white/5 px-5 py-3">
                <LoaderCircle className="h-4 w-4 animate-spin text-orange-400" />
                <span className="ml-3 text-xs uppercase tracking-widest text-white/40">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-white/[0.02] p-4">
          <form
            onSubmit={handleSend}
            className="relative mx-auto max-w-4xl flex items-end gap-3 rounded-2xl border border-white/10 bg-black/50 p-2 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all"
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
              className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 disabled:hover:bg-white"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30">
              AI responses can be inaccurate. Verify important facts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
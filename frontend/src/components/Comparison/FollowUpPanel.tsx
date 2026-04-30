import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { panelClass } from "./constants";

gsap.registerPlugin(ScrollTrigger);

interface FollowUpPanelProps {
  question: string;
  answer: string;
  onQuestionChange: (v: string) => void;
  onAsk: () => void;
}

export const FollowUpPanel = ({
  question,
  answer,
  onQuestionChange,
  onAsk,
}: FollowUpPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.from(containerRef.current.children, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 95%",
      },
      y: 20,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out",
    });
  }, { scope: containerRef });

  // Animate the answer box when it appears
  useEffect(() => {
    if (answer && answerRef.current) {
      gsap.fromTo(
        answerRef.current,
        { height: 0, opacity: 0, scale: 0.95 },
        { height: "auto", opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" }
      );
    }
  }, [answer]);

  return (
    <div ref={containerRef} className={`${panelClass} p-8 overflow-hidden`}>
      <h3 className="mb-5 font-serif text-2xl text-[#fdfbf7] tracking-tight">Ask Follow-up</h3>
      <textarea
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onAsk();
          }
        }}
        placeholder="Ask about pricing, migration risk, team fit..."
        className="mb-4 min-h-[120px] w-full resize-none rounded-sm border border-[#333] bg-[#080808] p-4 text-sm text-[#fdfbf7] placeholder:text-[#fdfbf7]/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
      />
      <button
        onClick={onAsk}
        className="w-full rounded-sm bg-[#fdfbf7] px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#e0e0e0] active:scale-[0.98]"
      >
        Submit Inquiry
      </button>
      
      {answer && (
        <div ref={answerRef} className="mt-6 origin-top border-l-2 border-orange-500 bg-[#15110d] p-5">
          <p className="text-sm leading-relaxed text-[#fdfbf7]/90 font-serif">{answer}</p>
          <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-orange-500/60">
            Grounded in current matrix
          </div>
        </div>
      )}
    </div>
  );
};
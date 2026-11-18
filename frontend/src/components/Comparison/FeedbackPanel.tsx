import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from "@/components/icons";
import { panelClass } from './constants';
import { useT } from "@/i18n";

export const FeedbackPanel = () => {
  const t = useT();
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = () => {
    setSubmitted(true);
    // Real implementation would fire an API call here
  };

  return (
    <div className={`${panelClass} p-6 bg-[#111] overflow-hidden relative`}>
      {submitted ? (
        <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 py-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
          <h4 className="text-sm font-serif text-[#fdfbf7]">{t("res.feedback.thanks")}</h4>
          <p className="text-[10px] text-[#fdfbf7]/50 mt-1">{t("res.feedback.helps")}</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <p className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60 text-center mb-4">
            {t("res.feedback.question")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={handleFeedback}
              className="flex items-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-2 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors text-[#fdfbf7]/60"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{t("res.feedback.yes")}</span>
            </button>
            <button 
              onClick={handleFeedback}
              className="flex items-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-2 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors text-[#fdfbf7]/60"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{t("res.feedback.no")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;
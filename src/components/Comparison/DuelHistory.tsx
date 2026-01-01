import React from "react";
import { History, X } from "lucide-react";

interface HistoryItem {
  id: string;
  nameA: string;
  nameB: string;
  category: string;
  timestamp: string;
}

const DuelHistory = ({ history, onClear }: { history: HistoryItem[], onClear: () => void }) => {
  if (history.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-40 hidden xl:block">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl w-64 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">History</span>
          </div>
          <button onClick={onClear} className="text-white/20 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {history.map((item) => (
            <div key={item.id} className="p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer mb-1 border border-transparent hover:border-white/5 group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-blue-400 uppercase">{item.category}</span>
                <span className="text-[8px] font-bold text-white/20">{item.timestamp}</span>
              </div>
              <div className="text-xs font-black italic tracking-tight flex items-center gap-1">
                <span className="truncate max-w-[80px]">{item.nameA}</span>
                <span className="text-white/20">vs</span>
                <span className="truncate max-w-[80px]">{item.nameB}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DuelHistory;
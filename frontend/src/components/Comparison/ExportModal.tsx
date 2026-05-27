import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Code, FileJson, X, CheckCircle2 } from "lucide-react";
import type { ComparisonData } from "./types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ComparisonData;
}

interface ExportOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  isDownloading: boolean;
}

export const ExportModal = ({ isOpen, onClose, result }: ExportModalProps) => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const filenameSlug = result.slug || "sideby-comparison";

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    setDownloading("json");
    setTimeout(() => {
      downloadFile(
        JSON.stringify(result, null, 2),
        `${filenameSlug}.json`,
        "application/json"
      );
      setDownloading(null);
    }, 600);
  };

  const handleExportMarkdown = () => {
    setDownloading("markdown");
    setTimeout(() => {
      let md = `# ${result.entities.a.name} vs ${result.entities.b.name}\n\n`;
      md += `> ${result.verdict.summary}\n\n`;
      
      md += `## Verdicts\n`;
      md += `- **Best Overall**: ${result.verdict.bestOverall}\n`;
      md += `- **Best Value**: ${result.verdict.bestValue}\n`;
      md += `- **For Developers**: ${result.verdict.developers}\n`;
      md += `- **For Teams**: ${result.verdict.teams}\n\n`;

      md += `## Feature Matrix\n\n`;
      md += `| Criteria | ${result.entities.a.name} | ${result.entities.b.name} |\n`;
      md += `|---|---|---|\n`;
      
      result.categories.forEach(cat => {
        const labels = Array.from(new Set(cat.facts.map(f => f.label)));

        const factsByLabelEntity = new Map<string, string>();
        for (const f of cat.facts) {
          factsByLabelEntity.set(`${f.label}:${f.entity}`, f.value);
        }

        labels.forEach(label => {
          const fa = factsByLabelEntity.get(`${label}:a`) || "N/A";
          const fb = factsByLabelEntity.get(`${label}:b`) || "N/A";
          md += `| **${label}** | ${fa.replace(/\n/g, " ")} | ${fb.replace(/\n/g, " ")} |\n`;
        });
      });

      downloadFile(md, `${filenameSlug}.md`, "text/markdown");
      setDownloading(null);
    }, 600);
  };

  const handleExportPDF = () => {
    setDownloading("pdf");
    setTimeout(() => {
      window.print();
      setDownloading(null);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 print-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-white">Export Report</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
                  {result.entities.a.name} vs {result.entities.b.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <ExportOption 
                icon={FileText}
                title="PDF Document"
                description="Optimized print layout for reading."
                onClick={handleExportPDF}
                isDownloading={downloading === "pdf"}
              />
              <ExportOption 
                icon={Code}
                title="Markdown"
                description="Perfect for Notion or GitHub wikis."
                onClick={handleExportMarkdown}
                isDownloading={downloading === "markdown"}
                badge="Pro"
              />
              <ExportOption 
                icon={FileJson}
                title="Raw JSON"
                description="Raw data for API integrations."
                onClick={handleExportJSON}
                isDownloading={downloading === "json"}
                badge="Pro"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ExportOption = ({ icon: Icon, title, description, badge, onClick, isDownloading }: ExportOptionProps) => (
  <button
    onClick={onClick}
    disabled={isDownloading}
    className="w-full group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-orange-500/30 hover:bg-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#111] text-white/60 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
        {isDownloading ? <Download className="h-4 w-4 animate-bounce" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm text-white group-hover:text-orange-400 transition-colors">{title}</span>
          {badge && (
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-orange-400">
              {badge}
            </span>
          )}
        </div>
        <span className="text-xs text-white/40">{description}</span>
      </div>
    </div>
    {isDownloading ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : (
      <Download className="h-4 w-4 text-white/20 group-hover:text-orange-400 transition-colors" />
    )}
  </button>
);

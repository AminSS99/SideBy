import React, { useState, useCallback, useRef } from "react";
import { UploadCloud, Trash2, CheckCircle2, Loader2, Database, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { EmptyState } from "@/components/EmptyState";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "indexed" | "error";
  progress: number;
  date: string;
}

const UploadsPage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "demo-1",
      name: "Q3_Competitor_Analysis.pdf",
      size: 2450000,
      status: "indexed",
      progress: 100,
      date: new Date().toISOString(),
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".up-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".up-dropzone", { scale: 0.95, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".up-list", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 5;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress, status: "indexed" } : f));
      } else {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress } : f));
      }
    }, 400);
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    Array.from(newFiles).forEach(file => {
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        status: "uploading",
        progress: 0,
        date: new Date().toISOString(),
      };
      setFiles(prev => [newFile, ...prev]);
      simulateUpload(newFile.id);
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="up-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Workspace Context
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            Knowledge Base
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-[#fdfbf7]/60 leading-relaxed">
            Upload PDFs, documents, or data sheets. SideBy will index them to ground your AI comparisons and research in your own private data.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`up-dropzone relative flex flex-col items-center justify-center rounded-sm border-2 border-dashed p-14 text-center transition-all ${
          isDragging ? "border-emerald-500 bg-emerald-500/10" : "border-[#333] bg-[#0c0b0a] hover:border-[#555] hover:bg-[#111]"
        }`}
      >
        <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-sm border transition-colors ${isDragging ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-[#1a1a1a] text-[#fdfbf7]/40 border-[#333]"}`}>
          <UploadCloud className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-2xl text-[#fdfbf7]">Drag & drop files here</h3>
        <p className="mt-2 text-sm text-[#fdfbf7]/40">Support for PDF, DOCX, CSV, and TXT up to 50MB</p>
        <div className="mt-8 flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/20">OR</span>
        </div>
        <label className="mt-8 cursor-pointer rounded-sm bg-[#fdfbf7] px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]">
          Browse Files
          <input 
            type="file" 
            multiple 
            className="hidden" 
            onChange={(e) => e.target.files && handleFiles(e.target.files)} 
            accept=".pdf,.doc,.docx,.txt,.csv"
          />
        </label>
      </div>

      {/* Files List */}
      <div className="up-list rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <div className="mb-8 flex items-center gap-3 border-b border-[#2a2a2a] pb-6">
          <Database className="h-5 w-5 text-orange-500" />
          <h2 className="font-serif text-2xl text-[#fdfbf7]">Indexed Documents</h2>
        </div>

        {files.length === 0 ? (
          <EmptyState 
            icon={Database}
            title="No documents yet"
            description="Your workspace knowledge base is empty. Upload documents above to start indexing them."
            glowColor="blue"
          />
        ) : (
          <div className="space-y-4">
            {files.map(file => (
              <div key={file.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-5 transition-colors hover:border-[#444] hover:bg-[#1a1a1a]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border ${
                    file.status === "indexed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    file.status === "error" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {file.status === "indexed" ? <CheckCircle2 className="h-5 w-5" /> :
                     file.status === "error" ? <AlertCircle className="h-5 w-5" /> :
                     <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-serif text-[#fdfbf7]">{file.name}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                      <span>{formatSize(file.size)}</span>
                      <span className="h-1 w-1 rounded-full bg-[#444]" />
                      <span>{new Date(file.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
                  {file.status === "uploading" && (
                    <div className="flex items-center gap-3 w-full sm:w-40">
                      <div className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${file.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-[#fdfbf7]/50">{file.progress}%</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-sm border border-transparent text-[#fdfbf7]/30 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Remove document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadsPage;
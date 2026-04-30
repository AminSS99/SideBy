import React, { useState, useCallback } from "react";
import { UploadCloud, FileText, Trash2, CheckCircle2, Loader2, Database, AlertCircle } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
            Workspace Context
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
            Knowledge Base
          </h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Upload PDFs, documents, or data sheets. SideBy will index them to ground your AI comparisons and research in your own private data.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-12 text-center transition-all ${
          isDragging ? "border-emerald-400 bg-emerald-400/5" : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.02]"
        }`}
      >
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${isDragging ? "bg-emerald-400/20 text-emerald-300" : "bg-white/5 text-white/40"}`}>
          <UploadCloud className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Drag & drop files here</h3>
        <p className="mt-2 text-sm text-white/40">Support for PDF, DOCX, CSV, and TXT up to 50MB</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-white/20">OR</span>
        </div>
        <label className="mt-6 cursor-pointer rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e0e0e0]">
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
      <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
        <div className="mb-6 flex items-center gap-3">
          <Database className="h-5 w-5 text-white/50" />
          <h2 className="text-xl font-bold text-white">Indexed Documents</h2>
        </div>

        {files.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/30">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {files.map(file => (
              <div key={file.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.04]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    file.status === "indexed" ? "bg-emerald-500/10 text-emerald-400" :
                    file.status === "error" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {file.status === "indexed" ? <CheckCircle2 className="h-5 w-5" /> :
                     file.status === "error" ? <AlertCircle className="h-5 w-5" /> :
                     <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                      <span>{formatSize(file.size)}</span>
                      <span>•</span>
                      <span>{new Date(file.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  {file.status === "uploading" && (
                    <div className="flex items-center gap-3 w-full sm:w-32">
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${file.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-white/50">{file.progress}%</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
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
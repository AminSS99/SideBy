import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  Trash2,
  CheckCircle2,
  Loader2,
  Database,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { buildApiUrl } from "@/config/env";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiFetch, getClerkToken } from "@/lib/api";

type KnowledgeDocumentStatus = "uploading" | "indexing" | "indexed" | "error" | "deleted";

interface KnowledgeDocument {
  id: string;
  workspaceId: string;
  projectId: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: KnowledgeDocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  isLocal?: boolean;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".csv"];

const UploadsPage = () => {
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProjects();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".up-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".up-dropzone", { scale: 0.95, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".up-list", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  const loadDocuments = useCallback(async () => {
    if (!activeWorkspace) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams({ workspaceId: activeWorkspace.id });
      if (activeProject) params.set("projectId", activeProject.id);

      const res = await apiFetch(buildApiUrl(`/api/knowledge/documents?${params.toString()}`));
      const data = (await res.json()) as { documents: KnowledgeDocument[] };
      setDocuments(data.documents);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load documents.");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, activeWorkspace]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!activeWorkspace) {
      toast.error("Select a workspace before uploading documents.");
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      toast.error(`${file.name} is not supported. Upload PDF, TXT, or CSV files.`);
      return;
    }

    const localId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `upload-${Date.now()}`;

    const localDocument: KnowledgeDocument = {
      id: localId,
      workspaceId: activeWorkspace.id,
      projectId: activeProject?.id ?? null,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      status: "uploading",
      errorMessage: null,
      chunkCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      isLocal: true,
    };

    setDocuments((current) => [localDocument, ...current]);

    try {
      const uploadedDocument = await uploadWithProgress(file, {
        workspaceId: activeWorkspace.id,
        projectId: activeProject?.id ?? null,
        onProgress: (progress) => {
          setDocuments((current) =>
            current.map((document) =>
              document.id === localId
                ? { ...document, progress, status: progress >= 95 ? "indexing" : "uploading" }
                : document,
            ),
          );
        },
      });

      setDocuments((current) =>
        current.map((document) =>
          document.id === localId ? { ...uploadedDocument, progress: 100 } : document,
        ),
      );

      if (uploadedDocument.status === "error") {
        toast.error(uploadedDocument.errorMessage || "Document indexing failed.");
      } else {
        toast.success(`${uploadedDocument.filename} indexed.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setDocuments((current) =>
        current.map((document) =>
          document.id === localId
            ? { ...document, status: "error", errorMessage: message, progress: 100 }
            : document,
        ),
      );
      toast.error(message);
    }
  }, [activeProject, activeWorkspace]);

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    for (const file of Array.from(newFiles)) {
      await uploadFile(file);
    }
  }, [uploadFile]);

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
      void handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const deleteDocument = async (id: string) => {
    const document = documents.find((item) => item.id === id);
    if (document?.isLocal) {
      setDocuments((current) => current.filter((item) => item.id !== id));
      return;
    }

    setDeletingId(id);
    try {
      await apiFetch(buildApiUrl(`/api/knowledge/documents/${id}`), {
        method: "DELETE",
      });
      setDocuments((current) => current.filter((document) => document.id !== id));
      toast.success("Document removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete document.");
    } finally {
      setDeletingId(null);
    }
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
            {activeProject
              ? `Indexing documents for ${activeProject.name}.`
              : "Indexing documents across the active workspace."}
          </p>
        </div>
        <button
          onClick={() => void loadDocuments()}
          className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#333] bg-[#111] px-4 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 transition-colors hover:border-[#555] hover:text-[#fdfbf7]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

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
        <h3 className="font-serif text-2xl text-[#fdfbf7]">Upload knowledge files</h3>
        <p className="mt-2 text-sm text-[#fdfbf7]/40">PDF, TXT, and CSV up to 50MB</p>
        <label className="mt-8 cursor-pointer rounded-sm bg-[#fdfbf7] px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0]">
          Browse Files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
            accept=".pdf,.txt,.csv,text/plain,text/csv,application/pdf"
          />
        </label>
      </div>

      <div className="up-list rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-[#2a2a2a] pb-6">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-orange-500" />
            <h2 className="font-serif text-2xl text-[#fdfbf7]">Indexed Documents</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/35">
            {documents.length} total
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-14 text-sm text-[#fdfbf7]/50">
            <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No documents yet"
            description="Upload a PDF, TXT, or CSV file to create searchable workspace context."
            glowColor="blue"
          />
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                isDeleting={deletingId === document.id}
                formatSize={formatSize}
                onDelete={() => void deleteDocument(document.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DocumentRowProps {
  document: KnowledgeDocument;
  isDeleting: boolean;
  formatSize: (bytes: number) => string;
  onDelete: () => void;
}

const DocumentRow = ({ document, isDeleting, formatSize, onDelete }: DocumentRowProps) => {
  const status = getStatusMeta(document.status);

  return (
    <div className="group relative flex flex-col gap-4 rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-5 transition-colors hover:border-[#444] hover:bg-[#1a1a1a] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border ${status.className}`}>
          {status.icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-serif text-[#fdfbf7]">{document.filename}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
            <span>{formatSize(document.sizeBytes)}</span>
            <span className="h-1 w-1 rounded-full bg-[#444]" />
            <span>{new Date(document.createdAt).toLocaleDateString()}</span>
            <span className="h-1 w-1 rounded-full bg-[#444]" />
            <span>{status.label}</span>
            {document.status === "indexed" && (
              <>
                <span className="h-1 w-1 rounded-full bg-[#444]" />
                <span>{document.chunkCount} chunks</span>
              </>
            )}
          </div>
          {document.errorMessage && (
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-red-300/80">
              {document.errorMessage}
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-5 sm:w-auto sm:justify-end">
        {(document.status === "uploading" || document.status === "indexing") && (
          <div className="flex w-full items-center gap-3 sm:w-40">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#222]">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${document.progress ?? 96}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-[#fdfbf7]/50">
              {document.status === "indexing" ? "Indexing" : `${document.progress ?? 0}%`}
            </span>
          </div>
        )}

        <button
          onClick={onDelete}
          disabled={document.status === "uploading" || isDeleting}
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-transparent text-[#fdfbf7]/30 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete document"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

function getStatusMeta(status: KnowledgeDocumentStatus) {
  if (status === "indexed") {
    return {
      label: "Indexed",
      icon: <CheckCircle2 className="h-5 w-5" />,
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }

  if (status === "error") {
    return {
      label: "Error",
      icon: <AlertCircle className="h-5 w-5" />,
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    };
  }

  if (status === "uploading") {
    return {
      label: "Uploading",
      icon: <UploadCloud className="h-5 w-5" />,
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
  }

  return {
    label: "Indexing",
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
}

function uploadWithProgress(
  file: File,
  params: {
    workspaceId: string;
    projectId: string | null;
    onProgress: (progress: number) => void;
  },
) {
  return new Promise<KnowledgeDocument>((resolve, reject) => {
    const formData = new FormData();
    formData.append("workspaceId", params.workspaceId);
    if (params.projectId) formData.append("projectId", params.projectId);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildApiUrl("/api/knowledge/upload"));
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      params.onProgress(Math.min(95, Math.round((event.loaded / event.total) * 95)));
    };

    xhr.onload = () => {
      let payload: { document?: KnowledgeDocument; error?: string } = {};
      try {
        payload = JSON.parse(xhr.responseText || "{}") as typeof payload;
      } catch {
        payload = {};
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload.document) {
        resolve(payload.document);
        return;
      }

      reject(new Error(payload.error || `Upload failed with status ${xhr.status}.`));
    };

    xhr.onerror = () => reject(new Error("Network error while uploading document."));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));
    getClerkToken()
      .then((token) => {
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        xhr.send(formData);
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error("Unable to authenticate upload."));
      });
  });
}

export default UploadsPage;

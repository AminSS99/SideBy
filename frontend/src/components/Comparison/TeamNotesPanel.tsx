import { useEffect, useState } from "react";
import { MessageSquarePlus, Scale, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { panelClass } from "./constants";

type Note = {
  id: string;
  body: string;
  kind: "comment" | "decision";
  userId: string;
  authorName: string | null;
  createdAt: string;
};

export const TeamNotesPanel = ({ comparisonId }: { comparisonId: string }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Note["kind"]>("comment");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/notes`))
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load notes.");
        const data = await res.json() as { notes: Note[] };
        if (active) setNotes(data.notes);
      })
      .catch(() => { if (active) setNotes([]); });
    return () => { active = false; };
  }, [comparisonId]);

  const save = async () => {
    if (!body.trim()) return;
    try {
      setIsSaving(true);
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/notes`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), kind }),
      });
      if (!res.ok) throw new Error("Unable to save note.");
      const data = await res.json() as { note: Note };
      setNotes((current) => [...current, data.note]);
      setBody("");
      toast.success(kind === "decision" ? "Decision note saved." : "Comment added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save note.");
    } finally { setIsSaving(false); }
  };

  const remove = async (noteId: string) => {
    try {
      const res = await apiFetch(buildApiUrl(`/api/comparisons/${comparisonId}/notes?noteId=${noteId}`), { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to remove note.");
      setNotes((current) => current.filter((note) => note.id !== noteId));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove note."); }
  };

  return <section className={panelClass} aria-label="Team comments and decision notes">
    <div className="border-b border-[#2a2a2a] p-6">
      <div className="flex items-center gap-3">
        <MessageSquarePlus className="h-5 w-5 text-orange-400" />
        <div><h3 className="font-serif text-xl text-white">Team notes</h3><p className="mt-1 text-xs text-white/50">Capture comments and the reasoning behind a decision.</p></div>
      </div>
    </div>
    <div className="space-y-3 p-6">
      {notes.map((note) => <article key={note.id} className={`rounded-sm border p-3 ${note.kind === "decision" ? "border-orange-500/30 bg-orange-500/5" : "border-[#2a2a2a] bg-[#0c0b0a]"}`}>
        <div className="flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
          <span className="flex items-center gap-1.5">{note.kind === "decision" && <Scale className="h-3 w-3 text-orange-400" />}{note.kind === "decision" ? "Decision" : "Comment"} · {note.authorName || "Teammate"}</span>
          <button type="button" aria-label="Remove note" onClick={() => void remove(note.id)} className="text-white/30 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">{note.body}</p>
      </article>)}
      <div className="rounded-sm border border-[#333] bg-[#0c0b0a] p-3">
        <div className="mb-2 flex gap-2">
          {(["comment", "decision"] as const).map((option) => <button key={option} type="button" onClick={() => setKind(option)} className={`rounded-sm px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${kind === option ? "bg-orange-500 text-white" : "text-white/45 hover:text-white"}`}>{option}</button>)}
        </div>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder={kind === "decision" ? "Why did the team choose this option?" : "Add a comment for your team"} className="min-h-20 w-full resize-y bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
        <button type="button" onClick={() => void save()} disabled={!body.trim() || isSaving} className="mt-2 inline-flex items-center gap-2 rounded-sm bg-orange-500 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white disabled:opacity-50"><Send className="h-3 w-3" />{isSaving ? "Saving" : "Add note"}</button>
      </div>
    </div>
  </section>;
};

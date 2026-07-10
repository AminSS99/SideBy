import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Settings,
  GitCompareArrows,
  MessageSquare,
  Microscope,
  Database,
  Clock3,
  FolderKanban,
  Layers3,
  Users,
  Terminal,
  Activity,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function CommandMenu({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="bg-[#0c0b0a]/90 backdrop-blur-2xl border border-[#333] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <CommandInput
          placeholder="Type a command or search..."
          className="h-14 border-b border-[#2a2a2a] text-[#fdfbf7] font-serif text-lg bg-transparent px-4"
        />
        <CommandList className="max-h-[400px] overflow-y-auto no-scrollbar p-2">
          <CommandEmpty className="py-10 text-center text-sm text-[#fdfbf7]/40 font-serif italic">No signals found in the matrix.</CommandEmpty>

          <CommandGroup heading="Suggestions" className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 px-2 py-3">
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/comparisons"))}
              className="text-[#fdfbf7]/80 aria-selected:bg-orange-500/10 aria-selected:text-orange-400 cursor-pointer rounded-sm mb-1 transition-colors group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500 opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <GitCompareArrows className="mr-3 h-4 w-4" />
              <span>New Comparison</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-[#2a2a2a] mx-2" />

          <CommandGroup heading="Navigation" className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 px-2 py-3">
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/comparisons"))}
              className="text-[#fdfbf7]/80 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <GitCompareArrows className="mr-3 h-4 w-4 text-orange-400 group-aria-selected:text-orange-400 transition-colors" />
              <span>Compare</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app"))}
              className="text-[#fdfbf7]/80 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Clock3 className="mr-3 h-4 w-4 text-white/50 group-aria-selected:text-white transition-colors" />
              <span>History</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/uploads"))}
              className="text-[#fdfbf7]/80 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Database className="mr-3 h-4 w-4 text-white/50 group-aria-selected:text-white transition-colors" />
              <span>Sources</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/team"))}
              className="text-[#fdfbf7]/80 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Users className="mr-3 h-4 w-4 text-white/50 group-aria-selected:text-white transition-colors" />
              <span>Team</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/settings"))}
              className="text-[#fdfbf7]/80 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Settings className="mr-3 h-4 w-4 text-white/50 group-aria-selected:text-white transition-colors" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-[#2a2a2a] mx-2" />

          <CommandGroup heading="Advanced" className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 px-2 py-3">
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/chat"))}
              className="text-[#fdfbf7]/60 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <MessageSquare className="mr-3 h-4 w-4 text-white/30 group-aria-selected:text-white transition-colors" />
              <span>AI Chat</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/research"))}
              className="text-[#fdfbf7]/60 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Microscope className="mr-3 h-4 w-4 text-white/30 group-aria-selected:text-white transition-colors" />
              <span>Research</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/prompts"))}
              className="text-[#fdfbf7]/60 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Terminal className="mr-3 h-4 w-4 text-white/30 group-aria-selected:text-white transition-colors" />
              <span>Prompt Studio</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/analytics"))}
              className="text-[#fdfbf7]/60 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Activity className="mr-3 h-4 w-4 text-white/30 group-aria-selected:text-white transition-colors" />
              <span>Analytics</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/billing"))}
              className="text-[#fdfbf7]/60 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <CreditCard className="mr-3 h-4 w-4 text-white/30 group-aria-selected:text-white transition-colors" />
              <span>Billing</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/workspaces"))}
              className="text-[#fdfbf7]/60 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <Layers3 className="mr-3 h-4 w-4 text-white/30 group-aria-selected:text-white transition-colors" />
              <span>Workspaces</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate("/app/projects"))}
              className="text-[#fdfbf7]/60 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer rounded-sm mb-1 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white opacity-0 group-aria-selected:opacity-100 transition-opacity" />
              <FolderKanban className="mr-3 h-4 w-4 text-white/30 group-aria-selected:text-white transition-colors" />
              <span>Projects</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}

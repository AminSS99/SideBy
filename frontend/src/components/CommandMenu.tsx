import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Settings,
  GitCompareArrows,
  MessageSquare,
  Microscope,
  Database,
  LayoutDashboard,
  FolderKanban,
  Layers3,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
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
      <div className="bg-[#0c0b0a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl">
        <CommandInput 
          placeholder="Type a command or search..." 
          className="h-14 border-b border-[#2a2a2a] text-[#fdfbf7]"
        />
        <CommandList className="max-h-[350px] overflow-y-auto no-scrollbar">
          <CommandEmpty className="py-6 text-center text-sm text-[#fdfbf7]/40">No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions" className="text-[#fdfbf7]/40 px-2 py-3">
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/comparisons"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm mb-1"
            >
              <GitCompareArrows className="mr-3 h-4 w-4" />
              <span>New Comparison</span>
            </CommandItem>
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/chat"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm"
            >
              <MessageSquare className="mr-3 h-4 w-4" />
              <span>Ask AI Assistant</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="bg-[#2a2a2a]" />
          <CommandGroup heading="Navigation" className="text-[#fdfbf7]/40 px-2 py-3">
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm mb-1"
            >
              <LayoutDashboard className="mr-3 h-4 w-4" />
              <span>Overview</span>
            </CommandItem>
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/research"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm mb-1"
            >
              <Microscope className="mr-3 h-4 w-4" />
              <span>Research Canvas</span>
            </CommandItem>
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/uploads"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm mb-1"
            >
              <Database className="mr-3 h-4 w-4" />
              <span>Knowledge Base</span>
            </CommandItem>
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/projects"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm mb-1"
            >
              <FolderKanban className="mr-3 h-4 w-4" />
              <span>Projects</span>
            </CommandItem>
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/workspaces"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm"
            >
              <Layers3 className="mr-3 h-4 w-4" />
              <span>Workspaces</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="bg-[#2a2a2a]" />
          <CommandGroup heading="Account & Settings" className="text-[#fdfbf7]/40 px-2 py-3">
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/billing"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm mb-1"
            >
              <CreditCard className="mr-3 h-4 w-4" />
              <span>Billing</span>
            </CommandItem>
            <CommandItem 
              onSelect={() => runCommand(() => navigate("/app/settings"))}
              className="text-[#fdfbf7] aria-selected:bg-[#1a1a1a] aria-selected:text-orange-400 cursor-pointer rounded-sm"
            >
              <Settings className="mr-3 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}
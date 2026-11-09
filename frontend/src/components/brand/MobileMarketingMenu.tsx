import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { TubelightNavItem } from "@/components/ui/tubelight-navbar";
import { cn } from "@/lib/utils";

export function MobileMarketingMenu({ items }: { items: TubelightNavItem[] }) {
  const [open, setOpen] = useState(false);
  const { pathname, search, hash } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname, search, hash]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open site navigation"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#fffaf1] transition duration-200 hover:bg-white/[0.08] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 md:hidden motion-reduce:transition-none"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[100] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-1rem)] overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0d0b0a] pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-6 text-[#fffaf1] shadow-[0_-24px_100px_rgba(0,0,0,.5)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:animate-none">
          <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
          <div className="mb-5 pr-14">
            <Dialog.Title className="font-serif text-2xl tracking-tight">Explore SideBy</Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-white/60">
              Better decisions start with a little perspective.
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button type="button" aria-label="Close site navigation" className="absolute right-4 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </Dialog.Close>
          <nav aria-label="Site navigation" className="space-y-1">
            {items.map(({ name, url, icon: Icon }) => {
              const active = pathname === url;
              return (
                <Dialog.Close key={url} asChild>
                  <Link to={url} aria-current={active ? "page" : undefined} className={cn(
                    "group flex min-h-14 items-center gap-3.5 rounded-2xl border px-4 py-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                    active ? "border-orange-300/15 bg-orange-400/[0.08] text-orange-200" : "border-transparent text-white/75 hover:border-white/[0.06] hover:bg-white/[0.04]",
                  )}>
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{name}</span>
                    {active ? <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest">Current</span> : <ArrowUpRight className="ml-auto h-4 w-4 text-white/30" aria-hidden="true" />}
                  </Link>
                </Dialog.Close>
              );
            })}
          </nav>
          <Dialog.Close asChild>
            <Link to="/app" className="mt-6 flex min-h-12 items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(249,115,22,.15)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200">
              Open workbench <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

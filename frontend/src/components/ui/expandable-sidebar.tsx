/* eslint-disable react-refresh/only-export-components -- context hook ships with the sidebar primitives. */
import { createContext, useCallback, useContext, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PanelLeft } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Expandable app rail (adapted from the Aceternity sidebar for react-router).
 *
 * - Collapsed it is a 72px icon rail; hovering with a mouse or focusing any link
 *   slides it open as an OVERLAY, so the page content never reflows.
 * - A pin button keeps it open (the host widens its grid column when pinned).
 * - Touch devices never hover-expand; they use the pin button. Phones keep the
 *   app's existing bottom navigation and drawer.
 */

export const SIDEBAR_COLLAPSED = 72;
export const SIDEBAR_EXPANDED = 248;

interface SidebarContextValue {
  expanded: boolean;
  pinned: boolean;
  setPinned: (pinned: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useExpandableSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useExpandableSidebar must be used inside <ExpandableSidebar>");
  return context;
};

interface ExpandableSidebarProps {
  pinned: boolean;
  onPinnedChange: (pinned: boolean) => void;
  className?: string;
  /** Visible label for the pin toggle and its accessible name. */
  pinLabel: string;
  unpinLabel: string;
  navLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const ExpandableSidebar = ({
  pinned,
  onPinnedChange,
  className,
  pinLabel,
  unpinLabel,
  navLabel,
  children,
  footer,
}: ExpandableSidebarProps) => {
  const reduceMotion = useReducedMotion() ?? false;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = pinned || hovered || focused;

  const setPinned = useCallback((value: boolean) => onPinnedChange(value), [onPinnedChange]);
  const value = useMemo(() => ({ expanded, pinned, setPinned }), [expanded, pinned, setPinned]);

  return (
    <SidebarContext.Provider value={value}>
      {/* Fixed-width slot keeps the grid stable; the panel inside may overlay it. */}
      <div className={cn("relative h-full", className)} style={{ width: pinned ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}>
        <motion.aside
          initial={false}
          animate={{ width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setHovered(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setHovered(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
          }}
          className={cn(
            "absolute inset-y-0 left-0 z-30 flex flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0a09]/95 p-2 backdrop-blur-xl",
            expanded && !pinned
              ? "shadow-[0_24px_80px_rgba(0,0,0,.6),0_0_0_1px_rgba(251,146,60,.08)]"
              : "shadow-[0_24px_80px_rgba(0,0,0,.35)]",
          )}
        >
          <nav aria-label={navLabel} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {children}
          </nav>

          <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2">
            <AnimatePresence initial={false}>
              {expanded && footer ? (
                <motion.div
                  key="footer"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  className="overflow-hidden px-1"
                >
                  {footer}
                </motion.div>
              ) : null}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              aria-pressed={pinned}
              aria-label={pinned ? unpinLabel : pinLabel}
              title={pinned ? unpinLabel : pinLabel}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <PanelLeft className={cn("h-4 w-4 shrink-0 transition-transform duration-300", pinned && "rotate-180")} />
              <SidebarLabel>{pinned ? unpinLabel : pinLabel}</SidebarLabel>
            </button>
          </div>
        </motion.aside>
      </div>
    </SidebarContext.Provider>
  );
};

/** Label that fades with the panel and never wraps or pushes the icon. */
export const SidebarLabel = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { expanded } = useExpandableSidebar();
  return (
    <span
      aria-hidden={!expanded}
      className={cn(
        "whitespace-nowrap transition-opacity duration-200",
        expanded ? "opacity-100 delay-75" : "pointer-events-none opacity-0",
        className,
      )}
    >
      {children}
    </span>
  );
};

export const SidebarSection = ({ label }: { label: string }) => {
  const { expanded } = useExpandableSidebar();
  return (
    <div className="relative mt-3 h-8 shrink-0" role="presentation">
      <div className={cn("absolute inset-x-3 top-1/2 h-px bg-white/10 transition-opacity duration-200", expanded ? "opacity-0" : "opacity-100")} />
      <p
        aria-hidden={!expanded}
        className={cn(
          "absolute inset-x-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-white/55 transition-opacity duration-200",
          expanded ? "opacity-100 delay-75" : "opacity-0",
        )}
      >
        {label}
      </p>
    </div>
  );
};

interface SidebarNavLinkProps {
  to: string;
  end?: boolean;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const SidebarNavLink = ({ to, end, label, icon: Icon }: SidebarNavLinkProps) => {
  const { expanded } = useExpandableSidebar();
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      title={expanded ? undefined : label}
      className={({ isActive }) =>
        cn(
          "group relative flex min-h-11 shrink-0 items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
          isActive ? "text-orange-300" : "text-white/70 hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span aria-hidden="true" className="absolute inset-0 rounded-xl border border-orange-400/15 bg-gradient-to-r from-orange-400/[0.12] to-rose-400/[0.06]" />
          )}
          <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-white/[0.05] transition-transform duration-300 ease-out group-hover:translate-x-0" />
          <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
          <SidebarLabel className="relative z-10">{label}</SidebarLabel>
        </>
      )}
    </NavLink>
  );
};

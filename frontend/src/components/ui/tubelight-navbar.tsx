import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface TubelightNavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface TubelightNavbarProps {
  items: TubelightNavItem[];
  className?: string;
}

export function TubelightNavbar({ items, className }: TubelightNavbarProps) {
  const location = useLocation();

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:bottom-auto md:top-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/75 p-1 shadow-[0_16px_50px_rgba(0,0,0,.38)] backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.url;

          return (
            <Link
              key={item.name}
              to={item.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors duration-300 hover:text-foreground md:min-w-0 md:px-4",
                isActive && "text-foreground",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
                <span className="sr-only">{item.name}</span>
              </span>

              {isActive && (
                <motion.span
                  layoutId="marketing-nav-lamp"
                  className="absolute inset-0 -z-10 rounded-full bg-muted/70"
                  initial={false}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >
                  <span className="absolute -top-1 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-t-full bg-primary">
                    <span className="absolute -left-2 -top-2 h-5 w-11 rounded-full bg-primary/15 blur-md" />
                    <span className="absolute left-1/2 top-0 h-3 w-5 -translate-x-1/2 rounded-full bg-primary/25 blur-sm" />
                  </span>
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

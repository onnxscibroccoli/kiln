import { type ReactNode } from "react";
import { LayoutGrid } from "lucide-react";
import { type AppId } from "@/lib/linux/shell";
import { cn } from "@/lib/utils";

export function XfcePanel({
  clock,
  menuOpen,
  onMenu,
  tasks,
  launchers,
  focus,
}: {
  clock: string;
  menuOpen: boolean;
  onMenu: () => void;
  tasks: { id: AppId; label: string; on: boolean; onClick: () => void }[];
  launchers: { id: AppId; label: string; icon: ReactNode; on: boolean; onClick: () => void }[];
  focus: AppId | null;
}) {
  void focus;
  return (
    <nav className="kiln-dock relative mx-auto mb-1 flex h-14 w-[min(100%-0.5rem,52rem)] items-center gap-1 rounded-lg px-1">
      <button
        type="button"
        aria-label="Applications"
        aria-expanded={menuOpen}
        onClick={onMenu}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm",
          menuOpen ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary",
        )}
      >
        <LayoutGrid className="size-4" />
        <span className="hidden sm:inline">Applications</span>
      </button>
      <div className="hidden h-6 w-px bg-border sm:block" />
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {launchers.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-label={l.label}
            onClick={l.onClick}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-md",
              l.on ? "text-sage" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.icon}
          </button>
        ))}
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={t.onClick}
            className={cn(
              "hidden h-11 max-w-36 truncate rounded-md px-3 text-xs sm:inline",
              t.on ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <time className="hidden px-3 font-mono text-xs tabular-nums sm:inline">{clock}</time>
    </nav>
  );
}

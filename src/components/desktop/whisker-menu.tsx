import { useMemo, useState } from "react";
import { type LucideIcon } from "lucide-react";
import { type AppId } from "@/lib/linux/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MenuApp = {
  id: AppId;
  label: string;
  group: string;
  icon: LucideIcon;
};

export function WhiskerMenu({
  apps,
  onOpen,
  onClose,
}: {
  apps: MenuApp[];
  onOpen: (id: AppId) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return apps;
    return apps.filter((a) => a.label.toLowerCase().includes(needle) || a.group.toLowerCase().includes(needle));
  }, [apps, q]);
  const groups = useMemo(() => {
    const map = new Map<string, MenuApp[]>();
    for (const a of filtered) {
      const list = map.get(a.group) ?? [];
      list.push(a);
      map.set(a.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-start bg-background/50 p-2 backdrop-blur-[2px] sm:p-3">
      <div
        role="menu"
        className="flex max-h-[min(32rem,calc(100%-0.5rem))] w-[min(100%,22rem)] flex-col overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]"
      >
        <div className="border-b border-border p-3">
          <p className="text-xs tracking-[0.18em] text-sage-dim uppercase">Applications</p>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="mt-2 h-11"
            autoFocus
            aria-label="Search applications"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {groups.length === 0 ? (
            <p className="px-2 py-6 text-sm text-muted-foreground">No matching apps.</p>
          ) : (
            groups.map(([group, list]) => (
              <div key={group} className="mb-2">
                <p className="px-2 py-1 text-[11px] tracking-wide text-muted-foreground uppercase">{group}</p>
                {list.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    onClick={() => onOpen(id)}
                    className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-secondary"
                  >
                    <Icon className="size-4 text-sage" />
                    {label}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border p-2">
          <Button variant="ghost" className="h-11 w-full justify-start" onClick={onClose}>
            Close menu
          </Button>
        </div>
      </div>
    </div>
  );
}

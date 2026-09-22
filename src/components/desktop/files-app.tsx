import { useMemo } from "react";
import { ChevronLeft, Home } from "lucide-react";
import { type Vfs } from "@/lib/linux/vfs";
import { FileGlyph } from "@/components/desktop/file-glyph";
import { cn } from "@/lib/utils";

export function FilesApp({
  vfs,
  home,
  cwd,
  active,
  onOpen,
  onCwd,
  rev,
}: {
  vfs: Vfs;
  home: string;
  cwd: string;
  active: string | null;
  onOpen: (path: string) => void;
  onCwd: (path: string) => void;
  rev: number;
}) {
  const path = cwd && vfs.isDir(cwd) ? cwd : home;
  const crumbs = useMemo(() => {
    const parts = path.split("/").filter(Boolean);
    const list: { label: string; abs: string }[] = [{ label: "Computer", abs: "/" }];
    let acc = "";
    for (const p of parts) {
      acc += `/${p}`;
      list.push({
        label: acc === home ? "Home" : p,
        abs: acc,
      });
    }
    void rev;
    return list;
  }, [path, home, rev]);

  const entries = useMemo(() => {
    try {
      return vfs
        .list(path)
        .slice()
        .sort((a, b) => {
          if (a.node.t !== b.node.t) return a.node.t === "d" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
    } catch {
      return [];
    }
  }, [vfs, path, rev]);

  const parent = path === "/" ? "/" : path.split("/").slice(0, -1).join("/") || "/";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-1">
        <button
          type="button"
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={() => onCwd(parent)}
          disabled={path === "/"}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Home"
          className="inline-flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={() => onCwd(home)}
        >
          <Home className="size-4" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 text-xs">
          {crumbs.map((c) => (
            <button
              key={c.abs}
              type="button"
              onClick={() => onCwd(c.abs)}
              className={cn(
                "h-11 shrink-0 px-2",
                c.abs === path ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {entries.length === 0 ? (
          <p className="px-2 py-8 text-sm text-muted-foreground">This folder is empty.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {entries.map((e) => {
              const abs = path === "/" ? `/${e.name}` : `${path}/${e.name}`;
              const isDir = e.node.t === "d";
              const on = active === abs;
              return (
                <button
                  key={abs}
                  type="button"
                  onClick={() => {
                    if (isDir) onCwd(abs);
                    else onOpen(abs);
                  }}
                  className={cn(
                    "flex h-24 flex-col items-center justify-center gap-2 rounded-lg px-2 text-center",
                    on ? "bg-accent text-accent-foreground" : "hover:bg-secondary",
                  )}
                >
                  <FileGlyph vfs={vfs} path={abs} isDir={isDir} rev={rev} />
                  <span className="w-full truncate text-xs">{e.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex h-9 shrink-0 items-center border-t border-border px-3 font-mono text-[11px] text-muted-foreground">
        {entries.length} item{entries.length === 1 ? "" : "s"} · {path}
      </div>
    </div>
  );
}

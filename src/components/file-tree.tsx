import { useMemo, useState } from "react";
import { ChevronRight, File as FileIcon, Folder } from "lucide-react";
import { type Vfs } from "@/lib/linux/vfs";
import { cn } from "@/lib/utils";

export function FileTree({
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
  const root = home;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center px-3 text-[11px] tracking-wide text-muted-foreground uppercase">
        Files
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-1 pb-3">
        <TreeDir
          vfs={vfs}
          path={root}
          name={root.replace(/\/home\//, "~")}
          depth={0}
          cwd={cwd}
          active={active}
          onOpen={onOpen}
          onCwd={onCwd}
          defaultOpen
          rev={rev}
        />
      </div>
    </div>
  );
}

function TreeDir({
  vfs,
  path,
  name,
  depth,
  cwd,
  active,
  onOpen,
  onCwd,
  defaultOpen,
  rev,
}: {
  vfs: Vfs;
  path: string;
  name: string;
  depth: number;
  cwd: string;
  active: string | null;
  onOpen: (path: string) => void;
  onCwd: (path: string) => void;
  defaultOpen?: boolean;
  rev: number;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen || cwd.startsWith(path)));
  const entries = useMemo(() => {
    try {
      return vfs.list(path);
    } catch {
      return [];
    }
  }, [vfs, path, rev]);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          onCwd(path);
        }}
        className={cn(
          "flex h-8 w-full items-center gap-1 rounded-sm pr-2 text-left text-sm hover:bg-secondary",
          cwd === path && "bg-secondary",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <Folder className="size-3.5 shrink-0 text-sage-dim" />
        <span className="truncate">{name}</span>
      </button>
      {open &&
        entries.map((e) => {
          const child = path === "/" ? `/${e.name}` : `${path}/${e.name}`;
          if (e.node.t === "d") {
            return (
              <TreeDir
                key={child}
                vfs={vfs}
                path={child}
                name={e.name}
                depth={depth + 1}
                cwd={cwd}
                active={active}
                onOpen={onOpen}
                onCwd={onCwd}
                rev={rev}
              />
            );
          }
          return (
            <button
              key={child}
              type="button"
              onClick={() => onOpen(child)}
              className={cn(
                "flex h-8 w-full items-center gap-1 rounded-sm pr-2 text-left text-sm hover:bg-secondary",
                active === child && "bg-accent text-accent-foreground",
              )}
              style={{ paddingLeft: 20 + (depth + 1) * 12 }}
            >
              <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{e.name}</span>
            </button>
          );
        })}
    </div>
  );
}

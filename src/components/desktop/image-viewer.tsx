import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Vfs } from "@/lib/linux/vfs";
import { isImagePath } from "@/lib/linux/images-meta";
import { vfsImageSrc } from "@/lib/linux/image-src";
import { cn } from "@/lib/utils";

export function ImageViewer({
  vfs,
  home,
  path,
  onPath,
  rev,
}: {
  vfs: Vfs;
  home: string;
  path: string | null;
  onPath: (path: string) => void;
  rev: number;
}) {
  const pictures = `${home}/Pictures`;
  const desktop = `${home}/Desktop`;
  const album = useMemo(() => {
    const dirs = [pictures, desktop, home];
    const out: string[] = [];
    for (const d of dirs) {
      try {
        if (!vfs.isDir(d)) continue;
        for (const e of vfs.list(d)) {
          if (e.node.t === "f" && isImagePath(e.name)) {
            const abs = `${d}/${e.name}`;
            if (!out.includes(abs)) out.push(abs);
          }
        }
      } catch {
        /* ignore */
      }
    }
    void rev;
    return out;
  }, [vfs, home, pictures, desktop, rev]);

  const current = path && isImagePath(path) && vfs.isFile(path) ? path : album[0] ?? null;
  const [broken, setBroken] = useState(false);
  const src = vfsImageSrc(vfs, current);
  const idx = current ? album.indexOf(current) : -1;

  function step(dir: number) {
    if (!album.length) return;
    const next = album[(idx + dir + album.length) % album.length];
    if (next) {
      setBroken(false);
      onPath(next);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-terminal">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-2">
        <button type="button" aria-label="Previous" className="inline-flex size-11 items-center justify-center" onClick={() => step(-1)}>
          <ChevronLeft className="size-4" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center font-mono text-xs text-muted-foreground">
          {current ?? "No images"}
        </p>
        <button type="button" aria-label="Next" className="inline-flex size-11 items-center justify-center" onClick={() => step(1)}>
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
        {src && !broken ? (
          <img
            src={src}
            alt={current ?? "image"}
            className="max-h-full max-w-full object-contain outline outline-1 -outline-offset-1 outline-paper/10"
            onError={() => setBroken(true)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Open an image from the desktop or Pictures.</p>
        )}
      </div>
      {album.length > 0 && (
        <div className="flex h-16 shrink-0 gap-2 overflow-x-auto border-t border-border px-2 py-2">
          {album.map((p) => {
            const thumb = vfsImageSrc(vfs, p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setBroken(false);
                  onPath(p);
                }}
                className={cn(
                  "flex h-12 shrink-0 items-center gap-2 rounded-md px-2 font-mono text-[11px]",
                  p === current ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {thumb ? <img src={thumb} alt="" className="size-8 rounded-sm object-cover" /> : null}
                {p.split("/").pop()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

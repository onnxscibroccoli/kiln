import { useMemo } from "react";
import { type Vfs } from "@/lib/linux/vfs";
import { isImagePath } from "@/lib/linux/images-meta";
import { FileGlyph } from "@/components/desktop/file-glyph";

type Icon = { label: string; path: string; dir: boolean };

export function DesktopIcons({
  vfs,
  home,
  rev,
  onOpenFile,
  onOpenDir,
  onOpenImage,
}: {
  vfs: Vfs;
  home: string;
  rev: number;
  onOpenFile: (path: string) => void;
  onOpenDir: (path: string) => void;
  onOpenImage: (path: string) => void;
}) {
  const icons = useMemo(() => {
    const pinned: Icon[] = [
      { label: "Home", path: home, dir: true },
      { label: "Pictures", path: `${home}/Pictures`, dir: true },
    ];
    const desk = `${home}/Desktop`;
    const extra: Icon[] = [];
    try {
      if (vfs.isDir(desk)) {
        for (const e of vfs.list(desk)) {
          extra.push({
            label: e.name,
            path: `${desk}/${e.name}`,
            dir: e.node.t === "d",
          });
        }
      }
    } catch {
      /* ignore */
    }
    void rev;
    return [...pinned, ...extra];
  }, [vfs, home, rev]);

  return (
    <div className="absolute top-3 left-2 z-10 flex max-h-[calc(100%-1rem)] flex-col flex-wrap content-start gap-1">
      {icons.map((icon) => (
        <button
          key={icon.path + icon.label}
          type="button"
          onClick={() => {
            if (icon.dir) onOpenDir(icon.path);
            else if (isImagePath(icon.path)) onOpenImage(icon.path);
            else onOpenFile(icon.path);
          }}
          className="pointer-events-auto flex w-[4.75rem] flex-col items-center gap-1 rounded-lg px-1 py-2 text-paper hover:bg-paper/10"
        >
          <FileGlyph vfs={vfs} path={icon.path} isDir={icon.dir} rev={rev} />
          <span className="w-full truncate text-center text-[11px] leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
            {icon.label}
          </span>
        </button>
      ))}
    </div>
  );
}

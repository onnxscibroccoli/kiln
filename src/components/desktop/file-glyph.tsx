import { File as FileIcon, Folder } from "lucide-react";
import { type Vfs } from "@/lib/linux/vfs";
import { vfsImageSrc } from "@/lib/linux/image-src";
import { cn } from "@/lib/utils";

export function FileGlyph({
  vfs,
  path,
  isDir,
  rev,
  className,
}: {
  vfs: Vfs;
  path: string;
  isDir: boolean;
  rev: number;
  className?: string;
}) {
  const src = isDir ? null : vfsImageSrc(vfs, path);
  void rev;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("size-10 rounded-md object-cover outline outline-1 -outline-offset-1 outline-paper/15", className)}
      />
    );
  }
  if (isDir) return <Folder className={cn("size-8 text-sage", className)} />;
  return <FileIcon className={cn("size-8 text-muted-foreground", className)} />;
}

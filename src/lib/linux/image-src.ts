import { type Vfs } from "./vfs";
import { isImagePath } from "./images-meta";

export function vfsImageSrc(vfs: Vfs, path: string | null | undefined): string | null {
  if (!path || !isImagePath(path) || !vfs.isFile(path)) return null;
  try {
    const raw = vfs.readFile(path);
    if (path.toLowerCase().endsWith(".svg") || raw.trim().startsWith("<svg")) {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`;
    }
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
    return `data:image/png;base64,${btoa(raw.slice(0, 200_000))}`;
  } catch {
    return null;
  }
}

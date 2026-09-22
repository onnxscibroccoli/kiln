import { Bot, Files, Globe, Image as ImageIcon, Package, Settings } from "lucide-react";
import { type Distro } from "@/lib/linux/distros";
import { type AppId } from "@/lib/linux/shell";

const TILES: { id: AppId; label: string; body: string; icon: typeof Files }[] = [
  { id: "files", label: "Thunar", body: "Folders and pictures", icon: Files },
  { id: "viewer", label: "Ristretto", body: "View images", icon: ImageIcon },
  { id: "browser", label: "Web", body: "Open a page", icon: Globe },
  { id: "images", label: "Software", body: "Search Linux images", icon: Package },
  { id: "agent", label: "Agent", body: "Ask it to drive the desktop", icon: Bot },
  { id: "settings", label: "Settings", body: "Session and image", icon: Settings },
];

export function WelcomeApp({
  distro,
  hostname,
  onOpen,
}: {
  distro: Distro;
  hostname: string;
  onOpen: (app: AppId) => void;
}) {
  return (
    <div className="h-full overflow-auto px-5 py-6">
      <p className="text-xs tracking-[0.18em] text-sage-dim uppercase">xfce4-session</p>
      <h1 className="font-display mt-2 text-3xl tracking-tight">{distro.pretty}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Display :0 is attached on {hostname}. Wallpaper, desktop icons, and the panel are the session —
        click a picture to open Ristretto.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {TILES.map(({ id, label, body, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpen(id)}
            className="flex h-20 items-center gap-3 rounded-lg bg-card px-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
          >
            <Icon className="size-5 shrink-0 text-sage" />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{body}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Clipboard, Expand, Keyboard, Settings, Shrink, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";

export function KasmPanel({
  host,
  distro,
  saveState,
  clipboard,
  onClipboard,
  onMenu,
  onSettings,
  onTerminal,
}: {
  host: string;
  distro: string;
  saveState: "idle" | "saving" | "saved" | "error";
  clipboard: string;
  onClipboard: (v: string) => void;
  onMenu: () => void;
  onSettings: () => void;
  onTerminal: () => void;
}) {
  const [full, setFull] = useState(false);
  const [keys, setKeys] = useState(false);
  const [clip, setClip] = useState(false);

  async function toggleFull() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFull(false);
      } else {
        await document.documentElement.requestFullscreen();
        setFull(true);
      }
    } catch {
      /* ignore */
    }
  }

  async function openClip() {
    setKeys(false);
    setClip((v) => !v);
    try {
      const t = await navigator.clipboard.readText();
      if (t) onClipboard(t);
    } catch {
      /* ignore */
    }
  }

  async function copyClip() {
    try {
      if (clipboard) await navigator.clipboard.writeText(clipboard);
    } catch {
      /* ignore */
    }
  }

  return (
    <aside className="kiln-kasm relative z-40 hidden w-12 shrink-0 flex-col items-center py-2 md:flex">
      <p className="sr-only">
        Connected to {host} · {distro} · display :0
        {saveState === "saving" ? " · syncing volume" : saveState === "saved" ? " · volume synced" : ""}
      </p>
      <RailBtn label="Clipboard" on={clip} onClick={() => void openClip()}>
        <Clipboard className="size-4" />
      </RailBtn>
      <RailBtn
        label="Extra keys"
        on={keys}
        onClick={() => {
          setClip(false);
          setKeys((v) => !v);
        }}
      >
        <Keyboard className="size-4" />
      </RailBtn>
      <RailBtn label="Fullscreen" on={full} onClick={() => void toggleFull()}>
        {full ? <Shrink className="size-4" /> : <Expand className="size-4" />}
      </RailBtn>
      <RailBtn label="Settings" onClick={onSettings}>
        <Settings className="size-4" />
      </RailBtn>
      <div className="flex-1" />
      <div className="py-1">
        <UserButton />
      </div>
      <Link
        to="/boxes"
        aria-label="Disconnect"
        title="Disconnect"
        className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Unplug className="size-4" />
      </Link>

      {clip && (
        <div className="absolute top-2 left-12 z-50 w-72 rounded-lg bg-card p-3 shadow-[var(--shadow-border)]">
          <label htmlFor="kiln-clip" className="text-xs text-muted-foreground">
            Clipboard
          </label>
          <textarea
            id="kiln-clip"
            value={clipboard}
            onChange={(e) => onClipboard(e.target.value)}
            className="mt-1 h-24 w-full resize-none bg-transparent text-sm outline-none"
          />
          <Button size="sm" className="mt-2 h-11" onClick={() => void copyClip()}>
            Copy to device
          </Button>
        </div>
      )}
      {keys && (
        <div className="absolute top-14 left-12 z-50 flex w-64 flex-wrap gap-1 rounded-lg bg-card p-2 shadow-[var(--shadow-border)]">
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-secondary px-3 font-mono text-xs"
          >
            Super
          </button>
          <button
            type="button"
            onClick={onTerminal}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-secondary px-3 font-mono text-xs"
          >
            Ctrl+Alt+T
          </button>
          <button
            type="button"
            onClick={() => setKeys(false)}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-secondary px-3 font-mono text-xs"
          >
            Esc
          </button>
        </div>
      )}
    </aside>
  );
}

function RailBtn({
  label,
  on,
  onClick,
  children,
}: {
  label: string;
  on?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground",
        on && "text-sage",
      )}
    >
      {children}
    </button>
  );
}

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clipboard, Expand, Keyboard, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";

export function ConnectSplash({
  host,
  distro,
  onDone,
}: {
  host: string;
  distro: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(onDone, reduce ? 80 : 900);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-xs tracking-[0.18em] text-sage-dim uppercase">Kiln display</p>
      <h1 className="font-display mt-3 text-3xl tracking-tight">Connecting to :0</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {distro} · XFCE session · {host}
      </p>
      <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-2/3 bg-sage" />
      </div>
    </div>
  );
}

export function SessionBar({
  host,
  distro,
  saveState,
  clipboard,
  onClipboard,
}: {
  host: string;
  distro: string;
  saveState: "idle" | "saving" | "saved" | "error";
  clipboard: string;
  onClipboard: (v: string) => void;
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

  async function copyClip() {
    try {
      if (clipboard) await navigator.clipboard.writeText(clipboard);
      setClip(false);
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="kiln-topbar relative flex h-11 shrink-0 items-center gap-1 border-b border-border px-1 sm:px-2">
      <Button variant="ghost" size="icon" className="size-11" asChild>
        <Link to="/boxes" aria-label="Disconnect">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
      <div className="min-w-0 flex-1 px-1">
        <p className="truncate text-xs sm:text-sm">
          <span className="text-good">Connected</span>
          <span className="text-muted-foreground"> · {host} · {distro} · :0</span>
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {saveState === "saving"
            ? "Syncing volume…"
            : saveState === "saved"
              ? "Volume synced"
              : saveState === "error"
                ? "Sync failed"
                : "XFCE · Kiln compositor"}
        </p>
      </div>
      <button
        type="button"
        aria-label="Clipboard"
        className={cn("inline-flex size-11 items-center justify-center", clip && "text-sage")}
        onClick={() => setClip((v) => !v)}
      >
        <Clipboard className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Extra keys"
        className={cn("inline-flex size-11 items-center justify-center", keys && "text-sage")}
        onClick={() => setKeys((v) => !v)}
      >
        <Keyboard className="size-4" />
      </button>
      <button type="button" aria-label="Fullscreen" className="inline-flex size-11 items-center justify-center" onClick={() => void toggleFull()}>
        {full ? <Shrink className="size-4" /> : <Expand className="size-4" />}
      </button>
      <div className="hidden sm:block">
        <UserButton />
      </div>
      {clip && (
        <div className="absolute top-11 right-2 z-50 w-[min(100%-1rem,20rem)] rounded-lg bg-card p-3 shadow-[var(--shadow-border)]">
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
            Copy
          </Button>
        </div>
      )}
      {keys && (
        <div className="absolute top-11 right-2 z-50 flex flex-wrap gap-1 rounded-lg bg-card p-2 shadow-[var(--shadow-border)]">
          {["Ctrl", "Alt", "Tab", "Esc", "Super"].map((k) => (
            <span key={k} className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-secondary px-3 font-mono text-xs">
              {k}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

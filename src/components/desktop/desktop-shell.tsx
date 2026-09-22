import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Code2,
  Files,
  LayoutGrid,
  Package,
  Save,
  Settings,
  TerminalSquare,
} from "lucide-react";
import { FileTree } from "@/components/file-tree";
import { EditorPane } from "@/components/editor-pane";
import { TerminalPane } from "@/components/terminal-pane";
import { ImageBrowser } from "@/components/desktop/image-browser";
import { AgentApp } from "@/components/desktop/agent-app";
import { SettingsApp } from "@/components/desktop/settings-app";
import { WindowFrame, type WinState } from "@/components/desktop/window-frame";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/lib/auth/gates";
import { getDistro, type Distro } from "@/lib/linux/distros";
import { type AppId, type ShellHooks, type ShellState } from "@/lib/linux/shell";
import { type Workstation } from "@/lib/workstations";
import { cn } from "@/lib/utils";

const APPS: { id: AppId; label: string; icon: typeof Files }[] = [
  { id: "files", label: "Files", icon: Files },
  { id: "term", label: "Terminal", icon: TerminalSquare },
  { id: "editor", label: "Editor", icon: Code2 },
  { id: "images", label: "Software", icon: Package },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
];

const GEOM: Record<AppId, Pick<WinState, "title" | "x" | "y" | "w" | "h">> = {
  files: { title: "Files", x: 16, y: 12, w: 300, h: 460 },
  term: { title: "Terminal", x: 330, y: 40, w: 640, h: 390 },
  editor: { title: "Editor", x: 160, y: 20, w: 700, h: 480 },
  images: { title: "Software", x: 72, y: 28, w: 740, h: 520 },
  agent: { title: "Agent", x: 340, y: 28, w: 420, h: 520 },
  settings: { title: "Settings", x: 220, y: 64, w: 440, h: 420 },
};

function freshWins(desktop: boolean): Record<AppId, WinState> {
  const base = {} as Record<AppId, WinState>;
  let z = 1;
  for (const app of APPS) {
    const g = GEOM[app.id];
    const open = app.id === "term" || (desktop && app.id === "files");
    base[app.id] = {
      app: app.id,
      ...g,
      z: open ? z++ : 0,
      minimized: false,
      maximized: !desktop,
      open,
    };
  }
  return base;
}

export function DesktopShell({
  box,
  distro,
  st,
  hooks,
  restoring,
  home,
  rev,
  openPath,
  draft,
  dirty,
  saveState,
  cloneNote,
  termFocus,
  onOpenFile,
  onCwd,
  onDraft,
  onSaveEditor,
  persist,
  bump,
  onApplyImage,
}: {
  box: Workstation;
  distro: Distro;
  st: ShellState;
  hooks: ShellHooks;
  restoring: boolean;
  home: string;
  rev: number;
  openPath: string | null;
  draft: string;
  dirty: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  cloneNote: string | null;
  termFocus: number;
  onOpenFile: (path: string) => void;
  onCwd: (path: string) => void;
  onDraft: (v: string) => void;
  onSaveEditor: () => void;
  persist: () => void;
  bump: () => void;
  onApplyImage: (distroId: string, githubRepo: string) => Promise<void>;
}) {
  const [desktop, setDesktop] = useState(false);
  const [wins, setWins] = useState<Record<AppId, WinState>>(() => freshWins(false));
  const [focus, setFocus] = useState<AppId>("term");
  const [overview, setOverview] = useState(false);
  const [clock, setClock] = useState("");
  const [pick, setPick] = useState(distro);
  const [gh, setGh] = useState(box.githubRepo ?? "");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      const next = mq.matches;
      setDesktop(next);
      setWins((w) => {
        const copy = { ...w };
        for (const id of Object.keys(copy) as AppId[]) {
          copy[id] = { ...copy[id]!, maximized: next ? copy[id]!.maximized && copy[id]!.open : true };
        }
        return copy;
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    tick();
    const t = window.setInterval(tick, 15_000);
    return () => window.clearInterval(t);
  }, []);

  const zTop = useMemo(() => Math.max(1, ...Object.values(wins).map((w) => w.z)), [wins]);

  const openApp = useCallback(
    (app: AppId) => {
      setOverview(false);
      setWins((w) => ({
        ...w,
        [app]: { ...w[app]!, open: true, minimized: false, z: zTop + 1, maximized: desktop ? w[app]!.maximized : true },
      }));
      setFocus(app);
    },
    [desktop, zTop],
  );

  const hooked = useMemo<ShellHooks>(
    () => ({
      ...hooks,
      openApp,
      openFile: (path) => {
        hooks.openFile(path);
        openApp("editor");
      },
    }),
    [hooks, openApp],
  );

  const active = Object.values(wins)
    .filter((w) => w.open && !w.minimized)
    .sort((a, b) => a.z - b.z);

  return (
    <div className="kiln-desk flex h-dvh flex-col" data-desk={distro.desk}>
      <header className="kiln-topbar flex h-11 shrink-0 items-center gap-1 border-b border-border px-1 sm:px-2">
        <Button variant="ghost" size="icon" className="size-11" asChild>
          <Link to="/boxes" aria-label="Back to boxes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <button
          type="button"
          onClick={() => setOverview((v) => !v)}
          className="inline-flex h-11 items-center gap-2 px-2 text-sm"
        >
          <LayoutGrid className="size-4" />
          <span className="hidden sm:inline">Activities</span>
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs sm:text-sm">
            {box.name}
            <span className="text-muted-foreground"> · {distro.name}</span>
          </p>
          {cloneNote && <p className="truncate text-[11px] text-sage-dim">{cloneNote}</p>}
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed" : ""}
        </span>
        <Button variant="ghost" size="icon" className="size-11" onClick={() => persist()} aria-label="Save">
          <Save className="size-4" />
        </Button>
        <time className="hidden px-2 font-mono text-xs tabular-nums sm:inline">{clock}</time>
        <div className="hidden sm:block">
          <UserButton />
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {active.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="font-display text-2xl tracking-tight text-paper/80 italic">
              {distro.pretty}
            </p>
          </div>
        )}

        {APPS.map(({ id }) => {
          const win = wins[id]!;
          if (!win.open) return null;
          return (
            <div key={id} className={cn(!win.minimized ? "contents" : "hidden")}>
              <WindowFrame
                win={win}
                desktop={desktop}
                active={focus === id}
                onFocus={() => {
                  setFocus(id);
                  setWins((w) => ({ ...w, [id]: { ...w[id]!, z: zTop + 1 } }));
                }}
                onClose={() => setWins((w) => ({ ...w, [id]: { ...w[id]!, open: false, minimized: false } }))}
                onMin={() => setWins((w) => ({ ...w, [id]: { ...w[id]!, minimized: true } }))}
                onMax={() =>
                  setWins((w) => ({ ...w, [id]: { ...w[id]!, maximized: !w[id]!.maximized } }))
                }
                onMove={(x, y) => setWins((w) => ({ ...w, [id]: { ...w[id]!, x, y } }))}
              >
                {id === "files" && (
                  <FileTree
                    vfs={st.vfs}
                    home={home}
                    cwd={st.cwd}
                    active={openPath}
                    onOpen={(p) => {
                      onOpenFile(p);
                      openApp("editor");
                    }}
                    onCwd={onCwd}
                    rev={rev}
                  />
                )}
                {id === "term" && (
                  <TerminalPane
                    state={st}
                    hooks={hooked}
                    restoring={restoring}
                    distro={distro}
                    hostname={box.name}
                    onMutate={bump}
                    focusNonce={termFocus}
                  />
                )}
                {id === "editor" && (
                  <EditorPane
                    path={openPath}
                    value={draft}
                    dirty={dirty}
                    onChange={onDraft}
                    onSave={onSaveEditor}
                  />
                )}
                {id === "images" && (
                  <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
                    <p className="text-sm text-muted-foreground">
                      Search the catalog or paste a GitHub image URL. Applying changes wallpaper, packages, and
                      os-release — your files stay.
                    </p>
                    <ImageBrowser
                      selected={pick.id}
                      onSelect={setPick}
                      githubRepo={gh}
                      onGithubRepo={setGh}
                    />
                    <Button
                      className="h-11"
                      disabled={applying}
                      onClick={() => {
                        setApplying(true);
                        void onApplyImage(pick.id, gh).finally(() => setApplying(false));
                      }}
                    >
                      {applying ? "Applying…" : `Use ${pick.name}`}
                    </Button>
                  </div>
                )}
                {id === "agent" && <AgentApp state={st} hooks={hooked} onMutate={bump} />}
                {id === "settings" && <SettingsApp box={box} distro={distro} user={st.user} />}
              </WindowFrame>
            </div>
          );
        })}

        {overview && (
          <div className="absolute inset-0 z-50 flex flex-col bg-background/80 p-4 backdrop-blur-sm">
            <p className="text-xs tracking-[0.18em] text-sage-dim uppercase">Applications</p>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {APPS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openApp(id)}
                  className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl bg-card shadow-[var(--shadow-border)]"
                >
                  <Icon className="size-5 text-sage" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" className="mt-6 self-start" onClick={() => setOverview(false)}>
              Close overview
            </Button>
          </div>
        )}
      </div>

      <nav className="kiln-dock mx-auto mb-2 flex h-14 w-[min(100%-1rem,36rem)] items-center justify-around rounded-xl px-1">
        {APPS.map(({ id, label, icon: Icon }) => {
          const on = wins[id]!.open && !wins[id]!.minimized && focus === id;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              onClick={() => {
                if (wins[id]!.open && !wins[id]!.minimized && focus === id && desktop) {
                  setWins((w) => ({ ...w, [id]: { ...w[id]!, minimized: true } }));
                } else openApp(id);
              }}
              className={cn(
                "flex size-11 flex-col items-center justify-center rounded-lg",
                on ? "text-sage" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export { getDistro };

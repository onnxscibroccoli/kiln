import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Calculator,
  Code2,
  Files,
  Folder,
  Globe,
  Image as ImageIcon,
  Package,
  Settings,
  TerminalSquare,
} from "lucide-react";
import { EditorPane } from "@/components/editor-pane";
import { TerminalPane } from "@/components/terminal-pane";
import { ImageBrowser } from "@/components/desktop/image-browser";
import { AgentApp } from "@/components/desktop/agent-app";
import { SettingsApp } from "@/components/desktop/settings-app";
import { FilesApp } from "@/components/desktop/files-app";
import { WelcomeApp } from "@/components/desktop/welcome-app";
import { BrowserApp } from "@/components/desktop/browser-app";
import { CalcApp } from "@/components/desktop/calc-app";
import { ImageViewer } from "@/components/desktop/image-viewer";
import { ConnectSplash, SessionBar } from "@/components/desktop/session-chrome";
import { XfcePanel } from "@/components/desktop/xfce-panel";
import { KasmPanel } from "@/components/desktop/kasm-panel";
import { DesktopIcons } from "@/components/desktop/desktop-icons";
import { WhiskerMenu, type MenuApp } from "@/components/desktop/whisker-menu";
import { WindowFrame, type WinState } from "@/components/desktop/window-frame";
import { Button } from "@/components/ui/button";
import { type Distro } from "@/lib/linux/distros";
import { isImagePath } from "@/lib/linux/images-meta";
import { vfsImageSrc } from "@/lib/linux/image-src";
import { type AppId, type ShellHooks, type ShellState } from "@/lib/linux/shell";
import { type Workstation } from "@/lib/workstations";
import { cn } from "@/lib/utils";

const APPS: MenuApp[] = [
  { id: "files", label: "Thunar", group: "Accessories", icon: Files },
  { id: "editor", label: "Mousepad", group: "Accessories", icon: Code2 },
  { id: "browser", label: "Web", group: "Internet", icon: Globe },
  { id: "viewer", label: "Ristretto", group: "Graphics", icon: ImageIcon },
  { id: "images", label: "Software", group: "System", icon: Package },
  { id: "agent", label: "Agent", group: "System", icon: Bot },
  { id: "calc", label: "Calculator", group: "Accessories", icon: Calculator },
  { id: "settings", label: "Settings", group: "System", icon: Settings },
  { id: "term", label: "Terminal", group: "System", icon: TerminalSquare },
  { id: "welcome", label: "About", group: "System", icon: Folder },
];

const LAUNCH: AppId[] = ["files", "browser", "editor", "viewer", "agent"];

const GEOM: Record<AppId, Pick<WinState, "title" | "x" | "y" | "w" | "h">> = {
  welcome: { title: "About this session", x: 72, y: 28, w: 560, h: 480 },
  files: { title: "Thunar", x: 24, y: 16, w: 640, h: 480 },
  term: { title: "Terminal", x: 330, y: 40, w: 640, h: 390 },
  editor: { title: "Mousepad", x: 160, y: 20, w: 700, h: 480 },
  images: { title: "Software", x: 72, y: 28, w: 740, h: 520 },
  agent: { title: "Agent", x: 340, y: 28, w: 420, h: 520 },
  settings: { title: "Settings", x: 220, y: 64, w: 440, h: 420 },
  browser: { title: "Web", x: 80, y: 24, w: 720, h: 520 },
  calc: { title: "Calculator", x: 400, y: 80, w: 320, h: 440 },
  viewer: { title: "Ristretto", x: 90, y: 20, w: 680, h: 500 },
};

function freshWins(desktop: boolean): Record<AppId, WinState> {
  const base = {} as Record<AppId, WinState>;
  for (const app of APPS) {
    const g = GEOM[app.id];
    base[app.id] = {
      app: app.id,
      ...g,
      z: 0,
      minimized: false,
      maximized: !desktop,
      open: false,
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
  const [connected, setConnected] = useState(false);
  const [wins, setWins] = useState<Record<AppId, WinState>>(() => freshWins(false));
  const [focus, setFocus] = useState<AppId | null>(null);
  const [overview, setOverview] = useState(false);
  const [clock, setClock] = useState("");
  const [pick, setPick] = useState(distro);
  const [gh, setGh] = useState(box.githubRepo ?? "");
  const [applying, setApplying] = useState(false);
  const [clip, setClip] = useState(cloneNote ?? "");

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
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    tick();
    const t = window.setInterval(tick, 15_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (cloneNote) setClip(cloneNote);
  }, [cloneNote]);

  const zTop = useMemo(() => Math.max(1, ...Object.values(wins).map((w) => w.z)), [wins]);

  const openApp = useCallback(
    (app: AppId) => {
      setOverview(false);
      setWins((w) => ({
        ...w,
        [app]: {
          ...w[app]!,
          open: true,
          minimized: false,
          z: zTop + 1,
          maximized: desktop ? w[app]!.maximized : true,
        },
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
        openApp(isImagePath(path) ? "viewer" : "editor");
      },
    }),
    [hooks, openApp],
  );

  const openWindows = Object.values(wins).filter((w) => w.open && !w.minimized);
  const wallpaper = vfsImageSrc(st.vfs, `${home}/Pictures/wallpaper.svg`);

  function openFromFiles(p: string) {
    onOpenFile(p);
    openApp(isImagePath(p) ? "viewer" : "editor");
  }

  if (!connected) {
    return (
      <ConnectSplash
        host={box.name}
        distro={distro.name}
        onDone={() => setConnected(true)}
      />
    );
  }

  return (
    <div className="kiln-desk flex h-dvh" data-desk={distro.desk}>
      <KasmPanel
        host={box.name}
        distro={distro.name}
        saveState={saveState}
        clipboard={clip}
        onClipboard={setClip}
        onMenu={() => setOverview((v) => !v)}
        onSettings={() => openApp("settings")}
        onTerminal={() => openApp("term")}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SessionBar
          host={box.name}
          distro={distro.name}
          saveState={saveState}
          clipboard={clip}
          onClipboard={setClip}
          onMenu={() => setOverview((v) => !v)}
          onSettings={() => openApp("settings")}
          onTerminal={() => openApp("term")}
        />

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {wallpaper ? (
            <img src={wallpaper} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-16">
            <p className="font-display text-2xl tracking-tight text-paper/70 italic drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
              {distro.pretty}
            </p>
          </div>

          <DesktopIcons
            vfs={st.vfs}
            home={home}
            rev={rev}
            onOpenFile={openFromFiles}
            onOpenDir={(path) => {
              if (st.vfs.isDir(path)) onCwd(path);
              openApp("files");
            }}
            onOpenImage={(path) => {
              onOpenFile(path);
              openApp("viewer");
            }}
          />

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
                  onMax={() => setWins((w) => ({ ...w, [id]: { ...w[id]!, maximized: !w[id]!.maximized } }))}
                  onMove={(x, y) => setWins((w) => ({ ...w, [id]: { ...w[id]!, x, y } }))}
                >
                  {id === "welcome" && <WelcomeApp distro={distro} hostname={box.name} onOpen={openApp} />}
                  {id === "files" && (
                    <FilesApp
                      vfs={st.vfs}
                      home={home}
                      cwd={st.cwd}
                      active={openPath}
                      onOpen={openFromFiles}
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
                    <EditorPane path={openPath} value={draft} dirty={dirty} onChange={onDraft} onSave={onSaveEditor} />
                  )}
                  {id === "images" && (
                    <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
                      <p className="text-sm text-muted-foreground">
                        Search a Linux image or paste a GitHub URL. Your files stay.
                      </p>
                      <ImageBrowser selected={pick.id} onSelect={setPick} githubRepo={gh} onGithubRepo={setGh} />
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
                  {id === "browser" && <BrowserApp hooks={hooked} />}
                  {id === "calc" && <CalcApp />}
                  {id === "viewer" && (
                    <ImageViewer vfs={st.vfs} home={home} path={openPath} onPath={onOpenFile} rev={rev} />
                  )}
                </WindowFrame>
              </div>
            );
          })}

          {overview && (
            <WhiskerMenu
              apps={APPS}
              onOpen={openApp}
              onClose={() => setOverview(false)}
            />
          )}
        </div>

        <XfcePanel
          clock={clock}
          menuOpen={overview}
          onMenu={() => setOverview((v) => !v)}
          status={`${st.user}@${box.name} · :0`}
          launchers={LAUNCH.map((id) => {
            const meta = APPS.find((a) => a.id === id)!;
            const Icon = meta.icon;
            const on = wins[id]!.open && !wins[id]!.minimized && focus === id;
            return {
              id,
              label: meta.label,
              icon: <Icon className="size-5" />,
              on,
              onClick: () => {
                if (wins[id]!.open && !wins[id]!.minimized && focus === id && desktop) {
                  setWins((w) => ({ ...w, [id]: { ...w[id]!, minimized: true } }));
                } else openApp(id);
              },
            };
          })}
          tasks={openWindows.map((w) => ({
            id: w.app,
            label: w.title,
            on: focus === w.app,
            onClick: () => openApp(w.app),
          }))}
        />
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Expand, Keyboard, Save, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/lib/auth/gates";
import { type BootSpec } from "@/lib/linux/boot-image";
import { loadSnapshot, loadV86, saveSnapshot, sendChord, typeAscii, type V86Instance } from "@/lib/linux/v86";

import { cn } from "@/lib/utils";

type Progress = { loaded: number; total: number; file?: string };

export function VmDisplay({
  boxId,
  host,
  boot,
}: {
  boxId: string;
  host: string;
  boot: BootSpec;
}) {
  const screenRef = useRef<HTMLDivElement>(null);
  const emuRef = useRef<V86Instance | null>(null);
  const [status, setStatus] = useState("Powering on…");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [full, setFull] = useState(false);
  const [keys, setKeys] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const onLock = () => setLocked(Boolean(document.pointerLockElement));
    document.addEventListener("pointerlockchange", onLock);
    return () => document.removeEventListener("pointerlockchange", onLock);
  }, []);

  useEffect(() => {
    const root = screenRef.current;
    if (!root) return;
    let dead = false;
    let emu: V86Instance | null = null;

    void (async () => {
      try {
        setError(null);
        setReady(false);
        setStatus("Loading emulator…");
        const V86 = await loadV86();
        if (dead) return;

        const mobile = window.matchMedia("(max-width: 767px)").matches;
        const memoryMb = Math.min(boot.memoryMb, mobile ? 128 : boot.memoryMb);
        const disk = { url: boot.url, async: boot.async };
        const config: Record<string, unknown> = {
          wasm_path: "/vm/v86.wasm",
          bios: { url: "/vm/seabios.bin" },
          vga_bios: { url: "/vm/vgabios.bin" },
          memory_size: memoryMb * 1024 * 1024,
          vga_memory_size: 8 * 1024 * 1024,
          screen_container: root,
          autostart: true,
          disable_speaker: true,
          fastboot: true,
          boot_order: boot.media === "cdrom" ? 0x123 : boot.media === "fda" ? 0x321 : 0x132,
          net_device: { type: "ne2k", relay_url: "wss://relay.widgetry.org/" },
        };
        if (boot.media === "cdrom") config.cdrom = disk;
        else if (boot.media === "fda") config.fda = disk;
        else config.hda = disk;

        setStatus(`Fetching ${boot.label}…`);
        emu = new V86(config);
        emuRef.current = emu;

        const onProg = (...args: unknown[]) => {
          const p = args[0] as { loaded?: number; total?: number; file_name?: string } | undefined;
          if (!p || typeof p.loaded !== "number") return;
          setProgress({ loaded: p.loaded, total: p.total ?? 0, file: p.file_name });
        };
        emu.add_listener("download-progress", onProg);
        emu.add_listener("emulator-loaded", () => {
          if (dead) return;
          setStatus("Booting kernel…");
          void Promise.resolve(emu?.run()).catch(() => undefined);
          void (async () => {
            const snap = await loadSnapshot(boxId);
            if (dead || !emuRef.current || !snap) return;
            setStatus("Restoring last session…");
            try {
              await emuRef.current.restore_state(snap);
              setReady(true);
              setStatus("Running");
            } catch {
              setStatus("Cold boot");
            }
          })();
        });
        emu.add_listener("emulator-ready", () => {
          if (dead) return;
          setReady(true);
          setStatus("Running");
          if (boot.sendEnter) {
            window.setTimeout(() => {
              if (dead || !emuRef.current) return;
              void emuRef.current.keyboard_send_scancodes([0x1c, 0x9c], 40);
            }, 2200);
          }
          if (boot.startx) {
            const started = Date.now();
            const tick = () => {
              if (dead || !emuRef.current) return;
              const text = (root.innerText || "").toLowerCase();
              const prompt =
                text.includes("tinycorelinux.net") || text.includes("tc@") || text.includes("no warranty");
              if (prompt || Date.now() - started > 50_000) {
                setStatus("Starting X…");
                void typeAscii(emuRef.current, "startx\n");
                return;
              }
              window.setTimeout(tick, 1200);
            };
            window.setTimeout(tick, 5000);
          }
        });

      } catch (e) {
        if (!dead) setError(e instanceof Error ? e.message : "Machine failed to start");
      }
    })();

    return () => {
      dead = true;
      const cur = emuRef.current;
      emuRef.current = null;
      if (cur) void Promise.resolve(cur.destroy()).catch(() => undefined);
    };
  }, [boxId, boot.url, boot.media, boot.async, boot.memoryMb, boot.label]);

  const capture = useCallback(() => {
    const emu = emuRef.current;
    if (!emu) return;
    void emu.lock_mouse();
  }, []);

  async function persist() {
    const emu = emuRef.current;
    if (!emu) return;
    setSaveState("saving");
    try {
      const buf = await emu.save_state();
      await saveSnapshot(boxId, buf);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

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

  const pct =
    progress && progress.total > 0 ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : null;

  return (
    <div className="flex h-dvh flex-col bg-ink text-paper">
      <header className="kiln-topbar relative flex h-11 shrink-0 items-center gap-1 border-b border-border px-1 sm:px-2">
        <Button variant="ghost" size="icon" className="size-11" asChild>
          <Link to="/boxes" aria-label="Disconnect">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-xs sm:text-sm">
            <span className={ready ? "text-good" : "text-warn"}>{ready ? "Running" : "Booting"}</span>
            <span className="text-muted-foreground">
              {" "}
              · {host} · {boot.label}
            </span>
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {saveState === "saving"
              ? "Saving machine…"
              : saveState === "saved"
                ? "Snapshot saved"
                : saveState === "error"
                  ? "Snapshot failed"
                  : !ready
                    ? pct !== null
                      ? `${status} · ${pct}%`
                      : status
                    : "Real x86 PC · click the display to take the mouse"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Save machine"
          className="inline-flex size-11 items-center justify-center"
          onClick={() => void persist()}
        >
          <Save className="size-4" />
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
        {keys && (
          <div className="absolute top-11 right-2 z-50 flex flex-wrap gap-1 rounded-lg bg-card p-2 shadow-[var(--shadow-border)]">
            {[
              { label: "Ctrl+Alt+Del", chord: ["Ctrl", "Alt", "Del"] },
              { label: "Alt+F1", chord: ["Alt", "F1"] },
              { label: "Alt+F2", chord: ["Alt", "F2"] },
              { label: "Esc", chord: ["Esc"] },
            ].map((k) => (
              <button
                key={k.label}
                type="button"
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-secondary px-3 font-mono text-xs"
                onClick={() => {
                  const emu = emuRef.current;
                  if (emu) void sendChord(emu, k.chord);
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
        )}
      </header>
      {pct !== null && !ready && (
        <div className="h-0.5 bg-secondary">
          <div className="h-full bg-sage" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="relative min-h-0 flex-1 bg-terminal">
        <div
          ref={screenRef}
          className="kiln-vga h-full w-full"
          onClick={capture}
          role="application"
          aria-label="Machine display"
        >
          <div style={{ whiteSpace: "pre", font: "14px monospace", lineHeight: "14px" }} />
          <canvas className="kiln-vga-canvas" />
          <div className="pointer-events-none absolute top-0 left-0">
            <textarea className="phone_keyboard" aria-hidden tabIndex={-1} readOnly />
          </div>
        </div>

        {ready && !locked && !error && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <Button className="pointer-events-auto h-11" onClick={capture}>
              Click to control this machine
            </Button>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="max-w-md rounded-lg bg-card p-4 text-center shadow-[var(--shadow-border)]">
              <p className="font-display text-xl">Machine did not start</p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

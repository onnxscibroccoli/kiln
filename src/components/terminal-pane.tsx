import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { type Distro } from "@/lib/linux/distros";
import { bootLines } from "@/lib/linux/seed";
import {
  type ShellHooks,
  type ShellState,
  execLine,
  formatResult,
  prompt,
} from "@/lib/linux/shell";
import { COMMAND_NAMES } from "@/lib/linux/commands";

export function TerminalPane({
  state,
  hooks,
  restoring,
  distro,
  hostname,
  onMutate,
  focusNonce,
}: {
  state: ShellState;
  hooks: ShellHooks;
  restoring: boolean;
  distro: Distro;
  hostname: string;
  onMutate: () => void;
  focusNonce?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const runRef = useRef<(line: string) => Promise<void>>(async () => undefined);
  const bufferRef = useRef("");
  const histIdx = useRef(-1);
  const readyRef = useRef(false);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      disableStdin: false,
      fontFamily: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.35,
      theme: {
        background: "#0c0c0e",
        foreground: "#d8d6ce",
        cursor: "#c5d0cc",
        cursorAccent: "#0c0c0e",
        selectionBackground: "#2a2e2c",
        black: "#0c0c0e",
        red: "#b4554a",
        green: "#7d9a86",
        yellow: "#c4a574",
        blue: "#8aa0aa",
        magenta: "#9a8f8a",
        cyan: "#8fa09b",
        white: "#d8d6ce",
        brightBlack: "#6b6a66",
        brightRed: "#d07068",
        brightGreen: "#9bb8a3",
        brightYellow: "#d4b888",
        brightBlue: "#a8bec8",
        brightMagenta: "#b8ada8",
        brightCyan: "#c5d0cc",
        brightWhite: "#f1efe8",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(host);
    fit.fit();
    term.focus();
    termRef.current = term;

    const ro = new ResizeObserver(() => fit.fit());
    ro.observe(host);

    let cancelled = false;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function writePrompt() {
      term.write(prompt(state));
    }

    function redrawLine() {
      term.write("\r\x1b[K" + prompt(state) + bufferRef.current);
    }

    async function run(line: string) {
      readyRef.current = false;
      setBusy(true);
      const result = await execLine(line, state, hooks);
      if (cancelled) return;
      const formatted = formatResult(result);
      if (formatted === "\x1b[2J\x1b[H") {
        term.clear();
      } else if (formatted) {
        term.write(formatted.endsWith("\n") ? formatted : formatted + "\n");
      }
      onMutate();
      bufferRef.current = "";
      histIdx.current = -1;
      writePrompt();
      readyRef.current = true;
      setBusy(false);
      term.focus();
    }
    runRef.current = run;

    async function boot() {
      const lines = bootLines(distro, hostname, restoring);
      for (const line of lines) {
        if (cancelled) return;
        term.writeln(`\x1b[38;2;143;160;155m${line}\x1b[0m`);
        if (!reduce) await delay(40);
      }
      if (cancelled) return;
      term.writeln("");
      try {
        const motd = state.vfs.readFile("/etc/motd");
        for (const l of motd.split("\n")) if (l) term.writeln(l);
      } catch {
        /* no motd */
      }
      term.writeln("Type \x1b[36mhelp\x1b[0m, \x1b[36mneofetch\x1b[0m, or \x1b[36mls\x1b[0m to look around.");
      term.writeln("");
      writePrompt();
      readyRef.current = true;
      term.focus();
    }

    const onData = (data: string) => {
      if (!readyRef.current) return;
      if (data === "\r") {
        term.write("\r\n");
        void run(bufferRef.current);
        return;
      }
      if (data === "\u0003") {
        term.write("^C\r\n");
        bufferRef.current = "";
        writePrompt();
        return;
      }
      if (data === "\u000c") {
        term.clear();
        writePrompt();
        term.write(bufferRef.current);
        return;
      }
      if (data === "\u0015") {
        bufferRef.current = "";
        redrawLine();
        return;
      }
      if (data === "\u007f" || data === "\b") {
        if (!bufferRef.current) return;
        bufferRef.current = bufferRef.current.slice(0, -1);
        term.write("\b \b");
        return;
      }
      if (data === "\t") {
        const next = complete(bufferRef.current, state);
        if (next && next !== bufferRef.current) {
          bufferRef.current = next;
          redrawLine();
        }
        return;
      }
      if (data === "\x1b[A") {
        if (!state.history.length) return;
        const idx = histIdx.current < 0 ? state.history.length - 1 : Math.max(0, histIdx.current - 1);
        histIdx.current = idx;
        bufferRef.current = state.history[idx] ?? "";
        redrawLine();
        return;
      }
      if (data === "\x1b[B") {
        if (histIdx.current < 0) return;
        const idx = histIdx.current + 1;
        if (idx >= state.history.length) {
          histIdx.current = -1;
          bufferRef.current = "";
        } else {
          histIdx.current = idx;
          bufferRef.current = state.history[idx] ?? "";
        }
        redrawLine();
        return;
      }
      if (data.startsWith("\x1b")) return;
      if (data.length && data !== "\u0000") {
        bufferRef.current += data;
        term.write(data);
      }
    };

    const disp = term.onData(onData);
    void boot();

    return () => {
      cancelled = true;
      disp.dispose();
      ro.disconnect();
      term.dispose();
      termRef.current = null;
    };
    // Boot once per box mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusNonce === undefined) return;
    inputRef.current?.focus();
    termRef.current?.focus();
  }, [focusNonce]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const line = cmd;
    setCmd("");
    const term = termRef.current;
    if (term && readyRef.current) {
      if (bufferRef.current) {
        term.write("\r\x1b[K" + prompt(state));
        bufferRef.current = "";
      }
      term.write(line + "\r\n");
    }
    void runRef.current(line);
  }

  function onCmdKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!state.history.length) return;
      const idx = histIdx.current < 0 ? state.history.length - 1 : Math.max(0, histIdx.current - 1);
      histIdx.current = idx;
      setCmd(state.history[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx.current < 0) return;
      const idx = histIdx.current + 1;
      if (idx >= state.history.length) {
        histIdx.current = -1;
        setCmd("");
      } else {
        histIdx.current = idx;
        setCmd(state.history[idx] ?? "");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const next = complete(cmd, state);
      if (next) setCmd(next);
    }
  }

  const promptLabel = `${state.user}@${state.hostname}:${displayWd(state)}$ `;

  return (
    <div className="flex h-full min-h-0 flex-col bg-terminal">
      <form
        onSubmit={onSubmit}
        className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3"
      >
        <label htmlFor="kiln-cmd" className="sr-only">
          Shell command
        </label>
        <span className="hidden shrink-0 font-mono text-[11px] text-sage sm:inline">{promptLabel}</span>
        <input
          id="kiln-cmd"
          ref={inputRef}
          value={cmd}
          disabled={busy}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={onCmdKey}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="ls, neofetch, git clone …"
          className="h-11 min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 shrink-0 px-2 font-mono text-xs text-sage hover:text-foreground disabled:opacity-50"
        >
          Run
        </button>
      </form>
      <div
        ref={hostRef}
        className="kiln-term min-h-0 flex-1 w-full"
        onMouseDown={() => termRef.current?.focus()}
      />
    </div>
  );
}

function displayWd(state: ShellState): string {
  const home = state.env.HOME || `/home/${state.user}`;
  if (state.cwd === home) return "~";
  if (state.cwd.startsWith(home + "/")) return "~" + state.cwd.slice(home.length);
  return state.cwd;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function complete(buffer: string, state: ShellState): string {
  const parts = buffer.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  if (parts.length <= 1) {
    const hits = COMMAND_NAMES().filter((c) => c.startsWith(last));
    if (hits.length === 1) return hits[0]!;
    return buffer;
  }
  try {
    const names = state.vfs
      .list(state.cwd)
      .map((e) => e.name)
      .filter((n) => n.startsWith(last.replace("./", "")));
    if (names.length === 1) {
      parts[parts.length - 1] = names[0]!;
      return parts.join(" ");
    }
  } catch {
    /* ignore */
  }
  return buffer;
}

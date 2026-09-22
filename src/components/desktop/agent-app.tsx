import { useRef, useState, type FormEvent } from "react";
import { chatAgent, type AgentMessage } from "@/lib/agent";
import { execLine, formatResult, type AppId, type ShellHooks, type ShellState } from "@/lib/linux/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const APP_ALIAS: Record<string, AppId> = {
  welcome: "welcome",
  desktop: "welcome",
  gui: "welcome",
  files: "files",
  nautilus: "files",
  editor: "editor",
  gedit: "editor",
  browser: "browser",
  firefox: "browser",
  software: "images",
  images: "images",
  settings: "settings",
  agent: "agent",
  terminal: "term",
  term: "term",
  calculator: "calc",
  calc: "calc",
};

export function AgentApp({
  state,
  hooks,
  onMutate,
}: {
  state: ShellState;
  hooks: ShellHooks;
  onMutate: () => void;
}) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  function listing(): string {
    try {
      const entries = state.vfs.list(state.cwd);
      return entries
        .slice(0, 40)
        .map((e) => `${e.node.t === "d" ? "d" : "f"} ${e.name}`)
        .join("\n");
    } catch {
      return "";
    }
  }

  async function runTool(name: string, argsJson: string): Promise<string> {
    let args: Record<string, string> = {};
    try {
      args = JSON.parse(argsJson) as Record<string, string>;
    } catch {
      return "invalid arguments";
    }
    try {
      if (name === "open_app") {
        const key = (args.app ?? "welcome").toLowerCase();
        const app = APP_ALIAS[key] ?? "welcome";
        hooks.openApp?.(app);
        return `opened ${app} on the desktop`;
      }
      if (name === "open_file") {
        const path = state.vfs.normalize(args.path ?? "", state.cwd, state.env.HOME || `/home/${state.user}`);
        hooks.openFile(path);
        hooks.openApp?.("editor");
        return `opened ${path} in Text Editor`;
      }
      if (name === "run_command") {
        const line = (args.command ?? "").slice(0, 500);
        if (/^\s*(startx|xinit|Xorg|gnome-session|gdm|sddm|weston|sway)\b/i.test(line)) {
          hooks.openApp?.("welcome");
          return "Desktop is already running. Opened the session overview.";
        }
        const result = await execLine(line, state, hooks);
        onMutate();
        const formatted = formatResult(result).replace(/\x1b\[[0-9;]*m/g, "");
        return formatted.slice(0, 6000) || "(no output)";
      }
      if (name === "read_file") {
        const path = state.vfs.normalize(args.path ?? "", state.cwd, state.env.HOME || `/home/${state.user}`);
        return state.vfs.readFile(path).slice(0, 8000);
      }
      if (name === "write_file") {
        const path = state.vfs.normalize(args.path ?? "", state.cwd, state.env.HOME || `/home/${state.user}`);
        const dir = path.split("/").slice(0, -1).join("/") || "/";
        state.vfs.mkdir(dir, true);
        state.vfs.writeFile(path, (args.content ?? "").slice(0, 40_000));
        onMutate();
        return `wrote ${path}`;
      }
    } catch (e) {
      return e instanceof Error ? e.message : "tool failed";
    }
    return "unknown tool";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    setBusy(true);
    const userMsg: AgentMessage = { role: "user", content: text.slice(0, 4000) };
    let next: AgentMessage[] = [...messages, userMsg];
    setMessages(next);
    try {
      for (let round = 0; round < 4; round++) {
        const res = await chatAgent({
          data: {
            messages: next,
            distro: state.distro.pretty,
            cwd: state.cwd,
            listing: listing(),
          },
        });
        if (!res.ok) {
          setError(res.error);
          break;
        }
        next = [...next, res.message];
        setMessages(next);
        const calls = res.message.tool_calls;
        if (!calls?.length) break;
        for (const call of calls) {
          const out = await runTool(call.function.name, call.function.arguments);
          next = [
            ...next,
            { role: "tool", content: out, name: call.function.name, tool_call_id: call.id },
          ];
        }
        setMessages(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent failed");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
      });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="px-1 py-6">
            <p className="font-display text-xl tracking-tight">Kiln Agent</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ask it to open Files, edit a document, or install an image. The desktop is already running.
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          if (m.role === "tool") {
            return (
              <p key={i} className="font-mono text-[11px] text-sage-dim">
                {m.name}: {m.content.slice(0, 180)}
                {m.content.length > 180 ? "…" : ""}
              </p>
            );
          }
          if (m.role === "assistant" && m.tool_calls?.length && !m.content) {
            return (
              <p key={i} className="text-xs text-muted-foreground">
                {m.tool_calls.map((t) => t.function.name).join(" · ")}
              </p>
            );
          }
          if (!m.content) return null;
          return (
            <div
              key={i}
              className={cn(
                "max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user" ? "ml-auto bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              {m.content}
            </div>
          );
        })}
        {busy && <p className="text-xs text-muted-foreground">Working…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-border p-2">
        <label htmlFor="agent-input" className="sr-only">
          Message agent
        </label>
        <input
          id="agent-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="Open Files and summarize README"
          className="h-11 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none"
        />
        <Button type="submit" disabled={busy || !input.trim()} className="h-11">
          Send
        </Button>
      </form>
    </div>
  );
}

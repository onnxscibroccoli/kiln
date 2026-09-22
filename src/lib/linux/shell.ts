import { type Distro } from "./distros";
import { type Vfs, matchGlob } from "./vfs";
import { homeDir } from "./seed";
import { runCommand } from "./commands";
import { ANSI } from "./ansi";

export type AppId =
  | "welcome"
  | "files"
  | "term"
  | "editor"
  | "images"
  | "agent"
  | "settings"
  | "browser"
  | "calc";

export type ShellHooks = {
  openFile: (path: string) => void;
  openApp?: (app: AppId) => void;
  fetchUrl: (url: string) => Promise<{ ok: boolean; status: number; body: string }>;
  cloneRepo: (repo: string) => Promise<{
    ok: boolean;
    name: string;
    files: Record<string, string>;
    error?: string;
  }>;
};

export type ShellState = {
  vfs: Vfs;
  cwd: string;
  env: Record<string, string>;
  history: string[];
  packages: string[];
  user: string;
  hostname: string;
  distro: Distro;
  aliases: Record<string, string>;
  startedAt: number;
};

export type ShellContext = ShellState &
  ShellHooks & {
    stdin: string;
    home: string;
  };

export { ANSI };

export function createState(opts: {
  vfs: Vfs;
  cwd?: string;
  env?: Record<string, string>;
  history?: string[];
  packages?: string[];
  user: string;
  hostname: string;
  distro: Distro;
}): ShellState {
  const home = homeDir(opts.user);
  return {
    vfs: opts.vfs,
    cwd: opts.cwd || home,
    env: {
      HOME: home,
      USER: opts.user,
      LOGNAME: opts.user,
      SHELL: `/bin/${opts.distro.shell}`,
      PATH: "/usr/local/bin:/usr/bin:/bin",
      TERM: "xterm-256color",
      HOSTNAME: opts.hostname,
      PWD: opts.cwd || home,
      EDITOR: "gedit",
      LANG: "en_US.UTF-8",
      GDK_BACKEND: "wayland",
      ...opts.env,
      DISPLAY: opts.env?.DISPLAY || ":0",
      WAYLAND_DISPLAY: opts.env?.WAYLAND_DISPLAY || "wayland-0",
      XDG_SESSION_TYPE: "wayland",
      XDG_CURRENT_DESKTOP: "Kiln",
      DESKTOP_SESSION: opts.env?.DESKTOP_SESSION || "kiln",
    },
    history: opts.history ?? [],
    packages: opts.packages ?? [],
    user: opts.user,
    hostname: opts.hostname,
    distro: opts.distro,
    aliases: { ll: "ls -la", la: "ls -la" },
    startedAt: Date.now(),
  };
}

export function prompt(state: ShellState): string {
  const home = homeDir(state.user);
  let wd = state.cwd;
  if (wd === home) wd = "~";
  else if (wd.startsWith(home + "/")) wd = "~" + wd.slice(home.length);
  const user = `${ANSI.sage}${state.user}${ANSI.reset}`;
  const host = `${ANSI.sage}${state.hostname}${ANSI.reset}`;
  const path = `${ANSI.cyan}${wd}${ANSI.reset}`;
  return `${user}@${host}:${path}$ `;
}

export function tokenize(input: string, env: Record<string, string>): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: "'" | '"' | null = null;
  const push = () => {
    if (cur.length || quote) {
      /* keep */
    }
    if (cur.length) tokens.push(cur);
    cur = "";
  };
  const expand = (name: string) => env[name] ?? "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (quote === "'") {
      if (ch === "'") quote = null;
      else cur += ch;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') {
        quote = null;
        continue;
      }
      if (ch === "\\" && i + 1 < input.length) {
        cur += input[++i];
        continue;
      }
      if (ch === "$") {
        const { name, next } = readVar(input, i + 1);
        cur += expand(name);
        i = next - 1;
        continue;
      }
      cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === "\\" && i + 1 < input.length) {
      cur += input[++i];
      continue;
    }
    if (ch === "$") {
      const { name, next } = readVar(input, i + 1);
      cur += expand(name);
      i = next - 1;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) tokens.push(cur);
      cur = "";
      continue;
    }
    if (ch === "|" || ch === "<") {
      if (cur) tokens.push(cur);
      cur = "";
      tokens.push(ch);
      continue;
    }
    if (ch === ">") {
      if (cur) tokens.push(cur);
      cur = "";
      if (input[i + 1] === ">") {
        tokens.push(">>");
        i++;
      } else tokens.push(">");
      continue;
    }
    cur += ch;
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function readVar(input: string, start: number): { name: string; next: number } {
  if (input[start] === "{") {
    const end = input.indexOf("}", start + 1);
    if (end === -1) return { name: "", next: start };
    return { name: input.slice(start + 1, end), next: end + 1 };
  }
  let i = start;
  while (i < input.length && /[A-Za-z0-9_]/.test(input[i]!)) i++;
  return { name: input.slice(start, i), next: i };
}

function expandGlobs(args: string[], vfs: Vfs, cwd: string, home: string): string[] {
  const out: string[] = [];
  for (const arg of args) {
    if (!/[*?]/.test(arg)) {
      out.push(arg);
      continue;
    }
    const abs = vfs.normalize(arg, cwd, home);
    const lastSlash = abs.lastIndexOf("/");
    const dirPath = lastSlash <= 0 ? "/" : abs.slice(0, lastSlash);
    const glob = abs.slice(lastSlash + 1);
    try {
      const matches = vfs
        .list(dirPath)
        .filter((e) => matchGlob(e.name, glob))
        .map((e) => (dirPath === "/" ? `/${e.name}` : `${dirPath}/${e.name}`));
      if (matches.length) out.push(...matches);
      else out.push(arg);
    } catch {
      out.push(arg);
    }
  }
  return out;
}

export type ExecResult = { stdout: string; stderr: string; code: number };

export async function execLine(
  line: string,
  state: ShellState,
  hooks: ShellHooks,
): Promise<ExecResult> {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return { stdout: "", stderr: "", code: 0 };

  if (state.history[state.history.length - 1] !== trimmed) {
    state.history.push(trimmed);
    if (state.history.length > 500) state.history.shift();
  }

  const aliased = state.aliases[trimmed.split(/\s+/)[0]!]
    ? trimmed.replace(/^\S+/, state.aliases[trimmed.split(/\s+/)[0]!]!)
    : trimmed;

  const tokens = tokenize(aliased, { ...state.env, PWD: state.cwd, HOME: homeDir(state.user) });
  if (!tokens.length) return { stdout: "", stderr: "", code: 0 };

  const segments: string[][] = [];
  let cur: string[] = [];
  for (const t of tokens) {
    if (t === "|") {
      segments.push(cur);
      cur = [];
    } else cur.push(t);
  }
  segments.push(cur);

  let stdin = "";
  let last: ExecResult = { stdout: "", stderr: "", code: 0 };

  for (const seg of segments) {
    const redir = takeRedirects(seg);
    const [cmd, ...rawArgs] = redir.args;
    if (!cmd) continue;
    const args = expandGlobs(rawArgs, state.vfs, state.cwd, homeDir(state.user));
    const ctx: ShellContext = {
      ...state,
      ...hooks,
      stdin,
      home: homeDir(state.user),
    };
    try {
      const out = await runCommand(cmd, args, ctx);
      last = typeof out === "string" ? { stdout: out, stderr: "", code: 0 } : out;
    } catch (err) {
      last = {
        stdout: "",
        stderr: err instanceof Error ? err.message : String(err),
        code: 1,
      };
    }
    if (redir.stdoutTo) {
      const abs = state.vfs.normalize(redir.stdoutTo, state.cwd, homeDir(state.user));
      try {
        if (redir.append && state.vfs.exists(abs)) {
          state.vfs.appendFile(abs, last.stdout + (last.stdout.endsWith("\n") || !last.stdout ? "" : "\n"));
        } else {
          const body = last.stdout + (last.stdout.endsWith("\n") || !last.stdout ? "" : "\n");
          state.vfs.writeFile(abs, body);
        }
        last = { ...last, stdout: "" };
      } catch (err) {
        last = {
          stdout: "",
          stderr: err instanceof Error ? err.message : String(err),
          code: 1,
        };
      }
    }
    stdin = last.stdout;
    if (last.code !== 0 && segments.length > 1) break;
  }

  state.env.PWD = state.cwd;
  return last;
}

function takeRedirects(args: string[]): { args: string[]; stdoutTo: string | null; append: boolean } {
  const out: string[] = [];
  let stdoutTo: string | null = null;
  let append = false;
  for (let i = 0; i < args.length; i++) {
    const t = args[i]!;
    if (t === ">" || t === ">>") {
      stdoutTo = args[i + 1] ?? null;
      append = t === ">>";
      i++;
      continue;
    }
    out.push(t);
  }
  return { args: out, stdoutTo, append };
}

export function formatResult(result: ExecResult): string {
  const parts: string[] = [];
  if (result.stdout) parts.push(result.stdout.endsWith("\n") ? result.stdout : result.stdout + "\n");
  if (result.stderr) {
    const s = result.stderr.endsWith("\n") ? result.stderr : result.stderr + "\n";
    parts.push(`${ANSI.red}${s}${ANSI.reset}`);
  }
  return parts.join("");
}

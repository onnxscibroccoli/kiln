import { type ExecResult, type ShellContext } from "./shell";
import { ANSI } from "./ansi";
import { BASE_PACKAGES, homeDir } from "./seed";
import { matchGlob } from "./vfs";

type Result = ExecResult | string;
type Cmd = (args: string[], ctx: ShellContext) => Result | Promise<Result>;

const ok = (stdout = "", code = 0): ExecResult => ({ stdout, stderr: "", code });
const fail = (stderr: string, code = 1): ExecResult => ({ stdout: "", stderr, code });

const COMMANDS: Record<string, Cmd> = {};

function register(names: string[], fn: Cmd) {
  for (const n of names) COMMANDS[n] = fn;
}

export const COMMAND_NAMES = () => Object.keys(COMMANDS).sort();

export async function runCommand(cmd: string, args: string[], ctx: ShellContext): Promise<Result> {
  const fn = COMMANDS[cmd];
  if (!fn) return fail(`${cmd}: command not found`);
  return fn(args, ctx);
}

function resolve(path: string, ctx: ShellContext): string {
  return ctx.vfs.normalize(path, ctx.cwd, ctx.home);
}

function modeStr(mode: number, isDir: boolean): string {
  const types = isDir ? "d" : "-";
  const rwx = (n: number) =>
    (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-");
  return types + rwx((mode >> 6) & 7) + rwx((mode >> 3) & 7) + rwx(mode & 7);
}

function colorName(name: string, isDir: boolean, executable: boolean): string {
  if (isDir) return `${ANSI.cyan}${name}${ANSI.reset}`;
  if (executable) return `${ANSI.green}${name}${ANSI.reset}`;
  return name;
}

register(["pwd"], (_args, ctx) => ctx.cwd);

register(["cd"], (args, ctx) => {
  const target = args[0] ?? ctx.home;
  const abs = resolve(target, ctx);
  if (!ctx.vfs.exists(abs)) return fail(`cd: ${target}: No such file or directory`);
  if (!ctx.vfs.isDir(abs)) return fail(`cd: ${target}: Not a directory`);
  ctx.cwd = abs;
  return ok();
});

register(["ls", "dir"], (args, ctx) => {
  const flags = new Set<string>();
  const paths: string[] = [];
  for (const a of args) {
    if (a.startsWith("-") && a !== "-") {
      for (const ch of a.slice(1)) flags.add(ch);
    } else paths.push(a);
  }
  const all = flags.has("a") || flags.has("A");
  const long = flags.has("l");
  const targets = paths.length ? paths : ["."];
  const chunks: string[] = [];
  for (const t of targets) {
    const abs = resolve(t, ctx);
    if (!ctx.vfs.exists(abs)) return fail(`ls: cannot access '${t}': No such file or directory`);
    if (ctx.vfs.isFile(abs)) {
      const n = ctx.vfs.get(abs)!;
      chunks.push(long ? `${modeStr(n.m, false)} 1 ${ctx.user} ${ctx.user} ${n.t === "f" ? n.c.length : 0} ${t}` : t);
      continue;
    }
    let entries = ctx.vfs.list(abs);
    if (!all) entries = entries.filter((e) => !e.name.startsWith("."));
    if (long) {
      const lines = entries.map((e) => {
        const size = e.node.t === "f" ? String(e.node.c.length).padStart(6) : "     -";
        const name = colorName(e.name, e.node.t === "d", e.node.t === "f" && (e.node.m & 0o111) !== 0);
        return `${modeStr(e.node.m, e.node.t === "d")} 1 ${ctx.user.padEnd(8)} ${ctx.user.padEnd(8)} ${size} ${name}`;
      });
      chunks.push((targets.length > 1 ? `${t}:\n` : "") + lines.join("\n"));
    } else {
      const names = entries.map((e) =>
        colorName(e.name, e.node.t === "d", e.node.t === "f" && (e.node.m & 0o111) !== 0),
      );
      chunks.push((targets.length > 1 ? `${t}:\n` : "") + names.join("  "));
    }
  }
  return chunks.join("\n");
});

register(["tree"], (args, ctx) => {
  const abs = resolve(args[0] ?? ".", ctx);
  if (!ctx.vfs.exists(abs)) return fail(`tree: ${args[0]}: No such file or directory`);
  const lines = [abs === ctx.cwd ? "." : abs];
  const walk = (base: string, prefix: string) => {
    let entries = ctx.vfs.list(base).filter((e) => !e.name.startsWith("."));
    entries.forEach((e, i) => {
      const last = i === entries.length - 1;
      const branch = last ? "└── " : "├── ";
      const name = colorName(e.name, e.node.t === "d", false);
      lines.push(prefix + branch + name);
      if (e.node.t === "d") {
        walk(base === "/" ? `/${e.name}` : `${base}/${e.name}`, prefix + (last ? "    " : "│   "));
      }
    });
  };
  walk(abs, "");
  return lines.join("\n");
});

register(["cat"], (args, ctx) => {
  if (!args.length) return ctx.stdin || "";
  const parts: string[] = [];
  for (const a of args) {
    if (a === "-") {
      parts.push(ctx.stdin);
      continue;
    }
    const abs = resolve(a, ctx);
    try {
      parts.push(ctx.vfs.readFile(abs));
    } catch (e) {
      return fail(`cat: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return parts.join("");
});

register(["head"], (args, ctx) => {
  let n = 10;
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-n") {
      n = Number(args[++i] ?? 10);
    } else if (/^-(\d+)$/.test(args[i]!)) n = Number(args[i]!.slice(1));
    else files.push(args[i]!);
  }
  const text = files.length ? ctx.vfs.readFile(resolve(files[0]!, ctx)) : ctx.stdin;
  return text.split("\n").slice(0, n).join("\n");
});

register(["tail"], (args, ctx) => {
  let n = 10;
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-n") n = Number(args[++i] ?? 10);
    else if (/^-(\d+)$/.test(args[i]!)) n = Number(args[i]!.slice(1));
    else files.push(args[i]!);
  }
  const text = files.length ? ctx.vfs.readFile(resolve(files[0]!, ctx)) : ctx.stdin;
  const lines = text.split("\n");
  return lines.slice(Math.max(0, lines.length - n)).join("\n");
});

register(["wc"], (args, ctx) => {
  const flags = new Set<string>();
  const files: string[] = [];
  for (const a of args) {
    if (a.startsWith("-") && a !== "-") for (const ch of a.slice(1)) flags.add(ch);
    else files.push(a);
  }
  const text = files.length ? ctx.vfs.readFile(resolve(files[0]!, ctx)) : ctx.stdin;
  const lines = text.split("\n").length - (text.endsWith("\n") || !text ? 1 : 0);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const bytes = text.length;
  if (flags.has("l")) return String(lines);
  if (flags.has("w")) return String(words);
  if (flags.has("c")) return String(bytes);
  return `${lines} ${words} ${bytes}${files[0] ? " " + files[0] : ""}`;
});

register(["echo", "printf"], (args) => {
  return args.join(" ").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
});

register(["touch"], (args, ctx) => {
  if (!args.length) return fail("touch: missing file operand");
  for (const a of args) {
    const abs = resolve(a, ctx);
    if (!ctx.vfs.exists(abs)) ctx.vfs.writeFile(abs, "");
    else if (ctx.vfs.isFile(abs)) {
      const c = ctx.vfs.readFile(abs);
      ctx.vfs.writeFile(abs, c);
    }
  }
  return ok();
});

register(["mkdir"], (args, ctx) => {
  const recursive = args.includes("-p");
  const paths = args.filter((a) => a !== "-p");
  if (!paths.length) return fail("mkdir: missing operand");
  for (const p of paths) ctx.vfs.mkdir(resolve(p, ctx), recursive);
  return ok();
});

register(["rmdir"], (args, ctx) => {
  if (!args.length) return fail("rmdir: missing operand");
  for (const p of args) ctx.vfs.rm(resolve(p, ctx));
  return ok();
});

register(["rm"], (args, ctx) => {
  const recursive = args.includes("-r") || args.includes("-rf") || args.includes("-fr");
  const force = args.includes("-f") || args.includes("-rf") || args.includes("-fr");
  const paths = args.filter((a) => !a.startsWith("-"));
  if (!paths.length) return fail("rm: missing operand");
  for (const p of paths) {
    try {
      ctx.vfs.rm(resolve(p, ctx), { recursive });
    } catch (e) {
      if (!force) return fail(`rm: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return ok();
});

register(["cp"], (args, ctx) => {
  const recursive = args.includes("-r") || args.includes("-R");
  const paths = args.filter((a) => !a.startsWith("-"));
  if (paths.length < 2) return fail("cp: missing destination");
  const dest = paths[paths.length - 1]!;
  const srcs = paths.slice(0, -1);
  for (const s of srcs) ctx.vfs.cp(resolve(s, ctx), resolve(dest, ctx), recursive);
  return ok();
});

register(["mv"], (args, ctx) => {
  if (args.length < 2) return fail("mv: missing destination");
  ctx.vfs.mv(resolve(args[0]!, ctx), resolve(args[1]!, ctx));
  return ok();
});

register(["grep"], (args, ctx) => {
  const flags = new Set<string>();
  const rest: string[] = [];
  for (const a of args) {
    if (a.startsWith("-") && a.length <= 3) for (const ch of a.slice(1)) flags.add(ch);
    else rest.push(a);
  }
  const pattern = rest[0];
  if (!pattern) return fail("grep: missing pattern");
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.has("i") ? "i" : "");
  } catch {
    return fail("grep: invalid pattern");
  }
  const invert = flags.has("v");
  const files = rest.slice(1);
  const texts = files.length
    ? files.map((f) => ({ name: f, text: ctx.vfs.readFile(resolve(f, ctx)) }))
    : [{ name: "", text: ctx.stdin }];
  const lines: string[] = [];
  for (const { name, text } of texts) {
    for (const line of text.split("\n")) {
      const hit = re.test(line);
      if (hit !== invert) lines.push(files.length > 1 && name ? `${name}:${line}` : line);
    }
  }
  return lines.join("\n");
});

register(["find"], (args, ctx) => {
  const start = resolve(args[0] && !args[0].startsWith("-") ? args[0] : ".", ctx);
  let nameGlob: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-name") nameGlob = args[i + 1] ?? null;
  }
  const out: string[] = [start];
  const walk = (base: string) => {
    if (!ctx.vfs.isDir(base)) return;
    for (const e of ctx.vfs.list(base)) {
      const p = base === "/" ? `/${e.name}` : `${base}/${e.name}`;
      if (!nameGlob || matchGlob(e.name, nameGlob)) out.push(p);
      if (e.node.t === "d") walk(p);
    }
  };
  walk(start);
  return (nameGlob ? out.filter((p) => matchGlob(p.split("/").pop() ?? "", nameGlob!)) : out).join("\n");
});

register(["sort"], (args, ctx) => {
  const text = args[0] ? ctx.vfs.readFile(resolve(args[0], ctx)) : ctx.stdin;
  const uniq = args.includes("-u");
  let lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines = lines.slice(0, -1);
  lines.sort();
  if (uniq) lines = [...new Set(lines)];
  return lines.join("\n");
});

register(["uniq"], (args, ctx) => {
  const text = args[0] ? ctx.vfs.readFile(resolve(args[0], ctx)) : ctx.stdin;
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (out[out.length - 1] !== line) out.push(line);
  }
  return out.join("\n");
});

register(["cut"], (args, ctx) => {
  let delim = "\t";
  let fields = [1];
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-d") delim = args[++i] ?? "\t";
    else if (args[i] === "-f") fields = (args[++i] ?? "1").split(",").map(Number);
    else if (!args[i]!.startsWith("-")) files.push(args[i]!);
  }
  const text = files[0] ? ctx.vfs.readFile(resolve(files[0], ctx)) : ctx.stdin;
  return text
    .split("\n")
    .map((line) => {
      const cols = line.split(delim);
      return fields.map((f) => cols[f - 1] ?? "").join(delim);
    })
    .join("\n");
});

register(["tr"], (args, ctx) => {
  if (args.length < 2) return fail("tr: missing operand");
  const [from, to] = args;
  const map = new Map<string, string>();
  for (let i = 0; i < from!.length; i++) map.set(from![i]!, to![Math.min(i, to!.length - 1)] ?? "");
  return ctx.stdin
    .split("")
    .map((ch) => map.get(ch) ?? ch)
    .join("");
});

register(["basename"], (args) => args[0]?.split("/").filter(Boolean).pop() ?? "");
register(["dirname"], (args) => {
  const p = args[0] ?? "";
  const i = p.lastIndexOf("/");
  if (i <= 0) return p.startsWith("/") ? "/" : ".";
  return p.slice(0, i) || "/";
});

register(["date"], () => new Date().toString());
register(["whoami"], (_a, ctx) => ctx.user);
register(["id"], (_a, ctx) => `uid=1000(${ctx.user}) gid=1000(${ctx.user}) groups=1000(${ctx.user})`);
register(["hostname"], (args, ctx) => {
  if (args[0] && (args[0] === "-f" || !args[0].startsWith("-"))) {
    /* read-only */
  }
  return ctx.hostname;
});
register(["uname"], (args, ctx) => {
  const all = args.includes("-a");
  const k = ctx.distro.kernel;
  if (all || args.length === 0) {
    if (all)
      return `Linux ${ctx.hostname} ${k} #1 SMP PREEMPT ${new Date().toDateString()} x86_64 ${ctx.distro.libc} GNU/Linux`;
    return "Linux";
  }
  if (args.includes("-s")) return "Linux";
  if (args.includes("-n")) return ctx.hostname;
  if (args.includes("-r")) return k;
  if (args.includes("-m")) return "x86_64";
  return "Linux";
});

register(["env", "printenv"], (args, ctx) => {
  if (args[0]) return ctx.env[args[0]] ?? "";
  return Object.entries(ctx.env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
});

register(["export"], (args, ctx) => {
  if (!args.length) {
    return Object.entries(ctx.env)
      .map(([k, v]) => `export ${k}="${v}"`)
      .join("\n");
  }
  for (const a of args) {
    const eq = a.indexOf("=");
    if (eq === -1) continue;
    ctx.env[a.slice(0, eq)] = a.slice(eq + 1);
  }
  return ok();
});

register(["unset"], (args, ctx) => {
  for (const a of args) delete ctx.env[a];
  return ok();
});

register(["history"], (_a, ctx) =>
  ctx.history.map((l, i) => `  ${String(i + 1).padStart(4)}  ${l}`).join("\n"),
);

register(["clear"], () => "\x1b[2J\x1b[H");
register(["true"], () => ok());
register(["false"], () => fail("", 1));
register(["sleep"], async (args) => {
  const s = Math.min(Number(args[0] ?? 0), 3);
  await new Promise((r) => setTimeout(r, s * 1000));
  return ok();
});

register(["which", "type"], (args) => {
  const c = args[0];
  if (!c) return fail("missing command");
  if (COMMANDS[c]) return `/usr/bin/${c}`;
  return fail(`${c} not found`);
});

register(["chmod"], (args, ctx) => {
  if (args.length < 2) return fail("chmod: missing operand");
  const abs = resolve(args[1]!, ctx);
  const n = ctx.vfs.get(abs);
  if (!n) return fail(`chmod: ${args[1]}: No such file`);
  const mode = args[0] === "+x" || args[0] === "u+x" ? n.m | 0o111 : parseInt(args[0]!, 8) || n.m;
  n.m = mode;
  return ok();
});

register(["stat", "file"], (args, ctx) => {
  if (!args[0]) return fail("missing operand");
  const abs = resolve(args[0], ctx);
  const n = ctx.vfs.get(abs);
  if (!n) return fail(`${args[0]}: No such file`);
  if (n.t === "d") return `${args[0]}: directory`;
  return `${args[0]}: ASCII text, ${n.c.length} bytes`;
});

register(["du"], (args, ctx) => {
  const abs = resolve(args.find((a) => !a.startsWith("-")) ?? ".", ctx);
  const files = ctx.vfs.allFiles(abs);
  const bytes = files.reduce((s, f) => s + f.content.length, 0);
  const kb = Math.max(1, Math.round(bytes / 1024));
  return `${kb}\t${args.find((a) => !a.startsWith("-")) ?? "."}`;
});

register(["df"], () =>
  [
    "Filesystem      Size  Used Avail Use% Mounted on",
    "kiln-persist    2.0G   48M  1.9G   3% /",
    "tmpfs           256M    0  256M   0% /tmp",
  ].join("\n"),
);

register(["free"], () =>
  [
    "               total        used        free      shared  buff/cache   available",
    "Mem:         2048000      214000     1424000           0      410000     1680000",
    "Swap:              0           0           0",
  ].join("\n"),
);

register(["uptime"], (_a, ctx) => {
  const sec = Math.round((Date.now() - ctx.startedAt) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return ` ${new Date().toTimeString().slice(0, 8)} up ${h}:${String(m).padStart(2, "0")},  1 user,  load average: 0.04, 0.03, 0.01`;
});

register(["ps"], (_a, ctx) =>
  [
    "  PID TTY          TIME CMD",
    `    1 pts/0    00:00:00 ${ctx.distro.shell}`,
    "   12 pts/0    00:00:00 kiln-fsd",
    "   18 pts/0    00:00:00 kiln-init",
    `  104 pts/0    00:00:00 ps`,
  ].join("\n"),
);

register(["top", "htop"], (_a, ctx) =>
  [
    `top - ${new Date().toTimeString().slice(0, 8)} up 0:02,  1 user,  load average: 0.04`,
    "Tasks: 4 total, 1 running, 3 sleeping",
    "%Cpu(s):  1.2 us,  0.4 sy,  0.0 ni, 98.4 id",
    "MiB Mem :   2000.0 total,   1390.6 free,    209.0 used",
    "",
    "  PID USER      PR  NI    VIRT    RES  %CPU %MEM COMMAND",
    `    1 ${ctx.user.padEnd(8)}  20   0  124000   4200   0.1  0.2 ${ctx.distro.shell}`,
    `   12 ${ctx.user.padEnd(8)}  20   0   18000   2100   0.0  0.1 kiln-fsd`,
    `   18 root      20   0   12000   1600   0.0  0.1 kiln-init`,
  ].join("\n"),
);

register(["neofetch", "fastfetch"], (_a, ctx) => {
  const logo = [
    "      ####            ",
    "     ##  ##   kiln    ",
    "     ##  ##           ",
    "     ##  ##   ####    ",
    "     ##  ##  ##  ##   ",
    "     ##  ##  ##  ##   ",
    "      ####    ####    ",
  ];
  const info = [
    `${ANSI.sage}${ctx.user}${ANSI.reset}@${ANSI.sage}${ctx.hostname}${ANSI.reset}`,
    "---------------------",
    `OS: ${ctx.distro.pretty}`,
    `Host: Kiln workstation`,
    `Kernel: ${ctx.distro.kernel}`,
    `Shell: ${ctx.distro.shell}`,
    `CPU: Kiln vCPU (x86_64)`,
    `Memory: 209MiB / 2000MiB`,
    `Disk: kiln-persist 2G`,
    `Packages: ${ctx.packages.length} (kiln)`,
  ];
  const rows = Math.max(logo.length, info.length);
  const lines: string[] = [];
  for (let i = 0; i < rows; i++) {
    const l = `${ANSI.sage}${logo[i] ?? "                      "}${ANSI.reset}`;
    lines.push(l + (info[i] ?? ""));
  }
  return lines.join("\n");
});

register(["help"], () =>
  [
    "Kiln shell — persistent Linux userspace",
    "",
    "files     ls  cd  pwd  cat  mkdir  rm  cp  mv  touch  tree  find",
    "text      grep  head  tail  wc  sort  echo  sed-like pipes",
    "system    uname  neofetch  ps  top  df  free  env  whoami  date",
    "dev       git  node  npm  vim  nano  code  curl",
    "packages  apk  apt  apt-get  dpkg",
    "",
    "Open files in the editor:  code README.md",
    "Clone a public GitHub repo:  git clone https://github.com/owner/repo",
    "Pipes and redirects work:    ls | grep js    echo hi > notes.txt",
  ].join("\n"),
);

register(["man"], (args) => {
  const topic = args[0] ?? "kiln";
  return `Manual page for ${topic}\n\nThis is the Kiln userspace. Type \`help\` for the command map.\n`;
});

register(["exit", "logout", "shutdown", "reboot"], () =>
  fail("session stays attached — close the tab or stop the box from the dashboard", 0),
);

register(["sudo"], (args, ctx) => runCommand(args[0] ?? "true", args.slice(1), ctx));
register(["su"], (_a, ctx) => `already ${ctx.user}`);
register(["passwd"], () => "passwd: password unchanged (identity is your Kiln account)");

register(["vim", "vi", "nano", "code", "ed"], (args, ctx) => {
  const target = args[0] ?? "untitled.txt";
  const abs = resolve(target, ctx);
  if (!ctx.vfs.exists(abs)) ctx.vfs.writeFile(abs, "");
  if (ctx.vfs.isDir(abs)) return fail(`${target}: Is a directory`);
  ctx.openFile(abs);
  ctx.openApp?.("editor");
  return `opening ${abs} in editor`;
});

register(["nautilus", "nemo", "thunar", "files", "open"], (args, ctx) => {
  if (args[0]) {
    const abs = resolve(args[0], ctx);
    if (ctx.vfs.isFile(abs)) {
      ctx.openFile(abs);
      ctx.openApp?.("editor");
      return `opening ${abs}`;
    }
    if (ctx.vfs.isDir(abs)) ctx.cwd = abs;
  }
  ctx.openApp?.("files");
  return "opening files";
});

register(["gnome-terminal", "konsole", "xterm", "terminal"], (_a, ctx) => {
  ctx.openApp?.("term");
  return "opening terminal";
});

register(["start", "gtk-launch"], (args, ctx) => {
  const name = (args[0] ?? "").toLowerCase();
  const map: Record<string, "files" | "term" | "editor" | "images" | "agent" | "settings"> = {
    files: "files",
    nautilus: "files",
    terminal: "term",
    "gnome-terminal": "term",
    editor: "editor",
    code: "editor",
    software: "images",
    images: "images",
    "gnome-software": "images",
    agent: "agent",
    "kiln-agent": "agent",
    settings: "settings",
    "gnome-control-center": "settings",
  };
  const app = map[name];
  if (!app) return fail("start: try files, terminal, editor, software, agent, settings");
  ctx.openApp?.(app);
  return `starting ${app}`;
});

register(["node"], (args, ctx) => {
  if (args[0] === "-v" || args[0] === "--version") return "v20.11.0";
  if (args[0] === "-e" || args[0] === "--eval") {
    return runJs(args[1] ?? "", "eval", ctx);
  }
  if (!args[0]) return fail("Usage: node <file.js> | node -e 'code'");
  const abs = resolve(args[0], ctx);
  return runJs(ctx.vfs.readFile(abs), abs, ctx);
});

register(["npm"], (args) => {
  const sub = args[0] ?? "help";
  if (sub === "-v" || sub === "--version") return "10.2.4";
  if (sub === "init") return "wrote package.json (edit it in the tree)";
  if (sub === "install" || sub === "i")
    return `added ${args[1] ?? "dependencies"} in 0.4s (kiln: packages are virtual)`;
  if (sub === "run") return fail("npm run: script runner is not wired; use `node file.js`");
  return `npm ${sub}: use node to run scripts in this box`;
});

register(["python", "python3"], (args) => {
  if (args[0] === "-V" || args[0] === "--version") return "Python 3.12.3";
  if (args[0] === "-c") return runPythonish(args[1] ?? "");
  if (args[0]) return fail("python: full runtime is not in this image — try `node` or `python3 -c 'print(1+1)'`");
  return fail("Python 3.12.3\n(kiln: interactive REPL is not attached; use python3 -c 'print(...)')");
});

register(["curl", "wget"], async (args, ctx) => {
  const url = args.find((a) => a.startsWith("http://") || a.startsWith("https://"));
  if (!url) return fail("curl: no URL");
  const res = await ctx.fetchUrl(url);
  if (!res.ok) return fail(`curl: HTTP ${res.status}`);
  const outIdx = args.indexOf("-o");
  if (outIdx !== -1 && args[outIdx + 1]) {
    ctx.vfs.writeFile(resolve(args[outIdx + 1]!, ctx), res.body);
    return ok(`saved ${res.body.length} bytes`);
  }
  return res.body;
});

register(["ping"], (args) => {
  const host = args[0] ?? "10.0.0.1";
  return [
    `PING ${host} (10.0.0.1): 56 data bytes`,
    `64 bytes from 10.0.0.1: seq=0 ttl=64 time=0.4 ms`,
    `64 bytes from 10.0.0.1: seq=1 ttl=64 time=0.3 ms`,
    `--- ${host} ping statistics ---`,
    `2 packets transmitted, 2 received, 0% packet loss`,
  ].join("\n");
});

register(["ssh"], (args) => `ssh: connection to ${args[0] ?? "host"} refused (no outbound SSH from Kiln)`);

register(["apk", "apt", "apt-get", "dpkg", "dnf", "yum", "pacman", "zypper", "xbps-install", "nix-env", "emerge"], (args, ctx) => pkgCmd(args, ctx));

register(["git"], async (args, ctx) => gitCmd(args, ctx));

register(["alias"], (args, ctx) => {
  if (!args.length)
    return Object.entries(ctx.aliases)
      .map(([k, v]) => `alias ${k}='${v}'`)
      .join("\n");
  for (const a of args) {
    const eq = a.indexOf("=");
    if (eq === -1) continue;
    ctx.aliases[a.slice(0, eq)] = a.slice(eq + 1).replace(/^['"]|['"]$/g, "");
  }
  return ok();
});

register(["source", "."], async (args, ctx) => {
  if (!args[0]) return fail("source: filename");
  const body = ctx.vfs.readFile(resolve(args[0], ctx));
  const { execLine } = await import("./shell");
  for (const line of body.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    await execLine(line, ctx, ctx);
  }
  return ok();
});

register(["cowsay"], (args) => {
  const msg = args.join(" ") || "moolin";
  const bar = "-".repeat(msg.length + 2);
  return ` ${bar}\n< ${msg} >\n ${bar}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`;
});

register(["figlet"], (args) => {
  const msg = (args.join(" ") || "kiln").slice(0, 16).toUpperCase();
  return msg
    .split("")
    .map((ch) => ch)
    .join(" ")
    .concat("\n")
    .repeat(1)
    .concat(msg);
});

register(["sl"], () => "          (  )  (@@)  (  )\n       (------kiln------>");

register(["cal"], () => {
  const d = new Date();
  return d.toLocaleString("en", { month: "long", year: "numeric" }) + "\n" + "Su Mo Tu We Th Fr Sa\n";
});

function pkgCmd(args: string[], ctx: ShellContext): Result {
  const sub = args[0] ?? "help";
  const rest = args.slice(1).filter((a) => !a.startsWith("-") || a === "-S" || a === "-R" || a === "-Q");
  const names = rest.filter((a) => !a.startsWith("-"));
  const bin = ctx.distro.pkgBin;
  const isInstall =
    sub === "add" ||
    sub === "install" ||
    sub === "i" ||
    sub === "-S" ||
    sub === "-Sy" ||
    sub === "-Syy" ||
    sub === "in" ||
    (sub === "-i" && names.length > 0);
  const isRemove = sub === "del" || sub === "remove" || sub === "uninstall" || sub === "-R" || sub === "rm" || sub === "un";
  const isUpdate =
    sub === "update" ||
    sub === "-Syu" ||
    sub === "-Syyu" ||
    sub === "dup" ||
    sub === "upgrade" ||
    (sub === "get" && args[1] === "update");
  const isList = sub === "-l" || sub === "list" || sub === "-Q" || sub === "--installed" || sub === "query" || args.includes("-l");
  if (isUpdate) return `Hit kiln-persist: in-memory package index [${ctx.distro.pretty}]\nAll packages already up to date.`;
  if (sub === "search") {
    const q = names[0] ?? "";
    const all = [...new Set([...BASE_PACKAGES, "cowsay", "figlet", "htop", "tmux", "ripgrep", "fd"])];
    return all.filter((p) => p.includes(q)).join("\n");
  }
  if (isInstall) {
    if (!names.length) return fail(`${bin}: no package specified`);
    const added: string[] = [];
    for (const p of names) {
      if (!ctx.packages.includes(p)) {
        ctx.packages.push(p);
        added.push(p);
      }
    }
    ctx.vfs.writeFile("/var/lib/kiln/packages.json", JSON.stringify(ctx.packages) + "\n");
    if (!added.length) return `${names.join(" ")} is already installed`;
    return `(${bin}) installing ${added.join(", ")}\nOK: ${added.length} package(s) installed`;
  }
  if (isRemove) {
    ctx.packages = ctx.packages.filter((p) => !names.includes(p));
    ctx.vfs.writeFile("/var/lib/kiln/packages.json", JSON.stringify(ctx.packages) + "\n");
    return `removed ${names.join(", ")}`;
  }
  if (isList) return ctx.packages.join("\n");
  const inst = ctx.distro.pkg === "apk" ? "add" : ctx.distro.pkg === "pacman" ? "-S" : "install";
  return `${bin}: try \`${bin} update\`, \`${bin} ${inst} cowsay\`, \`${bin} list\``;
}

function gitDir(ctx: ShellContext): string | null {
  let cur = ctx.cwd;
  while (true) {
    if (ctx.vfs.isDir(`${cur === "/" ? "" : cur}/.git`)) return `${cur === "/" ? "" : cur}/.git`;
    if (cur === "/") return null;
    cur = cur.split("/").slice(0, -1).join("/") || "/";
  }
}

function repoRoot(ctx: ShellContext): string {
  const g = gitDir(ctx);
  if (!g) return ctx.cwd;
  return g.endsWith("/.git") ? g.slice(0, -5) || "/" : ctx.cwd;
}

function gitMeta(ctx: ShellContext) {
  const g = gitDir(ctx);
  if (!g) return null;
  const raw = ctx.vfs.exists(`${g}/kiln.json`) ? ctx.vfs.readFile(`${g}/kiln.json`) : "{}";
  try {
    return { git: g, data: JSON.parse(raw) as GitStore };
  } catch {
    return { git: g, data: emptyGit() };
  }
}

type GitStore = {
  branch: string;
  staged: string[];
  commits: { hash: string; message: string; author: string; at: number; files: Record<string, string> }[];
};

function emptyGit(): GitStore {
  return { branch: "main", staged: [], commits: [] };
}

function saveGit(ctx: ShellContext, git: string, data: GitStore) {
  ctx.vfs.writeFile(`${git}/kiln.json`, JSON.stringify(data));
  ctx.vfs.writeFile(`${git}/HEAD`, `ref: refs/heads/${data.branch}\n`);
}

function shortHash(): string {
  return Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 6);
}

async function gitCmd(args: string[], ctx: ShellContext): Promise<Result> {
  const sub = args[0] ?? "help";
  if (sub === "--version") return "git version 2.43.0";
  if (sub === "help" || sub === "--help")
    return "usage: git init | status | add | commit | log | diff | clone <url> | branch";

  if (sub === "clone") {
    const url = args[1];
    if (!url) return fail("git clone: missing repo");
    const res = await ctx.cloneRepo(url);
    if (!res.ok) return fail(`git clone: ${res.error ?? "failed"}`);
    const dest = resolve(res.name, ctx);
    ctx.vfs.mkdir(dest, true);
    for (const [rel, content] of Object.entries(res.files)) {
      const path = `${dest}/${rel}`;
      const dir = path.split("/").slice(0, -1).join("/") || dest;
      ctx.vfs.mkdir(dir, true);
      ctx.vfs.writeFile(path, content);
    }
    ctx.vfs.mkdir(`${dest}/.git`, true);
    saveGit(ctx, `${dest}/.git`, emptyGit());
    return `Cloning into '${res.name}'...\nremote: enumerating objects\nReceiving files: ${Object.keys(res.files).length}\n done.`;
  }

  if (sub === "init") {
    const dest = args[1] ? resolve(args[1], ctx) : ctx.cwd;
    ctx.vfs.mkdir(dest, true);
    ctx.vfs.mkdir(`${dest}/.git`, true);
    saveGit(ctx, `${dest}/.git`, emptyGit());
    return `Initialized empty Git repository in ${dest}/.git/`;
  }

  const meta = gitMeta(ctx);
  if (!meta) return fail("fatal: not a git repository (run git init)");

  if (sub === "status") {
    const root = repoRoot(ctx);
    const files = ctx.vfs
      .allFiles(root)
      .map((f) => f.path.slice(root.length + 1))
      .filter((p) => p && !p.startsWith(".git/"));
    const last = meta.data.commits[0];
    const lastFiles = last?.files ?? {};
    const staged = meta.data.staged;
    const changed = files.filter((p) => {
      const abs = `${root}/${p}`;
      const cur = ctx.vfs.isFile(abs) ? ctx.vfs.readFile(abs) : "";
      return lastFiles[p] !== cur && !staged.includes(p);
    });
    const untracked = files.filter((p) => lastFiles[p] === undefined && !staged.includes(p) && !changed.includes(p));
    const lines = [`On branch ${meta.data.branch}`, ""];
    if (staged.length) {
      lines.push("Changes to be committed:");
      staged.forEach((p) => lines.push(`\t${ANSI.green}new file:   ${p}${ANSI.reset}`));
      lines.push("");
    }
    if (changed.length) {
      lines.push("Changes not staged for commit:");
      changed.forEach((p) => lines.push(`\t${ANSI.red}modified:   ${p}${ANSI.reset}`));
      lines.push("");
    }
    if (untracked.length) {
      lines.push("Untracked files:");
      untracked.forEach((p) => lines.push(`\t${ANSI.red}${p}${ANSI.reset}`));
    }
    if (!staged.length && !changed.length && !untracked.length) lines.push("nothing to commit, working tree clean");
    return lines.join("\n");
  }

  if (sub === "add") {
    const root = repoRoot(ctx);
    const paths = args.slice(1);
    if (!paths.length) return fail("git add: missing path");
    const all = ctx.vfs
      .allFiles(root)
      .map((f) => f.path.slice(root.length + 1))
      .filter((p) => p && !p.startsWith(".git/"));
    for (const p of paths) {
      if (p === "." || p === "-A") {
        for (const f of all) if (!meta.data.staged.includes(f)) meta.data.staged.push(f);
      } else {
        const rel = p.replace(/^\.\//, "");
        if (!meta.data.staged.includes(rel)) meta.data.staged.push(rel);
      }
    }
    saveGit(ctx, meta.git, meta.data);
    return ok();
  }

  if (sub === "commit") {
    const mIdx = args.indexOf("-m");
    const message = mIdx !== -1 ? args[mIdx + 1] : "update";
    if (!meta.data.staged.length) return fail("nothing to commit");
    const root = repoRoot(ctx);
    const files: Record<string, string> = { ...(meta.data.commits[0]?.files ?? {}) };
    for (const p of meta.data.staged) {
      const abs = `${root}/${p}`;
      if (ctx.vfs.isFile(abs)) files[p] = ctx.vfs.readFile(abs);
    }
    const hash = shortHash();
    meta.data.commits.unshift({
      hash,
      message: message ?? "update",
      author: ctx.user,
      at: Date.now(),
      files,
    });
    const n = meta.data.staged.length;
    meta.data.staged = [];
    saveGit(ctx, meta.git, meta.data);
    return `[${meta.data.branch} ${hash}] ${message}\n ${n} file(s) changed`;
  }

  if (sub === "log") {
    if (!meta.data.commits.length) return fail("fatal: your current branch does not have any commits yet");
    return meta.data.commits
      .map(
        (c) =>
          `${ANSI.yellow}commit ${c.hash}${ANSI.reset}\nAuthor: ${c.author}\nDate:   ${new Date(c.at).toUTCString()}\n\n    ${c.message}\n`,
      )
      .join("\n");
  }

  if (sub === "branch") return `* ${meta.data.branch}`;
  if (sub === "diff") return fail("git diff: use the editor to inspect files (unified diff not attached)");
  if (sub === "remote") return ok();
  if (sub === "config") return ok();
  if (sub === "checkout") return fail("git checkout: single-branch kiln repo");

  return fail(`git: '${sub}' is not a kiln git command. See git help`);
}

function runJs(source: string, filename: string, ctx: ShellContext): Result {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...a: unknown[]) => logs.push(a.map(stringify).join(" ")),
    info: (...a: unknown[]) => logs.push(a.map(stringify).join(" ")),
    warn: (...a: unknown[]) => logs.push(a.map(stringify).join(" ")),
    error: (...a: unknown[]) => logs.push(a.map(stringify).join(" ")),
  };
  const fakeProcess = {
    argv: ["node", filename],
    env: ctx.env,
    cwd: () => ctx.cwd,
    version: "v20.11.0",
    exit: () => undefined,
  };
  try {
    const fn = new Function("console", "process", "module", "exports", "__filename", "__dirname", source);
    const module = { exports: {} as Record<string, unknown> };
    fn(fakeConsole, fakeProcess, module, module.exports, filename, filename.split("/").slice(0, -1).join("/") || "/");
    return logs.join("\n");
  } catch (e) {
    return fail(e instanceof Error ? e.stack ?? e.message : String(e));
  }
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function runPythonish(code: string): Result {
  const prints: string[] = [];
  const printRe = /print\((.*)\)/g;
  let m: RegExpExecArray | null;
  const src = code;
  try {
    while ((m = printRe.exec(src))) {
      const expr = m[1]!;
      if (/^(['"]).*\1$/.test(expr.trim())) prints.push(expr.trim().slice(1, -1));
      else prints.push(String(Function(`"use strict"; return (${expr.replace(/\/\//g, "/")});`)()));
    }
    if (!prints.length && /[\d+\-*/() ]+/.test(src)) {
      prints.push(String(Function(`"use strict"; return (${src});`)()));
    }
    return prints.join("\n");
  } catch (e) {
    return fail(`PythonError: ${e instanceof Error ? e.message : String(e)}`);
  }
}

register(["sed"], (args, ctx) => {
  const expr = args.find((a) => a.startsWith("s/"));
  const file = args.find((a) => !a.startsWith("-") && !a.startsWith("s/"));
  const text = file ? ctx.vfs.readFile(resolve(file, ctx)) : ctx.stdin;
  if (!expr) return text;
  const parts = expr.split("/");
  if (parts.length < 3) return text;
  const flags = parts[3] ?? "";
  try {
    const re = new RegExp(parts[1]!, flags.includes("g") ? "g" : "");
    return text.replace(re, parts[2] ?? "");
  } catch {
    return fail("sed: invalid expression");
  }
});

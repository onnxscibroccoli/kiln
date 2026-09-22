export type FileNode = { t: "f"; c: string; m: number; at: number };
export type DirNode = { t: "d"; k: Record<string, FsNode>; m: number; at: number };
export type FsNode = FileNode | DirNode;
export type DirEntry = { name: string; node: FsNode };

const now = () => Date.now();

export function file(content = "", mode = 0o644): FileNode {
  return { t: "f", c: content, m: mode, at: now() };
}

export function dir(children: Record<string, FsNode> = {}, mode = 0o755): DirNode {
  return { t: "d", k: children, m: mode, at: now() };
}

export class Vfs {
  root: DirNode;

  constructor(root?: DirNode) {
    this.root = root ?? dir();
  }

  static fromJSON(raw: string | DirNode): Vfs {
    if (typeof raw === "string") {
      try {
        return new Vfs(JSON.parse(raw) as DirNode);
      } catch {
        return new Vfs(dir());
      }
    }
    return new Vfs(raw);
  }

  toJSON(): string {
    return JSON.stringify(this.root);
  }

  clone(): Vfs {
    return Vfs.fromJSON(this.toJSON());
  }

  normalize(input: string, cwd: string, home: string): string {
    let path = input.trim() || ".";
    if (path === "~") path = home;
    else if (path.startsWith("~/")) path = `${home}/${path.slice(2)}`;
    else if (path === "-") path = cwd;
    const abs = path.startsWith("/") ? path : `${cwd}/${path}`;
    const parts: string[] = [];
    for (const part of abs.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") parts.pop();
      else parts.push(part);
    }
    return "/" + parts.join("/");
  }

  walk(abs: string): { parent: DirNode | null; name: string; node: FsNode | null } {
    if (abs === "/") return { parent: null, name: "", node: this.root };
    const parts = abs.split("/").filter(Boolean);
    let parent: DirNode = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = parent.k[parts[i]!];
      if (!next || next.t !== "d") return { parent: null, name: parts[parts.length - 1]!, node: null };
      parent = next;
    }
    const name = parts[parts.length - 1]!;
    return { parent, name, node: parent.k[name] ?? null };
  }

  get(abs: string): FsNode | null {
    return this.walk(abs).node;
  }

  exists(abs: string): boolean {
    return this.get(abs) !== null;
  }

  isDir(abs: string): boolean {
    return this.get(abs)?.t === "d";
  }

  isFile(abs: string): boolean {
    return this.get(abs)?.t === "f";
  }

  readFile(abs: string): string {
    const n = this.get(abs);
    if (!n) throw new Error(`${abs}: No such file or directory`);
    if (n.t !== "f") throw new Error(`${abs}: Is a directory`);
    return n.c;
  }

  writeFile(abs: string, content: string, mode?: number): void {
    if (abs === "/") throw new Error("cannot write /");
    const { parent, name, node } = this.walk(abs);
    if (!parent) throw new Error(`${abs}: No such file or directory`);
    if (node && node.t === "d") throw new Error(`${abs}: Is a directory`);
    parent.k[name] = file(content, mode ?? (node && node.t === "f" ? node.m : 0o644));
  }

  appendFile(abs: string, content: string): void {
    if (this.exists(abs)) this.writeFile(abs, this.readFile(abs) + content);
    else this.writeFile(abs, content);
  }

  mkdir(abs: string, recursive = false): void {
    if (abs === "/") return;
    const parts = abs.split("/").filter(Boolean);
    let cur: DirNode = this.root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]!;
      const existing = cur.k[name];
      const isLast = i === parts.length - 1;
      if (!existing) {
        if (!recursive && !isLast) throw new Error(`/${parts.slice(0, i).join("/")}: No such file or directory`);
        const created = dir();
        cur.k[name] = created;
        cur = created;
        continue;
      }
      if (existing.t !== "d") throw new Error(`/${parts.slice(0, i + 1).join("/")}: Not a directory`);
      if (isLast && !recursive) throw new Error(`${abs}: File exists`);
      cur = existing;
    }
  }

  rm(abs: string, opts: { recursive?: boolean } = {}): void {
    if (abs === "/") throw new Error("cannot remove /");
    const { parent, name, node } = this.walk(abs);
    if (!parent || !node) throw new Error(`${abs}: No such file or directory`);
    if (node.t === "d" && !opts.recursive) {
      if (Object.keys(node.k).length) throw new Error(`${abs}: Directory not empty`);
    }
    delete parent.k[name];
  }

  mv(from: string, to: string): void {
    const src = this.walk(from);
    if (!src.parent || !src.node) throw new Error(`${from}: No such file or directory`);
    let destAbs = to;
    const destNode = this.get(to);
    if (destNode?.t === "d") destAbs = `${to === "/" ? "" : to}/${src.name}`;
    const dest = this.walk(destAbs);
    if (!dest.parent) throw new Error(`${to}: No such file or directory`);
    dest.parent.k[dest.name] = src.node;
    delete src.parent.k[src.name];
  }

  cp(from: string, to: string, recursive = false): void {
    const node = this.get(from);
    if (!node) throw new Error(`${from}: No such file or directory`);
    if (node.t === "d" && !recursive) throw new Error(`${from}: Is a directory`);
    let destAbs = to;
    const destNode = this.get(to);
    const name = from.split("/").filter(Boolean).pop()!;
    if (destNode?.t === "d") destAbs = `${to === "/" ? "" : to}/${name}`;
    const copy = JSON.parse(JSON.stringify(node)) as FsNode;
    const dest = this.walk(destAbs);
    if (!dest.parent) throw new Error(`${to}: No such file or directory`);
    dest.parent.k[dest.name] = copy;
  }

  list(abs: string): DirEntry[] {
    const n = this.get(abs);
    if (!n) throw new Error(`${abs}: No such file or directory`);
    if (n.t !== "d") throw new Error(`${abs}: Not a directory`);
    return Object.entries(n.k)
      .map(([name, node]) => ({ name, node }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  treePaths(abs = "/", prefix = ""): string[] {
    const n = this.get(abs);
    if (!n || n.t !== "d") return [];
    const out: string[] = [];
    for (const [name, child] of Object.entries(n.k).sort(([a], [b]) => a.localeCompare(b))) {
      const p = `${prefix}${name}`;
      out.push(child.t === "d" ? p + "/" : p);
      if (child.t === "d") out.push(...this.treePaths(`${abs === "/" ? "" : abs}/${name}`, `${p}/`));
    }
    return out;
  }

  allFiles(abs = "/"): { path: string; content: string }[] {
    const n = this.get(abs);
    if (!n) return [];
    if (n.t === "f") return [{ path: abs, content: n.c }];
    const out: { path: string; content: string }[] = [];
    const walk = (base: string, node: DirNode) => {
      for (const [name, child] of Object.entries(node.k)) {
        const p = base === "/" ? `/${name}` : `${base}/${name}`;
        if (child.t === "f") out.push({ path: p, content: child.c });
        else walk(p, child);
      }
    };
    walk(abs, n);
    return out;
  }
}

export function matchGlob(name: string, glob: string): boolean {
  if (glob === "*") return true;
  const re = new RegExp(
    "^" +
      glob
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".") +
      "$",
  );
  return re.test(name);
}

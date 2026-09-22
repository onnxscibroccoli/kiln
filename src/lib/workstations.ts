import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isDistroId, type DistroId } from "@/lib/linux/distros";
import { slugify } from "@/lib/utils";

export type Workstation = {
  id: string;
  name: string;
  distro: DistroId;
  githubRepo: string | null;
  status: "running" | "stopped";
  lastOpenedAt: string | null;
  createdAt: string;
};

export type WorkstationState = {
  tree: string;
  cwd: string;
  env: Record<string, string>;
  history: string[];
  packages: string[];
};

type WorkstationRow = {
  id: string;
  name: string;
  distro: string;
  github_repo: string | null;
  status: string;
  last_opened_at: string | null;
  created_at: string;
};

function mapBox(row: WorkstationRow): Workstation {
  return {
    id: row.id,
    name: row.name,
    distro: isDistroId(row.distro) ? row.distro : "ubuntu",
    githubRepo: row.github_repo,
    status: row.status === "running" ? "running" : "stopped",
    lastOpenedAt: row.last_opened_at,
    createdAt: row.created_at,
  };
}

const MAX_TREE_BYTES = 400_000;

export const listWorkstations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<WorkstationRow>`
      select id, name, distro, github_repo, status, last_opened_at, created_at
      from workstations
      where user_id = ${context.userId}
      order by coalesce(last_opened_at, created_at) desc
    `;
    return rows.map(mapBox);
  });

const createSchema = z.object({
  name: z.string().trim().min(1).max(48),
  distro: z.string().trim().min(1).max(48).refine(isDistroId, "unknown image"),
  githubRepo: z.string().trim().max(300).optional(),
});

export const createWorkstation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = crypto.randomUUID();
    const name = slugify(data.name, "box");
    const repo = data.githubRepo?.trim() || null;
    await sql`
      insert into workstations (id, user_id, name, distro, github_repo, status, last_opened_at)
      values (${id}, ${context.userId}, ${name}, ${data.distro}, ${repo}, ${"stopped"}, ${null})
    `;
    const rows = await sql<WorkstationRow>`
      select id, name, distro, github_repo, status, last_opened_at, created_at
      from workstations where id = ${id} and user_id = ${context.userId}
    `;
    return mapBox(rows[0]!);
  });

export const getWorkstation = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<WorkstationRow>`
      select id, name, distro, github_repo, status, last_opened_at, created_at
      from workstations where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!rows[0]) return null;
    return mapBox(rows[0]);
  });

export const loadWorkstationState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: string }>`
      select id from workstations where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!owned[0]) return null;
    const rows = await sql<{
      tree: string;
      cwd: string;
      env: string;
      history: string;
      packages: string;
    }>`
      select tree, cwd, env, history, packages
      from workstation_state
      where workstation_id = ${data.id} and user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    let env: Record<string, string> = {};
    let history: string[] = [];
    let packages: string[] = [];
    try {
      env = JSON.parse(row.env) as Record<string, string>;
    } catch {
      env = {};
    }
    try {
      history = JSON.parse(row.history) as string[];
    } catch {
      history = [];
    }
    try {
      packages = JSON.parse(row.packages) as string[];
    } catch {
      packages = [];
    }
    return { tree: row.tree, cwd: row.cwd, env, history, packages } satisfies WorkstationState;
  });

const saveSchema = z.object({
  id: z.string().min(1),
  tree: z.string().min(2).max(MAX_TREE_BYTES),
  cwd: z.string().min(1).max(512),
  env: z.record(z.string(), z.string()),
  history: z.array(z.string()).max(500),
  packages: z.array(z.string()).max(80),
});

export const saveWorkstationState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: string }>`
      select id from workstations where id = ${data.id} and user_id = ${context.userId}
    `;
    if (!owned[0]) throw new Error("Not found");
    const env = JSON.stringify(data.env);
    const history = JSON.stringify(data.history.slice(-400));
    const packages = JSON.stringify(data.packages);
    const existing = await sql<{ workstation_id: string }>`
      select workstation_id from workstation_state
      where workstation_id = ${data.id} and user_id = ${context.userId}
    `;
    if (existing[0]) {
      await sql`
        update workstation_state
        set tree = ${data.tree}, cwd = ${data.cwd}, env = ${env},
            history = ${history}, packages = ${packages}, updated_at = now()
        where workstation_id = ${data.id} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into workstation_state (workstation_id, user_id, tree, cwd, env, history, packages)
        values (${data.id}, ${context.userId}, ${data.tree}, ${data.cwd}, ${env}, ${history}, ${packages})
      `;
    }
    await sql`
      update workstations
      set status = ${"running"}, last_opened_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const touchWorkstation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z.object({ id: z.string().min(1), status: z.enum(["running", "stopped"]) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update workstations
      set status = ${data.status}, last_opened_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const deleteWorkstation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      delete from workstation_state where workstation_id = ${data.id} and user_id = ${context.userId}
    `;
    await sql`
      delete from workstations where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

const imageSchema = z.object({
  id: z.string().min(1),
  distro: z.string().trim().min(1).max(48).refine(isDistroId, "unknown image"),
  githubRepo: z.string().trim().max(300).optional().nullable(),
});

export const updateWorkstationImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => imageSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const repo = data.githubRepo?.trim() || null;
    await sql`
      update workstations
      set distro = ${data.distro}, github_repo = ${repo}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

const TEXT_EXT =
  /\.(md|txt|ts|tsx|js|jsx|mjs|cjs|json|css|html|htm|yml|yaml|toml|py|go|rs|c|h|cc|cpp|java|kt|rb|php|sh|bash|zsh|sql|xml|svg|env|gitignore|dockerignore|editorconfig|prettierrc|eslintrc)$/i;
const TEXT_NAMES = new Set([
  "readme",
  "license",
  "dockerfile",
  "makefile",
  "gemfile",
  "procfile",
  "cargo.toml",
  "go.mod",
  "go.sum",
]);

function isTextPath(path: string): boolean {
  const base = path.split("/").pop()?.toLowerCase() ?? "";
  if (TEXT_NAMES.has(base)) return true;
  if (base.startsWith(".")) return TEXT_EXT.test(base) || !base.includes(".", 1);
  return TEXT_EXT.test(base);
}

function parseGithub(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/, "");
  const short = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (short) return { owner: short[1]!, repo: short[2]! };
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!/github\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0]!, repo: parts[1]!.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export const cloneGithubRepo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ repo: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const parsed = parseGithub(data.repo);
    if (!parsed) return { ok: false as const, name: "", files: {}, error: "not a GitHub repo URL" };
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "Kiln-Workstation",
    };
    const infoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers });
    if (!infoRes.ok) {
      return {
        ok: false as const,
        name: parsed.repo,
        files: {},
        error: infoRes.status === 404 ? "repository not found (public repos only)" : `GitHub HTTP ${infoRes.status}`,
      };
    }
    const info = (await infoRes.json()) as { default_branch?: string };
    const branch = info.default_branch ?? "main";
    const treeRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { headers },
    );
    if (!treeRes.ok) {
      return { ok: false as const, name: parsed.repo, files: {}, error: `could not read tree (${treeRes.status})` };
    }
    const tree = (await treeRes.json()) as {
      tree?: { path: string; type: string; size?: number }[];
    };
    const blobs = (tree.tree ?? [])
      .filter((t) => t.type === "blob")
      .filter((t) => isTextPath(t.path))
      .filter((t) => !t.path.includes("node_modules/") && !t.path.includes("/dist/") && !t.path.includes("/.git/"))
      .filter((t) => (t.size ?? 0) < 80_000)
      .slice(0, 40);

    const files: Record<string, string> = {};
    await Promise.all(
      blobs.map(async (b) => {
        const raw = await fetch(
          `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${b.path}`,
          { headers: { "User-Agent": "Kiln-Workstation" } },
        );
        if (!raw.ok) return;
        const text = await raw.text();
        if (text.length > 80_000) return;
        files[b.path] = text;
      }),
    );
    if (!Object.keys(files).length) {
      return { ok: false as const, name: parsed.repo, files: {}, error: "no text files found (or repo is empty)" };
    }
    return { ok: true as const, name: parsed.repo, files };
  });

export const fetchUrl = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ url: z.string().url().max(2000) }).parse(data))
  .handler(async ({ data }) => {
    let url: URL;
    try {
      url = new URL(data.url);
    } catch {
      return { ok: false, status: 400, body: "invalid URL" };
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, status: 400, body: "only http/https" };
    }
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "0.0.0.0" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.")
    ) {
      return { ok: false, status: 403, body: "refused private host" };
    }
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    try {
      const res = await fetch(url.toString(), {
        signal: ac.signal,
        redirect: "follow",
        headers: { "User-Agent": "Kiln-Workstation" },
      });
      const buf = await res.arrayBuffer();
      const slice = buf.byteLength > 200_000 ? buf.slice(0, 200_000) : buf;
      const body = new TextDecoder("utf-8", { fatal: false }).decode(slice);
      return { ok: res.ok, status: res.status, body };
    } catch (e) {
      return { ok: false, status: 0, body: e instanceof Error ? e.message : "fetch failed" };
    } finally {
      clearTimeout(t);
    }
  });

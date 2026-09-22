import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { DesktopShell } from "@/components/desktop/desktop-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { getDistro } from "@/lib/linux/distros";
import { seedVfs, homeDir, BASE_PACKAGES } from "@/lib/linux/seed";
import { Vfs } from "@/lib/linux/vfs";
import { createState, type ShellHooks, type ShellState } from "@/lib/linux/shell";
import {
  cloneGithubRepo,
  fetchUrl,
  getWorkstation,
  loadWorkstationState,
  saveWorkstationState,
  touchWorkstation,
  updateWorkstationImage,
} from "@/lib/workstations";
import { usernameFromDisplay } from "@/lib/utils";

export function WorkstationView({ id }: { id: string }) {
  const { user, isPending } = useCurrentUserState();
  const boxQ = useQuery({
    queryKey: ["box", id],
    queryFn: () => getWorkstation({ data: { id } }),
    enabled: Boolean(user),
  });
  const stateQ = useQuery({
    queryKey: ["box-state", id],
    queryFn: () => loadWorkstationState({ data: { id } }),
    enabled: Boolean(user),
  });

  if (isPending || (user && (boxQ.isPending || stateQ.isPending))) {
    return (
      <div className="flex h-dvh flex-col">
        <SiteHeader compact />
        <Skeleton className="m-4 flex-1 rounded-xl" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (boxQ.data === null) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="font-display text-2xl">Box not found</p>
          <p className="mt-2 text-sm text-muted-foreground">It may have been deleted, or it is not yours.</p>
          <Button className="mt-6" asChild>
            <Link to="/boxes">Back to boxes</Link>
          </Button>
        </div>
      </div>
    );
  }
  if (!boxQ.data) {
    return (
      <div className="flex h-dvh flex-col">
        <SiteHeader compact />
        <Skeleton className="m-4 flex-1 rounded-xl" />
      </div>
    );
  }

  return <WorkstationSession id={id} box={boxQ.data} saved={stateQ.data ?? null} />;
}

function WorkstationSession({
  id,
  box,
  saved,
}: {
  id: string;
  box: NonNullable<Awaited<ReturnType<typeof getWorkstation>>>;
  saved: Awaited<ReturnType<typeof loadWorkstationState>>;
}) {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const username = usernameFromDisplay(user?.displayName);
  const [distroId, setDistroId] = useState(box.distro);
  const distro = getDistro(distroId);
  const home = homeDir(username);
  const restoring = Boolean(saved?.tree);

  const shellRef = useRef<ShellState | null>(null);
  if (!shellRef.current) {
    const vfs = saved?.tree ? Vfs.fromJSON(saved.tree) : seedVfs({ distro, user: username, hostname: box.name });
    shellRef.current = createState({
      vfs,
      cwd: saved?.cwd && vfs.exists(saved.cwd) ? saved.cwd : home,
      env: saved?.env,
      history: saved?.history,
      packages: saved?.packages?.length ? saved.packages : [...BASE_PACKAGES],
      user: username,
      hostname: box.name,
      distro,
    });
  }

  const [rev, setRev] = useState(0);
  const [openPath, setOpenPath] = useState<string | null>(`${home}/README.md`);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [cloneNote, setCloneNote] = useState<string | null>(null);
  const [termFocus, setTermFocus] = useState(0);
  const cloned = useRef(false);

  const bump = useCallback(() => setRev((n) => n + 1), []);

  const openFile = useCallback(
    (path: string) => {
      const st = shellRef.current!;
      try {
        if (!st.vfs.exists(path)) st.vfs.writeFile(path, "");
        if (st.vfs.isDir(path)) return;
        setOpenPath(path);
        setDraft(st.vfs.readFile(path));
        setDirty(false);
        bump();
      } catch {
        /* ignore */
      }
    },
    [bump],
  );

  const persist = useCallback(async () => {
    const st = shellRef.current!;
    setSaveState("saving");
    try {
      await saveWorkstationState({
        data: {
          id,
          tree: st.vfs.toJSON(),
          cwd: st.cwd,
          env: st.env,
          history: st.history,
          packages: st.packages,
        },
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [id]);

  const hooks = useMemo<ShellHooks>(
    () => ({
      openFile: (path) => {
        openFile(path);
      },
      fetchUrl: async (url) => fetchUrl({ data: { url } }),
      cloneRepo: async (repo) => cloneGithubRepo({ data: { repo } }),
    }),
    [openFile],
  );

  useEffect(() => {
    void touchWorkstation({ data: { id, status: "running" } });
  }, [id]);

  useEffect(() => {
    const st = shellRef.current!;
    if (openPath && st.vfs.isFile(openPath) && !dirty) {
      setDraft(st.vfs.readFile(openPath));
    }
  }, [rev, openPath, dirty]);

  useEffect(() => {
    if (cloned.current) return;
    if (!box.githubRepo || restoring) {
      cloned.current = true;
      void persist();
      return;
    }
    cloned.current = true;
    const st = shellRef.current!;
    void (async () => {
      setCloneNote(`cloning ${box.githubRepo}…`);
      const res = await cloneGithubRepo({ data: { repo: box.githubRepo! } });
      if (!res.ok) {
        setCloneNote(`clone failed: ${res.error}`);
        await persist();
        return;
      }
      const dest = `${home}/projects/${res.name}`;
      st.vfs.mkdir(dest, true);
      for (const [rel, content] of Object.entries(res.files)) {
        const path = `${dest}/${rel}`;
        const dir = path.split("/").slice(0, -1).join("/") || dest;
        st.vfs.mkdir(dir, true);
        st.vfs.writeFile(path, content);
      }
      st.vfs.mkdir(`${dest}/.git`, true);
      st.vfs.writeFile(`${dest}/.git/kiln.json`, JSON.stringify({ branch: "main", staged: [], commits: [] }));
      setCloneNote(`cloned ${res.name} → ~/projects/${res.name}`);
      bump();
      await persist();
    })();
  }, [box.githubRepo, restoring, home, persist, bump]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void persist();
    }, 1800);
    return () => window.clearTimeout(t);
  }, [rev, persist]);

  function saveEditor() {
    const st = shellRef.current!;
    if (!openPath) return;
    st.vfs.writeFile(openPath, draft);
    setDirty(false);
    bump();
    void persist();
  }

  async function onApplyImage(nextId: string, githubRepo: string) {
    const next = getDistro(nextId);
    const st = shellRef.current!;
    st.distro = next;
    st.vfs.writeFile("/etc/os-release", next.osRelease + "\n");
    st.vfs.writeFile("/etc/motd", `Welcome to ${next.pretty} on Kiln.\nPersistent volume attached.\n`);
    st.vfs.writeFile("/etc/issue", `${next.pretty} \\n \\l\n`);
    setDistroId(next.id);
    bump();
    await updateWorkstationImage({
      data: { id, distro: next.id, githubRepo: githubRepo.trim() || null },
    });
    await qc.invalidateQueries({ queryKey: ["box", id] });
    const repo = githubRepo.trim();
    if (repo && repo !== box.githubRepo) {
      setCloneNote(`cloning ${repo}…`);
      const res = await cloneGithubRepo({ data: { repo } });
      if (res.ok) {
        const dest = `${home}/projects/${res.name}`;
        st.vfs.mkdir(dest, true);
        for (const [rel, content] of Object.entries(res.files)) {
          const path = `${dest}/${rel}`;
          const dir = path.split("/").slice(0, -1).join("/") || dest;
          st.vfs.mkdir(dir, true);
          st.vfs.writeFile(path, content);
        }
        setCloneNote(`cloned ${res.name} → ~/projects/${res.name}`);
        bump();
      } else {
        setCloneNote(`clone failed: ${res.error}`);
      }
    }
    await persist();
  }

  const st = shellRef.current!;

  return (
    <DesktopShell
      box={{ ...box, distro: distroId }}
      distro={distro}
      st={st}
      hooks={hooks}
      restoring={restoring}
      home={home}
      rev={rev}
      openPath={openPath}
      draft={draft}
      dirty={dirty}
      saveState={saveState}
      cloneNote={cloneNote}
      termFocus={termFocus}
      onOpenFile={openFile}
      onCwd={(p) => {
        st.cwd = p;
        bump();
      }}
      onDraft={(v) => {
        setDraft(v);
        setDirty(true);
      }}
      onSaveEditor={saveEditor}
      persist={() => void persist()}
      bump={bump}
      onApplyImage={onApplyImage}
    />
  );
}

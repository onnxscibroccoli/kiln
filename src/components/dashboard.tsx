import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Square, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CreateBoxDialog } from "@/components/create-box-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { listWorkstations, deleteWorkstation, touchWorkstation, type Workstation } from "@/lib/workstations";
import { getDistro } from "@/lib/linux/distros";
import { formatRelative, isUnauthorized } from "@/lib/utils";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function Dashboard() {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Workstation | null>(null);
  const qc = useQueryClient();

  const boxes = useQuery({
    queryKey: ["boxes"],
    queryFn: () => listWorkstations(),
    enabled: Boolean(user),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteWorkstation({ data: { id } }),
    onSuccess: async () => {
      setPendingDelete(null);
      await qc.invalidateQueries({ queryKey: ["boxes"] });
    },
  });

  const stop = useMutation({
    mutationFn: (id: string) => touchWorkstation({ data: { id, status: "stopped" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boxes"] }),
  });

  if (isPending) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="mx-auto grid w-full max-w-5xl gap-3 px-4 pt-8 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;

  if (boxes.error && isUnauthorized(boxes.error)) return <RedirectToSignIn />;

  const list = boxes.data ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-16 sm:px-6">
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-sage-dim uppercase">Workstations</p>
            <h1 className="font-display mt-2 text-3xl tracking-tight">Your boxes</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Resume a session or start a new persistent volume.
            </p>
          </div>
          <Button className="h-11" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            New box
          </Button>
        </div>

        {boxes.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl bg-card px-6 py-14 text-center shadow-[var(--shadow-border)]">
            <p className="font-display text-xl">No boxes yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Start Ubuntu, Fedora, Arch, or paste a GitHub image URL. Resume the same desktop later.
            </p>
            <Button className="mt-6" onClick={() => setOpen(true)}>
              Start a box
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((box) => {
              const d = getDistro(box.distro);
              const running = box.status === "running";
              return (
                <li
                  key={box.id}
                  className="flex flex-col rounded-xl bg-card p-4 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/box/$id"
                        params={{ id: box.id }}
                        className="text-base font-medium text-foreground no-underline hover:text-sage"
                      >
                        {box.name}
                      </Link>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{d.pretty}</p>
                    </div>
                    <Badge tone={running ? "good" : "muted"}>{running ? "warm" : "hibernated"}</Badge>
                  </div>
                  {box.githubRepo && (
                    <p className="mt-3 truncate font-mono text-xs text-sage-dim">{box.githubRepo}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                    Last opened {formatRelative(box.lastOpenedAt)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link to="/box/$id" params={{ id: box.id }}>
                        <Play className="size-3.5" />
                        Resume
                      </Link>
                    </Button>
                    {running && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => stop.mutate(box.id)}
                        disabled={stop.isPending}
                      >
                        <Square className="size-3.5" />
                        Stop
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setPendingDelete(box)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <CreateBoxDialog open={open} onOpenChange={setOpen} />
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The persistent volume is removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => pendingDelete && del.mutate(pendingDelete.id)}
            >
              Delete box
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

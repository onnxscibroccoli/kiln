import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { VmDisplay } from "@/components/desktop/vm-display";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootSpecFor } from "@/lib/linux/boot-image";
import { getDistro } from "@/lib/linux/distros";
import { getWorkstation, touchWorkstation } from "@/lib/workstations";
import { useEffect } from "react";

export function WorkstationView({ id }: { id: string }) {
  const { user, isPending } = useCurrentUserState();
  const boxQ = useQuery({
    queryKey: ["box", id],
    queryFn: () => getWorkstation({ data: { id } }),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user || !boxQ.data) return;
    void touchWorkstation({ data: { id, status: "running" } });
  }, [user, boxQ.data, id]);

  if (isPending || (user && boxQ.isPending)) {
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

  const box = boxQ.data;
  const distro = getDistro(box.distro);
  const boot = bootSpecFor(distro, box.githubRepo);

  return <VmDisplay boxId={box.id} host={box.name} boot={boot} />;
}

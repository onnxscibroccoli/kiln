import { type Distro } from "@/lib/linux/distros";
import { type Workstation } from "@/lib/workstations";

export function SettingsApp({
  box,
  distro,
  user,
}: {
  box: Workstation;
  distro: Distro;
  user: string;
}) {
  return (
    <div className="h-full overflow-auto px-4 py-4">
      <p className="font-display text-xl tracking-tight">Settings</p>
      <dl className="mt-4 grid gap-3 text-sm">
        <Row k="Hostname" v={box.name} />
        <Row k="Image" v={distro.pretty} />
        <Row k="Desktop" v="XFCE · display :0" />
        <Row k="Packages" v={distro.pkgBin} />
        <Row k="User" v={user} />
        {box.githubRepo && <Row k="GitHub" v={box.githubRepo} />}
      </dl>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
        This tab is the graphical session: control strip, wallpaper, Applications menu, Thunar, and
        Ristretto. A native X11 + TigerVNC + noVNC (or KasmVNC) stack is in the Kiln GitHub repo for
        machines you administer.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-2 sm:grid-cols-[8rem_1fr]">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono text-xs sm:text-sm">{v}</dd>
    </div>
  );
}

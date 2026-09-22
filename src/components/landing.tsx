import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBoxDialog } from "@/components/create-box-dialog";
import { FEATURED_IDS, getDistro } from "@/lib/linux/distros";
import { FolderGit2, HardDrive, LayoutGrid } from "lucide-react";

const BOOT = [
  "[    0.000000] Linux version 6.8.0-kiln (gcc 13.2.0)",
  "[    0.118000] kiln-fs: mounting persistent volume on /",
  "[    0.184000] kiln-fs: restoring last session for flint",
  "[    0.318000] kiln-init: Ubuntu 24.04.1 LTS",
  "",
  "Welcome to Kiln. Persistent volume attached.",
  "cinder@flint:~$ neofetch",
];

export function Landing() {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-20 sm:px-6">
        <section className="grid items-center gap-12 pt-10 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.18em] text-sage-dim uppercase">Browser workstation</p>
            <h1 className="font-display mt-4 text-4xl leading-[1.1] font-medium tracking-tight text-paper italic sm:text-5xl lg:text-6xl">
              A Linux desktop in the browser.
              <span className="mt-1 block not-italic text-foreground">It is still here when you come back.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Sign in with Google, X, or email. Start a real x86 machine in this tab — Tiny Core
              Linux with X11 — or point it at a 32-bit live ISO.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isPending ? (
                <>
                  <Skeleton className="h-12 w-40 rounded-md" />
                  <Skeleton className="h-12 w-36 rounded-md" />
                </>
              ) : user ? (
                <>
                  <Button className="h-12 px-5" onClick={() => setOpen(true)}>
                    Start a box
                  </Button>
                  <Button variant="outline" className="h-12 px-5" asChild>
                    <Link to="/boxes">Open dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="h-12 px-5" asChild>
                    <Link to="/login">Start a box</Link>
                  </Button>
                  <Button variant="outline" className="h-12 px-5" asChild>
                    <Link to="/login">Continue a session</Link>
                  </Button>
                </>
              )}
            </div>
            <SignedOut>
              <p className="mt-4 text-xs text-muted-foreground">
                Google, X, or email — same account resumes the same machines.
              </p>
            </SignedOut>
            <SignedIn>
              <p className="mt-4 text-xs text-muted-foreground">Signed in. Your boxes wait on the dashboard.</p>
            </SignedIn>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl bg-terminal p-3 shadow-[var(--shadow-border)] sm:p-4">
            <div className="mb-3 flex items-center gap-1.5 px-1">
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">cinder@flint</span>
            </div>
            <pre className="max-w-full overflow-x-auto font-mono text-[11px] leading-5 text-sage sm:text-xs">
              {BOOT.join("\n")}
              {"\n"}
              <span className="text-foreground/80">{"               OS: Ubuntu 24.04.1 LTS"}</span>
              {"\n"}
              <span className="text-foreground/80">{"           Kernel: 6.8.0-41-generic"}</span>
              {"\n"}
              <span className="text-muted-foreground">cinder@flint:~$</span>
              <span className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 bg-sage align-middle" />
            </pre>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Feature
            icon={<LayoutGrid className="size-4" />}
            title="Real machine"
            body="An actual x86 PC in this tab: BIOS, Linux kernel, X11. Click the display and use it like local hardware."
          />
          <Feature
            icon={<HardDrive className="size-4" />}
            title="Snapshot"
            body="Save the running machine and come back later. Same box, same display."
          />
          <Feature
            icon={<FolderGit2 className="size-4" />}
            title="Your ISO"
            body="Tiny Core Linux is included. Paste a 32-bit live ISO URL to boot something else."
          />
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl tracking-tight">Images</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Search live images, or paste a 32-bit ISO URL. Tiny Core boots a real X11 desktop.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {FEATURED_IDS.map((id) => {
              const d = getDistro(id);
              return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  if (user) setOpen(true);
                  else void navigate({ to: "/login" });
                }}
                className="rounded-xl bg-card p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
              >
                <div className="text-sm font-medium">{d.name}</div>
                <div className="font-mono text-xs text-sage-dim">{d.pretty}</div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.summary}</p>
              </button>
            );
            })}
          </div>
        </section>
      </main>
      <footer className="px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        Kiln keeps workstations per account. No cloud VM bill — the box runs in this browser, state lives with you.
      </footer>
      <CreateBoxDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
      <div className="flex size-9 items-center justify-center rounded-md bg-accent text-sage">{icon}</div>
      <h3 className="mt-3 text-sm font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

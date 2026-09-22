import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchImages, inferDistroFromGithub, type Distro } from "@/lib/linux/distros";
import { cn } from "@/lib/utils";

export function ImageBrowser({
  selected,
  onSelect,
  githubRepo,
  onGithubRepo,
  compact,
}: {
  selected: string;
  onSelect: (distro: Distro) => void;
  githubRepo: string;
  onGithubRepo: (value: string) => void;
  compact?: boolean;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => searchImages(q), [q]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Ubuntu, Fedora, Arch, Kali…"
          className="h-11 pl-9"
          aria-label="Search Linux images"
        />
      </div>
      <div className={cn("grid gap-2 overflow-auto", compact ? "max-h-56 sm:grid-cols-2" : "max-h-72 sm:grid-cols-3")}>
        {list.length === 0 ? (
          <p className="col-span-full px-1 py-6 text-sm text-muted-foreground">
            No catalog match. Paste a GitHub image URL below.
          </p>
        ) : (
          list.map((d) => {
            const active = selected === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  onSelect(d);
                  if (d.github) onGithubRepo(d.github);
                }}
                className={cn(
                  "rounded-lg p-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150",
                  active ? "ring-1 ring-sage/50 shadow-[var(--shadow-border-hover)]" : "hover:shadow-[var(--shadow-border-hover)]",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{d.name}</span>
                  <span className="font-mono text-[10px] text-sage-dim">{d.pkgBin}</span>
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{d.version}</div>
                <p className="mt-2 text-xs leading-snug text-muted-foreground">{d.summary}</p>
              </button>
            );
          })
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gh-image">GitHub image URL</Label>
        <Input
          id="gh-image"
          value={githubRepo}
          onChange={(e) => {
            const v = e.target.value;
            onGithubRepo(v);
            const inferred = inferDistroFromGithub(v);
            if (inferred) onSelect(inferred);
          }}
          placeholder="owner/repo or https://github.com/owner/repo"
        />
        <p className="text-xs text-muted-foreground">
          Public GitHub repos clone into ~/projects. Catalog images set the desktop, packages, and wallpaper.
        </p>
      </div>
    </div>
  );
}

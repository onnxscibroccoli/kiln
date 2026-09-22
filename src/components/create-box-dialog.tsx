import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageBrowser } from "@/components/desktop/image-browser";
import { getDistro, type Distro } from "@/lib/linux/distros";
import { createWorkstation } from "@/lib/workstations";

const NAMES = ["flint", "ember", "basalt", "hearth", "anvil", "shale", "cinder", "forge", "slag", "oak"];

export function CreateBoxDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState(() => NAMES[Math.floor(Math.random() * NAMES.length)]!);
  const [image, setImage] = useState<Distro>(() => getDistro("ubuntu"));
  const [githubRepo, setGithubRepo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createWorkstation({
        data: { name, distro: image.id, githubRepo: githubRepo.trim() || undefined },
      }),
    onSuccess: async (box) => {
      await qc.invalidateQueries({ queryKey: ["boxes"] });
      onOpenChange(false);
      void navigate({ to: "/box/$id", params: { id: box.id } });
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Could not create box");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New workstation</DialogTitle>
          <DialogDescription>
            Search a Linux image, or paste a public GitHub URL. The desktop boots in this browser.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="box-name">Name</Label>
            <Input
              id="box-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={48}
              autoFocus
            />
          </div>
          <ImageBrowser
            selected={image.id}
            onSelect={setImage}
            githubRepo={githubRepo}
            onGithubRepo={setGithubRepo}
            compact
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Starting…" : "Start desktop"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
